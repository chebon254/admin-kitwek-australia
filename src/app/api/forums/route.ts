import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, description } = await req.json();

    const forum = await prisma.forum.create({
      data: {
        title,
        description,
        adminId: userId,
      },
    });

    return NextResponse.json(forum);
  } catch (error) {
    console.error("[FORUMS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const forums = await prisma.forum.findMany({
      where: { adminId: userId },
      include: {
        comments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(forums);
  } catch (error) {
    console.error("[FORUMS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}