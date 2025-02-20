import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);
    
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const where = {
      AND: [
        {
          OR: [
            { email: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
          ],
        },
        status ? { membershipStatus: status } : {},
      ],
    };

    const members = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("[MEMBERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}