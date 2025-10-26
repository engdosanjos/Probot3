
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create initial configuration
  const config = await prisma.config.upsert({
    where: { id: 'system-config' },
    update: {},
    create: {
      id: 'system-config',
      bankroll: 100.0,
      stakePercentage: 5.0,
      isSystemActive: true,
    },
  });

  // Create initial ML weights
  const weights = await prisma.mLWeights.upsert({
    where: { version: '1.0.0' },
    update: {},
    create: {
      version: '1.0.0',
      isActive: true,
      htXGWeight: 0.4,
      htShotsWeight: 0.2,
      htCornersWeight: 0.15,
      htBigChancesWeight: 0.25,
      ftXGWeight: 0.35,
      ftShotsWeight: 0.25,
      ftCornersWeight: 0.2,
      ftBigChancesWeight: 0.2,
      bttsXGBothWeight: 0.3,
      bttsShotsBothWeight: 0.3,
      bttsChancesBothWeight: 0.4,
      htThreshold: 0.6,
      ftThreshold: 0.5,
      bttsThreshold: 0.65,
    },
  });

  // Create test admin user
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'Test Admin',
    },
  });

  console.log('Database seeded successfully!');
  console.log('Initial config:', config);
  console.log('Initial ML weights:', weights);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
