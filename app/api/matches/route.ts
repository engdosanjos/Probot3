
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'live';

    let matches;
    
    if (type === 'live') {
      matches = await prisma.match.findMany({
        where: {
          isBeingTracked: true,
          isFinished: false
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          predictions: {
            where: { isResolved: false },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 20
      });
    } else {
      matches = await prisma.match.findMany({
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          predictions: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
      });
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
