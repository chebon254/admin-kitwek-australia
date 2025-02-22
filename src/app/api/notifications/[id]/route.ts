import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from "next/server";
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

    const { id } = await params;

    const notification = await prisma.adminNotification.update({
      where: {
        id: id,
        adminId: userId,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("[NOTIFICATION_MARK_READ]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}