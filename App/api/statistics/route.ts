
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get overall statistics
    const totalPredictions = await prisma.prediction.count({ where: { isResolved: true } });
    const correctPredictions = await prisma.prediction.count({ 
      where: { isResolved: true, isCorrect: true } 
    });
    
    const activePredictions = await prisma.prediction.count({ where: { isResolved: false } });
    
    // Get current config
    const config = await prisma.config.findFirst();
    const currentBankroll = config?.bankroll || 100;
    
    // Get recent bank history for profit calculation
    const recentHistory = await prisma.bankHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayHistory = recentHistory.filter(h => h.createdAt >= todayStart);
    const todayProfit = todayHistory.reduce((sum, h) => sum + h.change, 0);
    
    // Get predictions by type
    const htStats = await prisma.prediction.groupBy({
      by: ['isCorrect'],
      where: { type: 'HT', isResolved: true },
      _count: true
    });
    
    const ftStats = await prisma.prediction.groupBy({
      by: ['isCorrect'],
      where: { type: 'FT', isResolved: true },
      _count: true
    });
    
    const bttsStats = await prisma.prediction.groupBy({
      by: ['isCorrect'],
      where: { type: 'BTTS', isResolved: true },
      _count: true
    });

    // Calculate accuracies by type
    const getAccuracy = (stats: any[]) => {
      const total = stats.reduce((sum, s) => sum + s._count, 0);
      const correct = stats.find(s => s.isCorrect)?._count || 0;
      return total > 0 ? correct / total : 0;
    };

    const statistics = {
      overall: {
        totalPredictions,
        correctPredictions,
        accuracy: totalPredictions > 0 ? correctPredictions / totalPredictions : 0,
        activePredictions,
        currentBankroll,
        todayProfit,
        greens: correctPredictions,
        reds: totalPredictions - correctPredictions
      },
      byType: {
        HT: {
          accuracy: getAccuracy(htStats),
          total: htStats.reduce((sum, s) => sum + s._count, 0)
        },
        FT: {
          accuracy: getAccuracy(ftStats),
          total: ftStats.reduce((sum, s) => sum + s._count, 0)
        },
        BTTS: {
          accuracy: getAccuracy(bttsStats),
          total: bttsStats.reduce((sum, s) => sum + s._count, 0)
        }
      },
      recentHistory: recentHistory.slice(0, 20)
    };

    return NextResponse.json({ statistics });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
