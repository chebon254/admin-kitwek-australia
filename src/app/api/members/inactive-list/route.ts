import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 300; // Revalidate every 5 minutes

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Get inactive users with pagination
    const [inactiveUsers, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: {
          membershipStatus: "INACTIVE",
          revokeStatus: false,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: skip,
      }),
      prisma.user.count({
        where: {
          membershipStatus: "INACTIVE",
          revokeStatus: false,
        },
      }),
    ]);

    return NextResponse.json({
      users: inactiveUsers,
      total: totalCount,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error("[GET_INACTIVE_USERS]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}
