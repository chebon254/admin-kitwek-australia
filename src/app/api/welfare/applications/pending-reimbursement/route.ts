import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get applications that are PAID but may not have full reimbursements created
    const paidApplications = await prisma.welfareApplication.findMany({
      where: {
        status: 'PAID'
      },
      orderBy: {
        payoutDate: 'desc'
      },
      take: 10, // Last 10 paid applications
      select: {
        id: true,
        deceasedName: true,
        claimAmount: true,
        payoutDate: true,
        reimbursementDue: true,
        applicationType: true,
        reimbursements: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    // Get count of active members
    const activeMembers = await prisma.welfareRegistration.count({
      where: {
        status: 'ACTIVE',
        paymentStatus: 'PAID'
      }
    });

    // Format the data to show which applications need reimbursements
    const applicationsWithStats = paidApplications.map(app => ({
      id: app.id,
      deceasedName: app.deceasedName,
      claimAmount: app.claimAmount,
      payoutDate: app.payoutDate,
      reimbursementDue: app.reimbursementDue,
      applicationType: app.applicationType,
      totalReimbursements: app.reimbursements.length,
      pendingReimbursements: app.reimbursements.filter(r => r.status === 'PENDING').length,
      paidReimbursements: app.reimbursements.filter(r => r.status === 'PAID').length,
      activeMembers: activeMembers,
      needsReimbursements: app.reimbursements.length < activeMembers,
      reimbursementProgress: activeMembers > 0
        ? Math.round((app.reimbursements.length / activeMembers) * 100)
        : 0
    }));

    return NextResponse.json({
      applications: applicationsWithStats,
      totalActiveMembers: activeMembers
    });
  } catch (error) {
    console.error("[PENDING_REIMBURSEMENT] Error occurred:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Internal Error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal Error", details: String(error) },
      { status: 500 }
    );
  }
}
