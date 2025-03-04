import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update all unread notifications for this admin
    const result = await prisma.adminNotification.updateMany({
      where: {
        adminId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      count: result.count 
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_MARK_ALL_READ]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}