import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get campaign details with results
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const campaign = await prisma.welfareVotingCampaign.findUnique({
      where: { id },
      include: {
        candidates: {
          include: {
            _count: {
              select: { votes: true },
            },
            votes: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { votes: true },
        },
      },
    });

    if (!campaign) {
      return new NextResponse("Campaign not found", { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('[ADMIN_GET_WELFARE_CAMPAIGN]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PUT - Update campaign status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!status || !['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({
        error: 'Invalid status',
      }, { status: 400 });
    }

    const campaign = await prisma.welfareVotingCampaign.update({
      where: { id },
      data: { status },
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: 'UPDATE_WELFARE_VOTING_CAMPAIGN_STATUS',
        details: `Updated campaign "${campaign.title}" status to ${status}`,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('[ADMIN_UPDATE_WELFARE_CAMPAIGN]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE - Delete campaign
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const campaign = await prisma.welfareVotingCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return new NextResponse("Campaign not found", { status: 404 });
    }

    await prisma.welfareVotingCampaign.delete({
      where: { id },
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: 'DELETE_WELFARE_VOTING_CAMPAIGN',
        details: `Deleted welfare voting campaign: "${campaign.title}"`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_DELETE_WELFARE_CAMPAIGN]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
