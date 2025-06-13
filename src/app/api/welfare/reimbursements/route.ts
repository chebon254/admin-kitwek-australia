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
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Get reimbursements with user and application data
    const reimbursements = await prisma.welfareReimbursement.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            memberNumber: true
          }
        },
        application: {
          select: {
            id: true,
            deceasedName: true,
            applicationType: true,
            claimAmount: true
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.welfareReimbursement.count({
      where: whereClause
    });

    // Get summary statistics
    const stats = await prisma.welfareReimbursement.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        amountDue: true,
        amountPaid: true
      }
    });

    return NextResponse.json({
      reimbursements,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats
    });
  } catch (error) {
    console.error("[WELFARE_REIMBURSEMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}