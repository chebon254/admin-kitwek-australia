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
    const { reason } = await request.json();

    if (!reason?.trim()) {
      return new NextResponse("Rejection reason is required", { status: 400 });
    }

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
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason.trim(),
      }
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "REJECT_WELFARE_APPLICATION",
        details: `Rejected welfare application for ${application.deceasedName} - Reason: ${reason.trim()}`,
      },
    });

    // TODO: Send rejection email to applicant

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("[WELFARE_APPLICATION_REJECT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}