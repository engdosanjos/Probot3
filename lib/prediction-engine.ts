
import { PrismaClient, PredictionType } from '@prisma/client';

const prisma = new PrismaClient();

interface MatchStats {
  xgHome: number;
  xgAway: number;
  shotsHome: number;
  shotsAway: number;
  shotsOnHome: number;
  shotsOnAway: number;
  cornersHome: number;
  cornersAway: number;
  bigChancesHome: number;
  bigChancesAway: number;
  minute: number;
  goalsHome: number;
  goalsAway: number;
}

interface PredictionWeights {
  id: string;
  htXGWeight: number;
  htShotsWeight: number;
  htCornersWeight: number;
  htBigChancesWeight: number;
  ftXGWeight: number;
  ftShotsWeight: number;
  ftCornersWeight: number;
  ftBigChancesWeight: number;
  bttsXGBothWeight: number;
  bttsShotsBothWeight: number;
  bttsChancesBothWeight: number;
  htThreshold: number;
  ftThreshold: number;
  bttsThreshold: number;
  accuracy: number;
  totalPredictions: number;
}

export class PredictionEngine {
  private currentWeights: PredictionWeights | null = null;
  
  constructor() {
    this.initializeWeights();
  }

  async initializeWeights() {
    try {
      let weights = await prisma.mLWeights.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      if (!weights) {
        // Create initial weights
        weights = await prisma.mLWeights.create({
          data: {
            version: '1.0.0',
            isActive: true
          }
        });
        console.log('[prediction] Created initial ML weights');
      }

      this.currentWeights = weights;
      console.log('[prediction] Loaded ML weights version:', weights.version);
    } catch (error) {
      console.error('[prediction] Error initializing weights:', error);
    }
  }

  // Calculate HT goal probability based on current match stats
  calculateHTGoalProbability(stats: MatchStats): number {
    if (!this.currentWeights || stats.minute >= 45) return 0;

    const weights = this.currentWeights;
    
    // Normalize stats (0-1 scale based on typical match values)
    const normalizedXG = Math.min((stats.xgHome + stats.xgAway) / 3.0, 1);
    const normalizedShots = Math.min((stats.shotsHome + stats.shotsAway) / 20, 1);
    const normalizedShotsOnTarget = Math.min((stats.shotsOnHome + stats.shotsOnAway) / 10, 1);
    const normalizedCorners = Math.min((stats.cornersHome + stats.cornersAway) / 12, 1);
    const normalizedChances = Math.min((stats.bigChancesHome + stats.bigChancesAway) / 8, 1);
    
    // Shot conversion rate (shots on target / total shots) - indicates quality
    const totalShots = stats.shotsHome + stats.shotsAway;
    const shotsOnTarget = stats.shotsOnHome + stats.shotsOnAway;
    const conversionQuality = totalShots > 0 ? shotsOnTarget / totalShots : 0;
    
    // Momentum indicator - high activity suggests imminent goal
    const attackingMomentum = (normalizedShots + normalizedShotsOnTarget + normalizedChances) / 3;
    
    // Time factor - more aggressive predictions early in first half
    const timeFactor = Math.max(0, (45 - stats.minute) / 45);
    
    // Pressure indicator - corners + dangerous attacks suggest sustained pressure
    const pressureIndicator = normalizedCorners * 0.7 + attackingMomentum * 0.3;
    
    const score = (
      normalizedXG * weights.htXGWeight * 1.2 +
      normalizedShots * weights.htShotsWeight * 0.8 +
      normalizedShotsOnTarget * weights.htShotsWeight * 1.3 +
      normalizedCorners * weights.htCornersWeight +
      normalizedChances * weights.htBigChancesWeight * 1.5 +
      conversionQuality * 0.25 +
      pressureIndicator * 0.2
    ) * timeFactor;

    return Math.min(score, 1);
  }

  // Calculate FT goal probability
  calculateFTGoalProbability(stats: MatchStats): number {
    if (!this.currentWeights || stats.minute >= 90) return 0;

    const weights = this.currentWeights;
    
    const normalizedXG = Math.min((stats.xgHome + stats.xgAway) / 4.0, 1);
    const normalizedShots = Math.min((stats.shotsHome + stats.shotsAway) / 25, 1);
    const normalizedCorners = Math.min((stats.cornersHome + stats.cornersAway) / 15, 1);
    const normalizedChances = Math.min((stats.bigChancesHome + stats.bigChancesAway) / 10, 1);
    
    // Time factor - different rewards for predictions before/after 45min
    const timeFactor = Math.max(0, (90 - stats.minute) / 90);
    
    const score = (
      normalizedXG * weights.ftXGWeight +
      normalizedShots * weights.ftShotsWeight +
      normalizedCorners * weights.ftCornersWeight +
      normalizedChances * weights.ftBigChancesWeight
    ) * timeFactor;

    return Math.min(score, 1);
  }

