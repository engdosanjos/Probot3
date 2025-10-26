
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'active';

    let predictions;
    
    if (type === 'active') {
      predictions = await prisma.prediction.findMany({
        where: { isResolved: false },
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
              league: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (type === 'recent') {
      predictions = await prisma.prediction.findMany({
        where: { isResolved: true },
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
              league: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      });
    } else {
      predictions = await prisma.prediction.findMany({
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
              league: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    }

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, type, confidence, stats } = body;

    // Get current bankroll
    const config = await prisma.config.findFirst();
    if (!config) {
      return NextResponse.json({ error: 'System configuration not found' }, { status: 400 });
    }

    const stake = (config.bankroll * config.stakePercentage) / 100;

    const prediction = await prisma.prediction.create({
      data: {
        matchId,
        type,
        predictionMinute: stats.minute || 0,
        stake,
        confidenceScore: confidence,
        homeXGAtPrediction: stats.xgHome || 0,
        awayXGAtPrediction: stats.xgAway || 0,
        homeShotsAtPrediction: stats.shotsHome || 0,
        awayShotsAtPrediction: stats.shotsAway || 0,
        homeCornersAtPrediction: stats.cornersHome || 0,
        awayCornersAtPrediction: stats.cornersAway || 0,
        homeBigChancesAtPrediction: stats.bigChancesHome || 0,
        awayBigChancesAtPrediction: stats.bigChancesAway || 0
      },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            league: true
          }
        }
      }
    });

    return NextResponse.json({ prediction });
  } catch (error) {
    console.error('Error creating prediction:', error);
    return NextResponse.json({ error: 'Failed to create prediction' }, { status: 500 });
  }
}
