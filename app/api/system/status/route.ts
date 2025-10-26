
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const config = await prisma.config.findFirst();
    
    const stats = await prisma.$transaction([
      prisma.match.count({ where: { isBeingTracked: true, isFinished: false } }),
      prisma.match.count({ where: { isFinished: true } }),
      prisma.prediction.count({ where: { isResolved: false } }),
      prisma.prediction.count({ where: { isResolved: true, isCorrect: true } }),
      prisma.prediction.count({ where: { isResolved: true, isCorrect: false } }),
    ]);
    
    const [liveMatches, finishedMatches, activePredictions, wonPredictions, lostPredictions] = stats;
    const totalResolved = wonPredictions + lostPredictions;
    const winRate = totalResolved > 0 ? (wonPredictions / totalResolved) * 100 : 0;
    
    return NextResponse.json({
      isActive: config?.isSystemActive || false,
      bankroll: config?.bankroll || 100,
      liveMatches,
      finishedMatches,
      activePredictions,
      wonPredictions,
      lostPredictions,
      totalPredictions: totalResolved,
      winRate: winRate.toFixed(1),
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
