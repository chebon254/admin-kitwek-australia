import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { reason } = await req.json();

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