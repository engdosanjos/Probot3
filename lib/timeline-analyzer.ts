import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TimelineSnapshot {
  minute: number;
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
}

interface MomentumAnalysis {
  hasPositiveMomentum: boolean;
  momentumScore: number;
  attackingIntensity: number;
  pressureLevel: number;
  dangerLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recentTrends: {
    xgTrend: number;
    shotsTrend: number;
    cornersTrend: number;
    chancesTrend: number;
  };
  preGoalIndicators: string[];
}

export class TimelineAnalyzer {
  
  // Analisa a linha do tempo das últimas N snapshots para identificar padrões pré-gol
  async analyzeMatchTimeline(matchId: string, lookbackMinutes: number = 10): Promise<MomentumAnalysis> {
    try {
      // Buscar últimos snapshots
      const snapshots = await prisma.statSnapshot.findMany({
        where: { matchId },
        orderBy: { minute: 'desc' },
        take: Math.ceil(lookbackMinutes / 2), // Assumindo snapshot a cada ~2 minutos
      });

      if (snapshots.length < 2) {
        return this.getDefaultAnalysis();
      }

      // Ordenar do mais antigo para mais recente
      const timeline = snapshots.reverse();
      
      // Calcular tendências
      const trends = this.calculateTrends(timeline);
      
      // Calcular momentum
      const momentum = this.calculateMomentum(timeline);
      
      // Calcular intensidade de ataque
      const intensity = this.calculateAttackingIntensity(timeline);
      
      // Calcular nível de pressão
      const pressure = this.calculatePressureLevel(timeline);
      
      // Identificar indicadores de gol iminente
      const indicators = this.identifyPreGoalIndicators(timeline, trends, momentum, intensity, pressure);
      
      // Determinar nível de perigo
      const dangerLevel = this.calculateDangerLevel(momentum, intensity, pressure, indicators.length);
      
      return {
        hasPositiveMomentum: momentum > 0.6,
        momentumScore: momentum,
        attackingIntensity: intensity,
        pressureLevel: pressure,
        dangerLevel,
        recentTrends: trends,
        preGoalIndicators: indicators
      };
      
    } catch (error) {
      console.error('[timeline] Error analyzing timeline:', error);
      return this.getDefaultAnalysis();
    }
  }

  // Calcula tendências nas estatísticas (crescente, decrescente, estável)
  private calculateTrends(timeline: TimelineSnapshot[]) {
    if (timeline.length < 2) {
      return { xgTrend: 0, shotsTrend: 0, cornersTrend: 0, chancesTrend: 0 };
    }

    const first = timeline[0];
    const last = timeline[timeline.length - 1];
    
    // Calcular taxa de crescimento
    const xgTrend = this.calculateGrowthRate(
      first.xgHome + first.xgAway,
      last.xgHome + last.xgAway
    );
    
    const shotsTrend = this.calculateGrowthRate(
      first.shotsHome + first.shotsAway,
      last.shotsHome + last.shotsAway
    );
    
    const cornersTrend = this.calculateGrowthRate(
      first.cornersHome + first.cornersAway,
      last.cornersHome + last.cornersAway
    );
    
    const chancesTrend = this.calculateGrowthRate(
      first.bigChancesHome + first.bigChancesAway,
      last.bigChancesHome + last.bigChancesAway
    );

    return { xgTrend, shotsTrend, cornersTrend, chancesTrend };
  }

  // Calcula taxa de crescimento entre dois valores
  private calculateGrowthRate(initial: number, current: number): number {
    if (initial === 0) return current > 0 ? 1 : 0;
    return (current - initial) / initial;
  }

