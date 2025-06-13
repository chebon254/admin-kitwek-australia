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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const applicationId = (await params).id;

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
      return new NextResponse("Application not found", { status: 404 });
    }

    if (application.status !== 'APPROVED') {
      return new NextResponse("Application must be approved first", { status: 400 });
    }

    // Update application and create reimbursement records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update application status
      const updatedApplication = await tx.welfareApplication.update({
        where: { id: applicationId },
        data: {
          status: 'PAID',
          payoutDate: new Date(),
          reimbursementDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        }
      });

      // Get all active welfare members
      const activeMembers = await tx.welfareRegistration.findMany({
        where: {
          status: 'ACTIVE',
          paymentStatus: 'PAID'
        },
        include: { user: true }
      });

      // Calculate reimbursement amount per member
      const reimbursementPerMember = application.claimAmount / activeMembers.length;

      // Create reimbursement records for all active members
      const reimbursements = await Promise.all(
        activeMembers.map(member =>
          tx.welfareReimbursement.create({
            data: {
              userId: member.userId,
              applicationId: applicationId,
              amountDue: reimbursementPerMember,
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
              status: 'PENDING'
            }
          })
        )
      );

      return { updatedApplication, reimbursements };
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "MARK_WELFARE_PAID",
        details: `Marked welfare application as paid: ${application.deceasedName} - $${application.claimAmount}. Created ${result.reimbursements.length} reimbursement records.`,
      },
    });

    // TODO: Send payout confirmation email to applicant
    // TODO: Send reimbursement notification emails to all active members

    return NextResponse.json(result.updatedApplication);
  } catch (error) {
    console.error("[WELFARE_APPLICATION_MARK_PAID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}