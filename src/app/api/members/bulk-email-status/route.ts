import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the most recent bulk email log
    const lastBulkEmail = await prisma.adminLog.findFirst({
      where: {
        action: "BULK_EMAIL_INACTIVE_USERS",
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
        details: true,
      },
    });

    if (!lastBulkEmail) {
      return NextResponse.json({
        canSend: true,
        lastSentDate: null,
        message: "No previous bulk emails sent",
      });
    }

    const lastSentDate = lastBulkEmail.createdAt;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const canSend = lastSentDate < oneWeekAgo;
    const nextAvailableDate = new Date(lastSentDate);
    nextAvailableDate.setDate(nextAvailableDate.getDate() + 7);

    return NextResponse.json({
      canSend,
      lastSentDate: lastSentDate.toISOString(),
      nextAvailableDate: canSend ? null : nextAvailableDate.toISOString(),
      message: canSend
        ? "You can send bulk emails now"
        : `You can send bulk emails again after ${nextAvailableDate.toLocaleDateString()}`,
    });

  } catch (error) {
    console.error("[BULK_EMAIL_STATUS]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Record that bulk email was initiated
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "BULK_EMAIL_INACTIVE_USERS",
        details: "Bulk email process initiated",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bulk email initiated",
    });

  } catch (error) {
    console.error("[BULK_EMAIL_STATUS_POST]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}