  // Calcula o momentum atual (aceleração das estatísticas)
  private calculateMomentum(timeline: TimelineSnapshot[]): number {
    if (timeline.length < 3) return 0;

    let momentumScore = 0;
    const weights = [0.5, 0.3, 0.2]; // Peso maior para eventos mais recentes

    for (let i = 1; i < Math.min(4, timeline.length); i++) {
      const current = timeline[timeline.length - i];
      const previous = timeline[timeline.length - i - 1];
      
      const xgIncrease = (current.xgHome + current.xgAway) - (previous.xgHome + previous.xgAway);
      const shotsIncrease = (current.shotsOnHome + current.shotsOnAway) - (previous.shotsOnHome + previous.shotsOnAway);
      const cornersIncrease = (current.cornersHome + current.cornersAway) - (previous.cornersHome + previous.cornersAway);
      const chancesIncrease = (current.bigChancesHome + current.bigChancesAway) - (previous.bigChancesHome + previous.bigChancesAway);
      
      const snapshotMomentum = (
        xgIncrease * 0.4 +
        shotsIncrease * 0.3 +
        cornersIncrease * 0.15 +
        chancesIncrease * 0.15
      );
      
      const weight = weights[i - 1] || 0.1;
      momentumScore += snapshotMomentum * weight;
    }

    return Math.max(0, Math.min(1, momentumScore / 2)); // Normalizar 0-1
  }

  // Calcula intensidade ofensiva (eventos por minuto)
  private calculateAttackingIntensity(timeline: TimelineSnapshot[]): number {
    if (timeline.length < 2) return 0;

    const last = timeline[timeline.length - 1];
    const first = timeline[0];
    
    const minutesDiff = Math.max(1, last.minute - first.minute);
    
    const totalShots = (last.shotsHome + last.shotsAway) - (first.shotsHome + first.shotsAway);
    const totalCorners = (last.cornersHome + last.cornersAway) - (first.cornersHome + first.cornersAway);
    const totalChances = (last.bigChancesHome + last.bigChancesAway) - (first.bigChancesHome + first.bigChancesAway);
    
    const intensity = (totalShots + totalCorners * 0.5 + totalChances * 2) / minutesDiff;
    
    return Math.min(1, intensity / 3); // Normalizar
  }

  // Calcula nível de pressão (sustentabilidade do ataque)
  private calculatePressureLevel(timeline: TimelineSnapshot[]): number {
    if (timeline.length < 2) return 0;

    let consecutiveIncreases = 0;
    let maxConsecutive = 0;

    for (let i = 1; i < timeline.length; i++) {
      const current = timeline[i];
      const previous = timeline[i - 1];
      
      const currentTotal = current.shotsOnHome + current.shotsOnAway + current.cornersHome + current.cornersAway;
      const previousTotal = previous.shotsOnHome + previous.shotsOnAway + previous.cornersHome + previous.cornersAway;
      
      if (currentTotal > previousTotal) {
        consecutiveIncreases++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveIncreases);
      } else {
        consecutiveIncreases = 0;
      }
    }

