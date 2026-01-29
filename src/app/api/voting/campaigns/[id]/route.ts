// src/app/api/voting/campaigns/[id]/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const campaign = await prisma.votingCampaign.findUnique({
      where: { id: (await params).id },
      include: {
        candidates: {
          include: {
            _count: {
              select: {
                votes: true,
              },
            },
          },
          orderBy: {
            votes: {
              _count: 'desc',
            },
          },
        },
        votes: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            candidate: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            votes: true,
            candidates: true,
          },
        },
      },
    });
    
    if (!campaign || campaign.adminId !== userId) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[VOTING_CAMPAIGN_GET]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const campaign = await prisma.votingCampaign.findUnique({
      where: { id: (await params).id },
    });

    if (!campaign || campaign.adminId !== userId) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    const {
      title,
      description,
      type,
      status,
      startDate,
      endDate,
      thumbnail,
      candidates,
      deletedCandidateIds
    } = await request.json();

    if (!title || !description || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!candidates || candidates.length < 2) {
      return NextResponse.json(
        { error: "At least 2 candidates are required" },
        { status: 400 }
      );
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Use transaction to handle all updates atomically
    const updatedCampaign = await prisma.$transaction(async (tx) => {
      // Delete removed candidates
      if (deletedCandidateIds && deletedCandidateIds.length > 0) {
        await tx.votingCandidate.deleteMany({
          where: {
            id: { in: deletedCandidateIds },
            campaignId: (await params).id,
          },
        });
      }

      // Update campaign
      const campaign = await tx.votingCampaign.update({
        where: { id: (await params).id },
        data: {
          title,
          description,
          type,
          status,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          thumbnail,
        },
      });

      // Handle candidates
      for (const candidate of candidates) {
        if (candidate.id && !candidate.id.startsWith('new_')) {
          // Update existing candidate
          await tx.votingCandidate.update({
            where: { id: candidate.id },
            data: {
              name: candidate.name,
              description: candidate.description,
              position: candidate.position,
              manifesto: candidate.manifesto,
              image: candidate.image,
            },
          });
        } else {
          // Create new candidate
          await tx.votingCandidate.create({
            data: {
              name: candidate.name,
              description: candidate.description,
              position: candidate.position,
              manifesto: candidate.manifesto,
              image: candidate.image,
              campaignId: (await params).id,
            },
          });
        }
      }

      return campaign;
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "UPDATE",
        details: `Updated voting campaign: ${title}`,
      },
    });
    
    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error("[VOTING_CAMPAIGN_PATCH]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const campaignId = (await params).id;

    const campaign = await prisma.votingCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.adminId !== userId) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    // Delete campaign and related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete all votes for this campaign
      await tx.vote.deleteMany({
        where: { campaignId: campaignId },
      });

      // Delete all candidates for this campaign
      await tx.votingCandidate.deleteMany({
        where: { campaignId: campaignId },
      });

      // Delete the campaign
      await tx.votingCampaign.delete({
        where: { id: campaignId },
      });
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "DELETE_VOTING_CAMPAIGN",
        details: `Deleted voting campaign: ${campaign.title}`,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[VOTING_CAMPAIGN_DELETE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete voting campaign" },
      { status: 500 }
    );
  }
}