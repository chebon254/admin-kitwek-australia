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
      return new NextResponse("Unauthorized", { status: 401 });
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
      return new NextResponse("Not found", { status: 404 });
    }
    
    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[VOTING_CAMPAIGN_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const campaign = await prisma.votingCampaign.findUnique({
      where: { id: (await params).id },
    });
    
    if (!campaign || campaign.adminId !== userId) {
      return new NextResponse("Not found", { status: 404 });
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
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!candidates || candidates.length < 2) {
      return new NextResponse("At least 2 candidates are required", { status: 400 });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return new NextResponse("End date must be after start date", { status: 400 });
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
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const campaign = await prisma.votingCampaign.findUnique({
      where: { id: (await params).id },
    });
    
    if (!campaign || campaign.adminId !== userId) {
      return new NextResponse("Not found", { status: 404 });
    }
    
    // Delete campaign (cascade will handle candidates and votes)
    await prisma.votingCampaign.delete({
      where: { id: (await params).id },
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "DELETE",
        details: `Deleted voting campaign: ${campaign.title}`,
      },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[VOTING_CAMPAIGN_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}