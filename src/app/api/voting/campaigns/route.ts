import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define the candidate type for the request body
interface CandidateInput {
  name: string;
  description?: string;
  position?: string;
  manifesto?: string;
  image?: string;
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const campaigns = await prisma.votingCampaign.findMany({
      where: { adminId: userId },
      include: {
        candidates: {
          include: {
            _count: {
              select: {
                votes: true,
              },
            },
          },
        },
        _count: {
          select: {
            votes: true,
            candidates: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("[VOTING_CAMPAIGNS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, description, type, startDate, endDate, thumbnail, candidates } = await req.json();

    if (!title || !description || !type || !startDate || !endDate) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!candidates || candidates.length < 2) {
      return new NextResponse("At least 2 candidates are required", { status: 400 });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return new NextResponse("End date must be after start date", { status: 400 });
    }

    // Determine status based on dates
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let status = "UPCOMING";
    if (now >= start && now <= end) {
      status = "ACTIVE";
    } else if (now > end) {
      status = "COMPLETED";
    }

    const campaign = await prisma.votingCampaign.create({
      data: {
        title,
        description,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
        thumbnail,
        adminId: userId,
        candidates: {
          create: candidates.map((candidate: CandidateInput) => ({
            name: candidate.name,
            description: candidate.description,
            position: candidate.position,
            manifesto: candidate.manifesto,
            image: candidate.image,
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
        action: "CREATE",
        details: `Created voting campaign: ${title}`,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[VOTING_CAMPAIGNS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}