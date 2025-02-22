import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.adminNotification.findMany({
        where: { adminId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.adminNotification.count({
        where: { adminId: userId },
      }),
    ]);

    return NextResponse.json({
      notifications,
      hasMore: skip + notifications.length < total,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}