  // Calculate BTTS probability
  calculateBTTSProbability(stats: MatchStats): number {
    if (!this.currentWeights || stats.minute >= 85) return 0;
    if (stats.goalsHome > 0 && stats.goalsAway > 0) return 0; // Already happened

    const weights = this.currentWeights;
    
    // Balance between both teams' attacking stats
    const homeAttackStrength = (stats.xgHome + stats.shotsOnHome + stats.bigChancesHome) / 3;
    const awayAttackStrength = (stats.xgAway + stats.shotsOnAway + stats.bigChancesAway) / 3;
    
    const bothTeamsAttacking = Math.min(homeAttackStrength, awayAttackStrength) / 
                              Math.max(homeAttackStrength, awayAttackStrength, 0.1);
    
    const totalXG = Math.min((stats.xgHome + stats.xgAway) / 3.5, 1);
    const totalShots = Math.min((stats.shotsOnHome + stats.shotsOnAway) / 12, 1);
    const totalChances = Math.min((stats.bigChancesHome + stats.bigChancesAway) / 8, 1);
    
    const timeFactor = Math.max(0, (85 - stats.minute) / 85);
    
    const score = (
      totalXG * weights.bttsXGBothWeight +
      totalShots * weights.bttsShotsBothWeight +
      totalChances * weights.bttsChancesBothWeight
    ) * bothTeamsAttacking * timeFactor;

    return Math.min(score, 1);
  }

