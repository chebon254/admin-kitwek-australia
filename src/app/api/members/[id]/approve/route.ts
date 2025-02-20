import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params; // No need to await params, it's already resolved

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