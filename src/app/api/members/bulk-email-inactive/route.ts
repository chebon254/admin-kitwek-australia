import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBatchActivationEmails } from "@/lib/zeptomail";
import path from "path";

// GET: Return count of inactive users and campaign status
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    // If campaignId provided, return campaign status
    if (campaignId) {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }

      return NextResponse.json({
        id: campaign.id,
        status: campaign.status,
        totalRecipients: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        failedEmails: campaign.failedEmails ? JSON.parse(campaign.failedEmails) : [],
        createdAt: campaign.createdAt,
        completedAt: campaign.completedAt,
      });
    }

    // Count inactive users
    const totalInactive = await prisma.user.count({
      where: {
        membershipStatus: "INACTIVE",
        revokeStatus: false,
      },
    });

    // Check for active campaigns
    const activeCampaigns = await prisma.emailCampaign.findMany({
      where: {
        type: 'ACTIVATION_REMINDER',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    // Recent completed campaigns (last 24h)
    const recentCampaigns = await prisma.emailCampaign.findMany({
      where: {
        type: 'ACTIVATION_REMINDER',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        subject: true,
        status: true,
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
        createdAt: true,
        completedAt: true,
      },
    });

    // Check weekly limit from admin logs
    const lastBulkEmail = await prisma.adminLog.findFirst({
      where: {
        action: "BULK_EMAIL_INACTIVE_USERS",
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    let canSend = true;
    let lastSentDate: string | null = null;
    let nextAvailableDate: string | null = null;

    if (lastBulkEmail) {
      lastSentDate = lastBulkEmail.createdAt.toISOString();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      canSend = lastBulkEmail.createdAt < oneWeekAgo;

      if (!canSend) {
        const nextDate = new Date(lastBulkEmail.createdAt);
        nextDate.setDate(nextDate.getDate() + 7);
        nextAvailableDate = nextDate.toISOString();
      }
    }

    return NextResponse.json({
      total: totalInactive,
      canSend,
      lastSentDate,
      nextAvailableDate,
      activeCampaign: activeCampaigns[0] ? {
        id: activeCampaigns[0].id,
        status: activeCampaigns[0].status,
        totalRecipients: activeCampaigns[0].totalRecipients,
        sentCount: activeCampaigns[0].sentCount,
        failedCount: activeCampaigns[0].failedCount,
      } : null,
      recentCampaigns,
    });
  } catch (error) {
    console.error("[BULK_EMAIL_INACTIVE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Create a new email campaign for inactive users
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check weekly limit
    const lastBulkEmail = await prisma.adminLog.findFirst({
      where: {
        action: "BULK_EMAIL_INACTIVE_USERS",
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (lastBulkEmail) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      if (lastBulkEmail.createdAt >= oneWeekAgo) {
        const nextDate = new Date(lastBulkEmail.createdAt);
        nextDate.setDate(nextDate.getDate() + 7);
        return NextResponse.json(
          { error: `You can send bulk emails again after ${nextDate.toLocaleDateString()}` },
          { status: 429 }
        );
      }
    }

    // Check for existing active campaign
    const existingCampaign = await prisma.emailCampaign.findFirst({
      where: {
        type: 'ACTIVATION_REMINDER',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (existingCampaign) {
      return NextResponse.json(
        { error: "An activation reminder campaign is already in progress. Please wait for it to complete." },
        { status: 409 }
      );
    }

    // Fetch all inactive users
    const inactiveUsers = await prisma.user.findMany({
      where: {
        membershipStatus: "INACTIVE",
        revokeStatus: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    const recipients = inactiveUsers
      .filter(u => u.email)
      .map(u => ({
        email: u.email,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        sent: false,
      }));

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No inactive users found" }, { status: 404 });
    }

    // Create the campaign
    const campaign = await prisma.emailCampaign.create({
      data: {
        type: 'ACTIVATION_REMINDER',
        subject: 'Complete Your Kitwek Victoria Membership Activation',
        totalRecipients: recipients.length,
        recipients: JSON.stringify(recipients),
        status: 'IN_PROGRESS',
        adminId: userId,
      },
    });

    // Send emails immediately via ZeptoMail
    const activationLink = `${process.env.NEXT_PUBLIC_URL}/dashboard/membership`;
    const pdfPath = path.join(process.cwd(), "public/files/Kitwek Victoria - Strengthening the Kalenjin Community.pdf");

    const emailResults = await sendBatchActivationEmails(
      recipients.map(r => ({
        email: r.email,
        firstName: r.firstName,
        lastName: r.lastName
      })),
      activationLink,
      pdfPath
    );

    // Update campaign with results
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'COMPLETED',
        sentCount: emailResults.sent,
        failedCount: emailResults.failed,
        failedEmails: emailResults.failed > 0
          ? JSON.stringify(emailResults.results.filter(r => !r.sent))
          : null,
        completedAt: new Date(),
      },
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "BULK_EMAIL_INACTIVE_USERS",
        details: `Sent activation reminders to ${emailResults.sent} inactive users via ZeptoMail. Failed: ${emailResults.failed}.`,
      },
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      totalRecipients: recipients.length,
      sent: emailResults.sent,
      failed: emailResults.failed,
      message: `Campaign completed. ${emailResults.sent} emails sent successfully, ${emailResults.failed} failed.`,
    });
  } catch (error) {
    console.error("[BULK_EMAIL_INACTIVE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
