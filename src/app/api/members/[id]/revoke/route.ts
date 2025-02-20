import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { reason } = await request.json();
    const { id } = await params;

    const user = await prisma.user.update({
      where: { id },
      data: {
        revokeStatus: true,
        revokeReason: reason,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[MEMBER_REVOKE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}