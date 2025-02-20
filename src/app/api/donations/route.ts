import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, description, thumbnail, goal, endDate } = await req.json();

    const donation = await prisma.donation.create({
      data: {
        name,
        description,
        thumbnail,
        goal: goal || null,
        endDate: endDate ? new Date(endDate) : null,
        adminId: userId,
      },
    });

    return NextResponse.json(donation);
  } catch (error) {
    console.error("[DONATIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const donations = await prisma.donation.findMany({
      where: { adminId: userId },
      include: {
        donors: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(donations);
  } catch (error) {
    console.error("[DONATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}