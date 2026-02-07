import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applicationId = (await params).id;
    console.log("Processing mark-paid for application:", applicationId);

    // Get the application
    const application = await prisma.welfareApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!application) {
      console.log("Application not found:", applicationId);
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== 'APPROVED') {
      console.log("Application status is not APPROVED:", application.status);
      return NextResponse.json({ error: "Application must be approved first" }, { status: 400 });
    }

    console.log("Starting transaction to update application and create reimbursements");

    // First, get all active welfare members outside the transaction
    console.log("Fetching active welfare members");
    const activeMembers = await prisma.welfareRegistration.findMany({
      where: {
        status: 'ACTIVE',
        paymentStatus: 'PAID'
      },
      include: { user: true }
    });

    console.log(`Found ${activeMembers.length} active members`);

    if (activeMembers.length === 0) {
      console.warn("No active welfare members found");
      return NextResponse.json({ error: "No active welfare members found" }, { status: 400 });
    }

    // Fixed reimbursement amount per member (AUD $19)
    const reimbursementPerMember = 19.00;
    console.log(`Reimbursement per member: AUD $${reimbursementPerMember}`);

    // Update application and create reimbursement records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log("Updating application status to PAID");
      
      // Update application status
      const updatedApplication = await tx.welfareApplication.update({
        where: { id: applicationId },
        data: {
          status: 'PAID',
          payoutDate: new Date(),
          reimbursementDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        }
      });

      console.log("Creating reimbursement records");

      // Check for existing reimbursements to avoid duplicates
      const existingReimbursements = await tx.welfareReimbursement.findMany({
        where: {
          applicationId: applicationId
        },
        select: { userId: true }
      });

      const existingUserIds = new Set(existingReimbursements.map(r => r.userId));
      console.log(`Found ${existingUserIds.size} existing reimbursements for this application`);

      // Only create reimbursements for members who don't already have one
      const newMembers = activeMembers.filter(member => !existingUserIds.has(member.userId));
      console.log(`Creating reimbursements for ${newMembers.length} new members`);

      let reimbursementCount = 0;
      if (newMembers.length > 0) {
        const reimbursementData = newMembers.map(member => ({
          userId: member.userId,
          applicationId: applicationId,
          amountDue: reimbursementPerMember,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          status: 'PENDING'
        }));

        const reimbursements = await tx.welfareReimbursement.createMany({
          data: reimbursementData
        });
        reimbursementCount = reimbursements.count;
      }

      console.log(`Created ${reimbursementCount} new reimbursement records`);

      // Deduct payout amount from welfare fund balance
      const welfareStats = await tx.welfareFund.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      if (welfareStats) {
        await tx.welfareFund.update({
          where: { id: welfareStats.id },
          data: {
            totalAmount: { decrement: application.claimAmount },
            lastUpdated: new Date(),
          }
        });
        console.log(`Deducted ${application.claimAmount} from welfare fund balance`);
      } else {
        console.warn('No welfare fund record found to deduct from');
      }

      return {
        updatedApplication,
        reimbursementCount
      };
    });

    console.log("Transaction completed successfully");

    // Log the action
    try {
      await prisma.adminLog.create({
        data: {
          adminId: userId,
          action: "MARK_WELFARE_PAID",
          details: `Marked welfare application as paid: ${application.deceasedName} - ${application.claimAmount}. Created ${result.reimbursementCount} reimbursement records.`,
        },
      });
      console.log("Admin log created successfully");
    } catch (logError) {
      console.error("Failed to create admin log:", logError);
      // Don't throw here, as the main operation succeeded
    }

    // TODO: Send payout confirmation email to applicant
    // TODO: Send reimbursement notification emails to all active members

    console.log("Mark-paid operation completed successfully");
    return NextResponse.json(result.updatedApplication);
  } catch (error) {
    // Simplified error handling to avoid Next.js source map issues
    console.error("[WELFARE_APPLICATION_MARK_PAID] Error occurred:", error);

    // Return more specific error messages based on common issues
    if (error instanceof Error) {
      console.error("[WELFARE_APPLICATION_MARK_PAID] Error message:", error.message);
      console.error("[WELFARE_APPLICATION_MARK_PAID] Error stack:", error.stack);

      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json({ error: "Database constraint error - please check user relationships" }, { status: 400 });
      }
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ error: "Duplicate reimbursement record detected" }, { status: 400 });
      }

      return NextResponse.json({ error: "Internal Error", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Internal Error", details: String(error) }, { status: 500 });
  }
}