const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function monitorDatabase() {
  console.log('🔍 Monitorando banco de dados em tempo real...\n');
  console.log('Pressione Ctrl+C para parar\n');
  console.log('='.repeat(80));

  setInterval(async () => {
    try {
      // Contar partidas
      const matchCount = await prisma.match.count();
      const liveMatches = await prisma.match.count({
        where: { isBeingTracked: true, isFinished: false }
      });

      // Contar snapshots
      const snapshotCount = await prisma.statSnapshot.count();

      // Contar previsões
      const predictionCount = await prisma.prediction.count();
      const activePredictions = await prisma.prediction.count({
        where: { isResolved: false }
      });

      // Listar partidas ao vivo
      const matches = await prisma.match.findMany({
        where: { isBeingTracked: true },
        include: {
          homeTeam: true,
          awayTeam: true,
          _count: {
            select: { statSnapshots: true, predictions: true }
          }
        },
        take: 5
      });

      console.clear();
      console.log('🔴 MONITOR DE BANCO DE DADOS - Atualizado:', new Date().toLocaleTimeString());
      console.log('='.repeat(80));
      console.log(`📊 Total de partidas: ${matchCount} | Ao vivo: ${liveMatches}`);
      console.log(`📸 Total de snapshots: ${snapshotCount}`);
      console.log(`🎯 Total de previsões: ${predictionCount} | Ativas: ${activePredictions}`);
      console.log('='.repeat(80));
      
      if (matches.length > 0) {
        console.log('\n📍 PARTIDAS SENDO MONITORADAS:\n');
        
        for (const match of matches) {
          console.log(`🔴 ${match.homeTeam.name} ${match.goalsHome} x ${match.goalsAway} ${match.awayTeam.name}`);
          console.log(`   Minuto: ${match.minute || 0}' | Status: ${match.status}`);
          console.log(`   xG: ${match.xgHome.toFixed(2)} - ${match.xgAway.toFixed(2)}`);
          console.log(`   Finalizações: ${match.shotsHome} - ${match.shotsAway}`);
          console.log(`   No alvo: ${match.shotsOnHome} - ${match.shotsOnAway}`);
          console.log(`   Escanteios: ${match.cornersHome} - ${match.cornersAway}`);
          console.log(`   Chances claras: ${match.bigChancesHome} - ${match.bigChancesAway}`);
          console.log(`   📸 Snapshots: ${match._count.statSnapshots} | 🎯 Previsões: ${match._count.predictions}`);
          console.log('');
        }
      } else {
        console.log('\n⏳ Aguardando partidas ao vivo...');
        console.log('   → Clique em "Iniciar" no dashboard');
        console.log('   → Aguarde 1-2 minutos');
        console.log('   → Use o botão "Testar" para verificar\n');
      }

      // Mostrar últimas previsões
      if (activePredictions > 0) {
        const recentPredictions = await prisma.prediction.findMany({
          where: { isResolved: false },
          include: {
            match: {
              include: {
                homeTeam: true,
                awayTeam: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        });

        console.log('🎯 PREVISÕES ATIVAS:\n');
        for (const pred of recentPredictions) {
          console.log(`   ${pred.type} | ${pred.match.homeTeam.name} vs ${pred.match.awayTeam.name}`);
          console.log(`   Confiança: ${(pred.confidenceScore * 100).toFixed(1)}% | Minuto: ${pred.predictionMinute}'`);
          console.log('');
        }
      }

    } catch (error) {
      console.error('❌ Erro ao monitorar:', error.message);
    }
  }, 3000); // Atualiza a cada 3 segundos
}

monitorDatabase();
