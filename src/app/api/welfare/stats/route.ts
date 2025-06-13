import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get or create welfare fund record
    let welfareStats = await prisma.welfareFund.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!welfareStats) {
      welfareStats = await prisma.welfareFund.create({
        data: {
          totalAmount: 0,
          totalMembers: 0,
          activeMembers: 0,
          isOperational: false,
        }
      });
    }

    // Get current counts
    const totalRegistrations = await prisma.welfareRegistration.count();
    const activeRegistrations = await prisma.welfareRegistration.count({
      where: {
        status: 'ACTIVE',
        paymentStatus: 'PAID'
      }
    });

    const pendingRegistrations = await prisma.welfareRegistration.count({
      where: { paymentStatus: 'PENDING' }
    });

    // Get application counts
    const totalApplications = await prisma.welfareApplication.count();
    const pendingApplications = await prisma.welfareApplication.count({
      where: { status: 'PENDING' }
    });
    const approvedApplications = await prisma.welfareApplication.count({
      where: { status: 'APPROVED' }
    });
    const paidApplications = await prisma.welfareApplication.count({
      where: { status: 'PAID' }
    });

    // Calculate total amounts
    const totalFundAmount = activeRegistrations * 200;
    const totalPaidClaims = await prisma.welfareApplication.aggregate({
      where: { status: 'PAID' },
      _sum: { claimAmount: true }
    });

    // Check if fund should be operational
    const isOperational = activeRegistrations >= 1;

    // Update welfare fund record if needed
    if (welfareStats.totalMembers !== totalRegistrations || 
        welfareStats.activeMembers !== activeRegistrations ||
        welfareStats.isOperational !== isOperational) {
      
      welfareStats = await prisma.welfareFund.update({
        where: { id: welfareStats.id },
        data: {
          totalMembers: totalRegistrations,
          activeMembers: activeRegistrations,
          totalAmount: totalFundAmount,
          isOperational: isOperational,
          lastUpdated: new Date(),
          launchDate: !welfareStats.launchDate && isOperational ? new Date() : welfareStats.launchDate,
          waitingPeriodEnd: !welfareStats.waitingPeriodEnd && isOperational ? 
            new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) : 
            welfareStats.waitingPeriodEnd
        }
      });
    }

    return NextResponse.json({
      // Registration stats
      totalRegistrations,
      activeRegistrations,
      pendingRegistrations,
      totalFundAmount,
      
      // Application stats
      totalApplications,
      pendingApplications,
      approvedApplications,
      paidApplications,
      totalPaidClaims: totalPaidClaims._sum.claimAmount || 0,
      
      // Fund stats
      isOperational,
      launchDate: welfareStats.launchDate,
      waitingPeriodEnd: welfareStats.waitingPeriodEnd,
      lastUpdated: welfareStats.lastUpdated,
    });
  } catch (error) {
    console.error("[WELFARE_ADMIN_STATS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}