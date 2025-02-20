import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  { params }: { params: RouteParams }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Await the params before using them
    const { id } = await params;

    const user = await prisma.user.update({
      where: { id },
      data: {
        revokeStatus: false,
        revokeReason: null,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[MEMBER_APPROVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}