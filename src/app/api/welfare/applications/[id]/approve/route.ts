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

    if (application.status !== 'PENDING') {
      return new NextResponse("Application is not pending", { status: 400 });
    }

    // Update application status
    const updatedApplication = await prisma.welfareApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      }
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "APPROVE_WELFARE_APPLICATION",
        details: `Approved welfare application for ${application.deceasedName} - $${application.claimAmount}`,
      },
    });

    // TODO: Send approval email to applicant
    // TODO: Create reimbursement records for all active welfare members

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("[WELFARE_APPLICATION_APPROVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}