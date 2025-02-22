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
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where: { adminId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.adminLog.count({
        where: { adminId: userId },
      }),
    ]);

    return NextResponse.json({
      logs,
      hasMore: skip + logs.length < total,
    });
  } catch (error) {
    console.error("[LOGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}