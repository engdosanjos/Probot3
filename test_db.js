const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testando conexão com banco de dados SQLite...\n');
    
    // Test config
    const config = await prisma.config.findFirst();
    console.log('✅ Config:', config);
    
    // Test ML weights
    const weights = await prisma.mLWeights.findFirst();
    console.log('\n✅ ML Weights:', {
      version: weights.version,
      htThreshold: weights.htThreshold,
      ftThreshold: weights.ftThreshold,
      bttsThreshold: weights.bttsThreshold,
      isActive: weights.isActive
    });
    
    // Test user
    const user = await prisma.user.findFirst();
    console.log('\n✅ User:', {
      email: user.email,
      name: user.name
    });
    
    // Count matches
    const matchCount = await prisma.match.count();
    console.log('\n📊 Total de partidas:', matchCount);
    
    // Count predictions
    const predictionCount = await prisma.prediction.count();
    console.log('📊 Total de previsões:', predictionCount);
    
    console.log('\n✅ Banco de dados SQLite funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro ao testar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
