import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { applicationId, amountPerMember } = body;

    if (!applicationId || !amountPerMember) {
      return NextResponse.json(
        { error: "Application ID and amount per member are required" },
        { status: 400 }
      );
    }

    console.log(`Creating reimbursements for application ${applicationId} with amount AUD $${amountPerMember}`);

    // Get the application
    const application = await prisma.welfareApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        deceasedName: true,
        claimAmount: true,
        status: true
      }
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== 'PAID') {
      return NextResponse.json(
        { error: "Application must be marked as paid first" },
        { status: 400 }
      );
    }

    // Get all active welfare members
    const activeMembers = await prisma.welfareRegistration.findMany({
      where: {
        status: 'ACTIVE',
        paymentStatus: 'PAID'
      },
      select: {
        userId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (activeMembers.length === 0) {
      return NextResponse.json(
        { error: "No active welfare members found" },
        { status: 400 }
      );
    }

    console.log(`Found ${activeMembers.length} active members`);

    // Check for existing reimbursements for this application
    const existingReimbursements = await prisma.welfareReimbursement.findMany({
      where: { applicationId: applicationId },
      select: { userId: true }
    });

    const existingUserIds = new Set(existingReimbursements.map(r => r.userId));
    console.log(`Found ${existingUserIds.size} existing reimbursements`);

    // Filter out members who already have reimbursements for this application
    const newMembers = activeMembers.filter(member => !existingUserIds.has(member.userId));

    if (newMembers.length === 0) {
      return NextResponse.json(
        {
          error: "Reimbursements already created for all active members",
          existingCount: existingUserIds.size
        },
        { status: 400 }
      );
    }

    console.log(`Creating reimbursements for ${newMembers.length} new members`);

    // Create reimbursements
    const reimbursementData = newMembers.map(member => ({
      userId: member.userId,
      applicationId: applicationId,
      amountDue: Number(amountPerMember),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      status: 'PENDING'
    }));

    const result = await prisma.welfareReimbursement.createMany({
      data: reimbursementData
    });

    // Log the action
    try {
      await prisma.adminLog.create({
        data: {
          adminId: userId,
          action: "CREATE_REIMBURSEMENTS",
          details: `Created ${result.count} reimbursements for ${application.deceasedName} - AUD $${amountPerMember} per member`,
        },
      });
    } catch (logError) {
      console.error("Failed to create admin log:", logError);
    }

    console.log(`Successfully created ${result.count} reimbursements`);

    return NextResponse.json({
      success: true,
      created: result.count,
      skipped: existingUserIds.size,
      totalActiveMembers: activeMembers.length,
      amountPerMember: Number(amountPerMember),
      application: {
        id: application.id,
        deceasedName: application.deceasedName,
        claimAmount: application.claimAmount
      }
    });
  } catch (error) {
    console.error("[CREATE_REIMBURSEMENTS] Error occurred:", error);

    if (error instanceof Error) {
      console.error("[CREATE_REIMBURSEMENTS] Error message:", error.message);
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
