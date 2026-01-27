import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all inactive users who haven't been revoked
    const inactiveUsers = await prisma.user.findMany({
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
    });

    return NextResponse.json({
      users: inactiveUsers,
      total: inactiveUsers.length,
    });

  } catch (error) {
    console.error("[GET_INACTIVE_USERS]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}
