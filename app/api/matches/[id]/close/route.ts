
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PredictionEngine } from '@/lib/prediction-engine';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;

    // Get match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        predictions: {
          where: { isResolved: false }
        }
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Resolve any pending predictions
    if (match.predictions.length > 0) {
      const predictionEngine = new PredictionEngine();
      await predictionEngine.initializeWeights();
      await predictionEngine.resolvePredictions(matchId);
    }

    // Mark match as finished and stop tracking
    await prisma.match.update({
      where: { id: matchId },
      data: {
        isFinished: true,
        isBeingTracked: false,
        status: 'Finished'
      }
    });

    console.log(`[api] Manually closed match: ${match.homeTeamId} vs ${match.awayTeamId}`);

    return NextResponse.json({ 
      success: true,
      message: 'Match closed successfully' 
    });
  } catch (error) {
    console.error('Error closing match:', error);
    return NextResponse.json({ 
      error: 'Failed to close match' 
    }, { status: 500 });
  }
}
