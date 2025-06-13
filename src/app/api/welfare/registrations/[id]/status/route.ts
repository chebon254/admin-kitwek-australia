import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const registrationId = (await params).id;
    const { status } = await request.json();

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    // Get the registration
    const registration = await prisma.welfareRegistration.findUnique({
      where: { id: registrationId },
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

    if (!registration) {
      return new NextResponse("Registration not found", { status: 404 });
    }

    if (registration.paymentStatus !== 'PAID') {
      return new NextResponse("Cannot change status of unpaid registration", { status: 400 });
    }

    // Update registration status
    const updatedRegistration = await prisma.welfareRegistration.update({
      where: { id: registrationId },
      data: { status }
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "UPDATE_WELFARE_REGISTRATION_STATUS",
        details: `Changed welfare registration status to ${status} for user: ${registration.user?.email}`,
      },
    });

    // Update welfare fund statistics
    const activeMembers = await prisma.welfareRegistration.count({
      where: { status: 'ACTIVE', paymentStatus: 'PAID' }
    });

    const welfareStats = await prisma.welfareFund.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (welfareStats) {
      await prisma.welfareFund.update({
        where: { id: welfareStats.id },
        data: {
          activeMembers,
          totalAmount: activeMembers * 200,
          isOperational: activeMembers >= 100,
          lastUpdated: new Date(),
        }
      });
    }

    return NextResponse.json(updatedRegistration);
  } catch (error) {
    console.error("[WELFARE_REGISTRATION_STATUS_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