  // Main prediction logic
  async analyzeMatch(matchId: string): Promise<any[]> {
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          predictions: {
            where: { isResolved: false }
          }
        }
      });

      if (!match || match.isFinished || !this.currentWeights) {
        return [];
      }

      const stats: MatchStats = {
        xgHome: match.xgHome,
        xgAway: match.xgAway,
        shotsHome: match.shotsHome,
        shotsAway: match.shotsAway,
        shotsOnHome: match.shotsOnHome,
        shotsOnAway: match.shotsOnAway,
        cornersHome: match.cornersHome,
        cornersAway: match.cornersAway,
        bigChancesHome: match.bigChancesHome,
        bigChancesAway: match.bigChancesAway,
        minute: match.minute || 0,
        goalsHome: match.goalsHome,
        goalsAway: match.goalsAway
      };

      const predictions = [];

      // Check HT prediction
      if (stats.minute < 45) {
        const htProb = this.calculateHTGoalProbability(stats);
        if (htProb > this.currentWeights.htThreshold) {
          const existingHT = match.predictions.find(p => p.type === 'HT');
          if (!existingHT) {
            predictions.push({
              type: 'HT',
              probability: htProb,
              reason: 'High xG and attacking stats suggest goal before half-time'
            });
          }
        }
      }

      // Check FT prediction
      if (stats.minute < 85) {
        const ftProb = this.calculateFTGoalProbability(stats);
        if (ftProb > this.currentWeights.ftThreshold) {
          const existingFT = match.predictions.find(p => p.type === 'FT');
          if (!existingFT) {
            predictions.push({
              type: 'FT',
              probability: ftProb,
              reason: 'Strong attacking indicators suggest goal in this match'
            });
          }
        }
      }

      // Check BTTS prediction
      if (stats.minute < 80 && (stats.goalsHome === 0 || stats.goalsAway === 0)) {
        const bttsProb = this.calculateBTTSProbability(stats);
        if (bttsProb > this.currentWeights.bttsThreshold) {
          const existingBTTS = match.predictions.find(p => p.type === 'BTTS');
          if (!existingBTTS) {
            predictions.push({
              type: 'BTTS',
              probability: bttsProb,
              reason: 'Both teams showing good attacking threat'
            });
          }
        }
      }

      return predictions.map(pred => ({
        ...pred,
        matchId,
        stats
      }));

    } catch (error) {
      console.error('[prediction] Error analyzing match:', error);
      return [];
    }
  }

  // Create actual prediction in database
  async makePrediction(matchId: string, type: PredictionType, probability: number, stats: MatchStats): Promise<string | null> {
    try {
      // Get current bankroll and calculate stake
      const config = await this.getBankConfig();
      const stake = (config.bankroll * config.stakePercentage) / 100;

      const prediction = await prisma.prediction.create({
        data: {
          matchId,
          type,
          predictionMinute: stats.minute,
          stake,
          confidenceScore: probability,
          homeXGAtPrediction: stats.xgHome,
          awayXGAtPrediction: stats.xgAway,
          homeShotsAtPrediction: stats.shotsHome,
          awayShotsAtPrediction: stats.shotsAway,
          homeCornersAtPrediction: stats.cornersHome,
          awayCornersAtPrediction: stats.cornersAway,
          homeBigChancesAtPrediction: stats.bigChancesHome,
          awayBigChancesAtPrediction: stats.bigChancesAway
        }
      });

      console.log(`[prediction] Made ${type} prediction for match ${matchId} with confidence ${probability.toFixed(3)}`);
      return prediction.id;
    } catch (error) {
      console.error('[prediction] Error making prediction:', error);
      return null;
    }
  }

  // Resolve predictions when matches end or goals scored
  async resolvePredictions(matchId: string) {
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          predictions: {
            where: { isResolved: false }
          }
        }
      });

      if (!match || !match.predictions?.length) return;

      const config = await this.getBankConfig();

      for (const prediction of match.predictions) {
        let isCorrect = false;
        let profit = -1.0; // Default loss

        switch (prediction.type) {
          case 'HT':
            isCorrect = (match.htGoalsHome ?? 0) > 0 || (match.htGoalsAway ?? 0) > 0;
            if (isCorrect) profit = 0.3;
            break;
            
          case 'FT':
            isCorrect = match.goalsHome > 0 || match.goalsAway > 0;
            if (isCorrect) {
              profit = prediction.predictionMinute < 45 ? 0.1 : 0.3;
            }
            break;
            
          case 'BTTS':
            isCorrect = match.goalsHome > 0 && match.goalsAway > 0;
            if (isCorrect) profit = 0.2;
            break;
        }

        // Update prediction
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            isResolved: true,
            isCorrect,
            profit: profit * prediction.stake
          }
        });

        // Update bankroll
        const newBankroll = config.bankroll + (profit * prediction.stake);
        await prisma.config.updateMany({
          data: { bankroll: newBankroll }
        });

        // Record bank history
        await prisma.bankHistory.create({
          data: {
            previousBalance: config.bankroll,
            newBalance: newBankroll,
            change: profit * prediction.stake,
            reason: isCorrect ? 'prediction_win' : 'prediction_loss',
            predictionId: prediction.id
          }
        });

        console.log(`[prediction] Resolved ${prediction.type} prediction: ${isCorrect ? 'WIN' : 'LOSS'}, profit: ${(profit * prediction.stake).toFixed(2)}u`);
      }

      // Update learning algorithm
      await this.updateWeights(match.id);

    } catch (error) {
      console.error('[prediction] Error resolving predictions:', error);
    }
  }

  private async updateWeights(matchId: string) {
    try {
      // Get prediction results for this match
      const predictions = await prisma.prediction.findMany({
        where: { matchId, isResolved: true }
      });

      if (!predictions.length || !this.currentWeights) return;

      // Calculate success rate for weight adjustment
      const successRate = predictions.filter(p => p.isCorrect).length / predictions.length;
      const adjustment = (successRate - 0.5) * 0.05; // Small adjustments

      // Update weights based on performance
      await prisma.mLWeights.update({
        where: { id: this.currentWeights.id },
        data: {
          accuracy: (this.currentWeights.accuracy * this.currentWeights.totalPredictions + successRate) / (this.currentWeights.totalPredictions + 1),
          totalPredictions: this.currentWeights.totalPredictions + 1,
          // Adjust thresholds based on performance
          htThreshold: Math.max(0.3, Math.min(0.9, this.currentWeights.htThreshold + adjustment)),
          ftThreshold: Math.max(0.3, Math.min(0.9, this.currentWeights.ftThreshold + adjustment)),
          bttsThreshold: Math.max(0.4, Math.min(0.9, this.currentWeights.bttsThreshold + adjustment))
        }
      });

      console.log(`[prediction] Updated weights based on ${predictions.length} predictions (${(successRate * 100).toFixed(1)}% success)`);
    } catch (error) {
      console.error('[prediction] Error updating weights:', error);
    }
  }

  private async getBankConfig() {
    let config = await prisma.config.findFirst();
    if (!config) {
      config = await prisma.config.create({
        data: {
          bankroll: 100.0,
          stakePercentage: 5.0
        }
      });
    }
    return config;
  }

  // Main prediction loop - analyze all active matches
  async analyzeLiveMatches(): Promise<any[]> {
    try {
      const liveMatches = await prisma.match.findMany({
        where: {
          isBeingTracked: true,
          isFinished: false
        }
      });

      const allPredictions = [];
      for (const match of liveMatches) {
        const predictions = await this.analyzeMatch(match.id);
        allPredictions.push(...predictions);
      }

      return allPredictions;
    } catch (error) {
      console.error('[prediction] Error analyzing live matches:', error);
      return [];
    }
  }
}
