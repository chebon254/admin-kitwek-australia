import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all welfare voting campaigns
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const campaigns = await prisma.welfareVotingCampaign.findMany({
      include: {
        candidates: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('[ADMIN_GET_WELFARE_CAMPAIGNS]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST - Create new welfare voting campaign
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { title, description, type, startDate, endDate, candidates } = body;

    // Validation
    if (!title || !description || !type || !startDate || !endDate || !candidates) {
      return NextResponse.json({
        error: 'Missing required fields',
      }, { status: 400 });
    }

    if (!Array.isArray(candidates) || candidates.length < 2) {
      return NextResponse.json({
        error: 'At least 2 candidates are required',
      }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return NextResponse.json({
        error: 'End date must be after start date',
      }, { status: 400 });
    }

    // Determine status based on current date
    const now = new Date();
    let status = 'UPCOMING';
    if (now >= start && now <= end) {
      status = 'ACTIVE';
    } else if (now > end) {
      status = 'COMPLETED';
    }

    // Create campaign with candidates
    const campaign = await prisma.welfareVotingCampaign.create({
      data: {
        title,
        description,
        type,
        startDate: start,
        endDate: end,
        status,
        createdBy: userId,
        candidates: {
          create: candidates.map((candidate: { name: string; description?: string; imageUrl?: string }) => ({
            name: candidate.name,
            description: candidate.description,
            imageUrl: candidate.imageUrl,
          })),
        },
      },
      include: {
        candidates: true,
      },
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: 'CREATE_WELFARE_VOTING_CAMPAIGN',
        details: `Created welfare voting campaign: "${title}" with ${candidates.length} candidates`,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('[ADMIN_CREATE_WELFARE_CAMPAIGN]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
