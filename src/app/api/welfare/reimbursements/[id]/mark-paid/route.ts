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

    const reimbursementId = (await params).id;
    const { amountPaid } = await request.json();

    if (!amountPaid || amountPaid <= 0) {
      return new NextResponse("Valid payment amount is required", { status: 400 });
    }

    // Get the reimbursement
    const reimbursement = await prisma.welfareReimbursement.findUnique({
      where: { id: reimbursementId },
      include: { 
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
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
      }
    });

    if (!reimbursement) {
      return new NextResponse("Reimbursement not found", { status: 404 });
    }

    if (reimbursement.status === 'PAID') {
      return new NextResponse("Reimbursement already marked as paid", { status: 400 });
    }

    // Update reimbursement
    const updatedReimbursement = await prisma.welfareReimbursement.update({
      where: { id: reimbursementId },
      data: {
        status: 'PAID',
        amountPaid: amountPaid,
        paidAt: new Date()
      }
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "MARK_REIMBURSEMENT_PAID",
        details: `Marked reimbursement as paid: ${amountPaid} for user ${reimbursement.user?.email}`,
      },
    });

    return NextResponse.json(updatedReimbursement);
  } catch (error) {
    console.error("[WELFARE_REIMBURSEMENT_MARK_PAID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}