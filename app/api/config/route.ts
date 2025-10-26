
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const config = await prisma.config.findFirst();
    
    if (!config) {
      // Create default config if none exists
      const newConfig = await prisma.config.create({
        data: {
          bankroll: 100.0,
          stakePercentage: 5.0,
          isSystemActive: true
        }
      });
      return NextResponse.json({ config: newConfig });
    }
    
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegramBotToken, telegramChatId, bankroll, stakePercentage, isSystemActive } = body;
    
    // Update or create config
    const config = await prisma.config.findFirst();
    
    let updatedConfig;
    if (config) {
      updatedConfig = await prisma.config.update({
        where: { id: config.id },
        data: {
          ...(telegramBotToken !== undefined && { telegramBotToken }),
          ...(telegramChatId !== undefined && { telegramChatId }),
          ...(bankroll !== undefined && { bankroll }),
          ...(stakePercentage !== undefined && { stakePercentage }),
          ...(isSystemActive !== undefined && { isSystemActive })
        }
      });
    } else {
      updatedConfig = await prisma.config.create({
        data: {
          telegramBotToken,
          telegramChatId,
          bankroll: bankroll || 100.0,
          stakePercentage: stakePercentage || 5.0,
          isSystemActive: isSystemActive !== undefined ? isSystemActive : true
        }
      });
    }

    return NextResponse.json({ config: updatedConfig });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
