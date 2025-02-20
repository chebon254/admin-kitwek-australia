import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

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