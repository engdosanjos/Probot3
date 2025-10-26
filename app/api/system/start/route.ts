
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { FootballScraper } from '@/lib/scraper';
import { PredictionEngine } from '@/lib/prediction-engine';
import { TelegramNotifier } from '@/lib/telegram';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Global instances
let scraper: FootballScraper | null = null;
let predictionEngine: PredictionEngine | null = null;
let telegramNotifier: TelegramNotifier | null = null;
let isSystemRunning = false;

export async function POST() {
  try {
    if (isSystemRunning) {
      return NextResponse.json({ message: 'System already running' });
    }

    // Get config
    const config = await prisma.config.findFirst();
    if (!config?.isSystemActive) {
      return NextResponse.json({ error: 'System is not active' }, { status: 400 });
    }

    // Initialize components
    scraper = new FootballScraper();
    predictionEngine = new PredictionEngine();
    
    if (config.telegramBotToken && config.telegramChatId) {
      telegramNotifier = new TelegramNotifier(config.telegramBotToken, config.telegramChatId);
    }

    // Start the system
    isSystemRunning = true;
    
    // Start scraping in background
    scraper.startScraping().catch(console.error);
    
    // Start prediction analysis loop
    startPredictionLoop();
    
    console.log('[system] Goal prediction system started successfully');
    
    return NextResponse.json({ message: 'System started successfully' });
  } catch (error) {
    console.error('Error starting system:', error);
    isSystemRunning = false;
    return NextResponse.json({ error: 'Failed to start system' }, { status: 500 });
  }
}

async function startPredictionLoop() {
  while (isSystemRunning) {
    try {
      if (predictionEngine) {
        // Analyze live matches for potential predictions
        const predictions = await predictionEngine.analyzeLiveMatches();
        
        for (const prediction of predictions) {
          // Make the prediction
          const predictionId = await predictionEngine.makePrediction(
            prediction.matchId,
            prediction.type,
            prediction.probability,
            prediction.stats
          );

          if (predictionId && telegramNotifier) {
            // Get match details for notification
            const match = await prisma.match.findUnique({
              where: { id: prediction.matchId },
              include: {
                homeTeam: true,
                awayTeam: true,
                league: true
              }
            });

            if (match) {
              const config = await prisma.config.findFirst();
              const stake = (config?.bankroll || 100) * (config?.stakePercentage || 5) / 100;
              
              await telegramNotifier.sendPredictionNotification(
                match.homeTeam.name,
                match.awayTeam.name,
                match.league.name,
                prediction.type,
                prediction.probability,
                stake
              );
            }
          }
        }

        // Check for predictions to resolve
        const activeMatches = await prisma.match.findMany({
          where: {
            isBeingTracked: true,
            predictions: {
              some: { isResolved: false }
            }
          },
          include: {
            predictions: {
              where: { isResolved: false }
            }
          }
        });

        for (const match of activeMatches) {
          // Check if match ended or goals scored that resolve predictions
          const shouldResolve = match.isFinished || 
            (match.minute && match.minute >= 90) ||
            (match.predictions.some((p: any) => 
              (p.type === 'HT' && match.minute && match.minute >= 45) ||
              (p.type === 'BTTS' && match.goalsHome > 0 && match.goalsAway > 0)
            ));

          if (shouldResolve) {
            await predictionEngine.resolvePredictions(match.id);
          }
        }
      }
      
      // Wait 30 seconds before next analysis
      await new Promise(resolve => setTimeout(resolve, 30000));
      
    } catch (error) {
      console.error('[system] Error in prediction loop:', error);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

export async function DELETE() {
  try {
    isSystemRunning = false;
    
    if (scraper) {
      scraper.stop();
      await scraper.close();
      scraper = null;
    }
    
    predictionEngine = null;
    telegramNotifier = null;
    
    console.log('[system] Goal prediction system stopped');
    
    return NextResponse.json({ message: 'System stopped successfully' });
  } catch (error) {
    console.error('Error stopping system:', error);
    return NextResponse.json({ error: 'Failed to stop system' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    isRunning: isSystemRunning,
    hasInstances: {
      scraper: scraper !== null,
      predictionEngine: predictionEngine !== null,
      telegramNotifier: telegramNotifier !== null
    }
  });
}