    return Math.min(1, maxConsecutive / timeline.length);
  }

  // Identifica indicadores específicos de gol iminente
  private identifyPreGoalIndicators(
    timeline: TimelineSnapshot[],
    trends: any,
    momentum: number,
    intensity: number,
    pressure: number
  ): string[] {
    const indicators: string[] = [];

    // 1. Momentum crescente forte
    if (momentum > 0.7) {
      indicators.push('🔥 Momentum ofensivo muito alto');
    }

    // 2. Tendência de xG crescente
    if (trends.xgTrend > 0.3) {
      indicators.push('📈 xG crescendo rapidamente');
    }

    // 3. Sequência de finalizações
    if (trends.shotsTrend > 0.5) {
      indicators.push('⚡ Sequência de finalizações');
    }

    // 4. Aumento de escanteios (pressão)
    if (trends.cornersTrend > 0.4) {
      indicators.push('🚩 Pressão com escanteios');
    }

    // 5. Chances claras aumentando
    if (trends.chancesTrend > 0.5) {
      indicators.push('🎯 Chances claras crescentes');
    }

    // 6. Alta intensidade ofensiva
    if (intensity > 0.7) {
      indicators.push('💥 Intensidade ofensiva alta');
    }

    // 7. Pressão sustentada
    if (pressure > 0.6) {
      indicators.push('🔴 Pressão sustentada');
    }

    // 8. Análise dos últimos snapshots (eventos recentes)
    if (timeline.length >= 2) {
      const recent = timeline[timeline.length - 1];
      const previous = timeline[timeline.length - 2];
      
      const recentShotsOn = (recent.shotsOnHome + recent.shotsOnAway) - (previous.shotsOnHome + previous.shotsOnAway);
      const recentChances = (recent.bigChancesHome + recent.bigChancesAway) - (previous.bigChancesHome + previous.bigChancesAway);
      
      if (recentShotsOn >= 2) {
        indicators.push('🎯 Múltiplas finalizações no alvo recentes');
      }
      
      if (recentChances >= 1) {
        indicators.push('⚠️ Chance clara muito recente');
      }
    }

    return indicators;
  }

  // Determina nível de perigo baseado em múltiplos fatores
  private calculateDangerLevel(
    momentum: number,
    intensity: number,
    pressure: number,
    indicatorCount: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const score = (momentum * 0.3 + intensity * 0.3 + pressure * 0.2 + (indicatorCount / 8) * 0.2);

    if (score >= 0.8 || indicatorCount >= 5) return 'CRITICAL';
    if (score >= 0.65 || indicatorCount >= 3) return 'HIGH';
    if (score >= 0.45 || indicatorCount >= 2) return 'MEDIUM';
    return 'LOW';
  }

  private getDefaultAnalysis(): MomentumAnalysis {
    return {
      hasPositiveMomentum: false,
      momentumScore: 0,
      attackingIntensity: 0,
      pressureLevel: 0,
      dangerLevel: 'LOW',
      recentTrends: {
        xgTrend: 0,
        shotsTrend: 0,
        cornersTrend: 0,
        chancesTrend: 0
      },
      preGoalIndicators: []
    };
  }

  // Busca padrões históricos de pré-gol em partidas passadas
  async findHistoricalPreGoalPatterns(matchId: string): Promise<any[]> {
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { statSnapshots: { orderBy: { minute: 'asc' } } }
      });

      if (!match || !match.statSnapshots.length) return [];

      const patterns: any[] = [];
      const snapshots = match.statSnapshots;

      // Identificar momentos de gol
      let previousGoals = 0;
      
      for (let i = 1; i < snapshots.length; i++) {
        const currentGoals = match.goalsHome + match.goalsAway;
        
        if (currentGoals > previousGoals) {
          // Gol aconteceu! Analisar os 5 minutos anteriores
          const goalMinute = snapshots[i].minute;
          const preGoalSnapshots = snapshots.filter(s => 
            s.minute >= goalMinute - 5 && s.minute < goalMinute
          );

          if (preGoalSnapshots.length >= 2) {
            const pattern = this.analyzePreGoalPattern(preGoalSnapshots);
            patterns.push({
              goalMinute,
              ...pattern
            });
          }

          previousGoals = currentGoals;
        }
      }

      return patterns;
    } catch (error) {
      console.error('[timeline] Error finding historical patterns:', error);
      return [];
    }
  }

  private analyzePreGoalPattern(snapshots: any[]): any {
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];

    return {
      xgIncrease: (last.xgHome + last.xgAway) - (first.xgHome + first.xgAway),
      shotsIncrease: (last.shotsHome + last.shotsAway) - (first.shotsHome + first.shotsAway),
      shotsOnIncrease: (last.shotsOnHome + last.shotsOnAway) - (first.shotsOnHome + first.shotsOnAway),
      cornersIncrease: (last.cornersHome + last.cornersAway) - (first.cornersHome + first.cornersAway),
      chancesIncrease: (last.bigChancesHome + last.bigChancesAway) - (first.bigChancesHome + first.bigChancesAway),
      timeBeforeGoal: last.minute - first.minute
    };
  }
}
