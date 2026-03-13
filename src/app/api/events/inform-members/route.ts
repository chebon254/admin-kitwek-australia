import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBatchEventEmails } from "@/lib/zeptomail";

// GET: Return count of registered users (for confirmation) or campaign status
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

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

    // Count registered users with at least an email or phone (exclude revoked)
    const users = await prisma.user.findMany({
      where: {
        revokeStatus: false,
      },
      select: { email: true, phone: true },
    });

    const total = users.filter(
      u => Boolean(u.email?.trim() || u.phone?.trim())
    ).length;

    const activeCampaigns = await prisma.emailCampaign.findMany({
      where: {
        type: 'EVENT_NOTIFICATION',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const recentCampaigns = await prisma.emailCampaign.findMany({
      where: {
        type: 'EVENT_NOTIFICATION',
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

    return NextResponse.json({
      total,
      activeCampaign: activeCampaigns[0]
        ? {
            id: activeCampaigns[0].id,
            status: activeCampaigns[0].status,
            totalRecipients: activeCampaigns[0].totalRecipients,
            sentCount: activeCampaigns[0].sentCount,
            failedCount: activeCampaigns[0].failedCount,
          }
        : null,
      recentCampaigns,
    });
  } catch (error) {
    console.error("[EVENTS_INFORM_MEMBERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Create a new email campaign targeting all registered users
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { subject, htmlMessage, signature } = await request.json();

    if (!subject || !htmlMessage) {
      return NextResponse.json({ error: "Missing subject or message" }, { status: 400 });
    }

    // Check for existing active campaign
    const existingCampaign = await prisma.emailCampaign.findFirst({
      where: {
        type: 'EVENT_NOTIFICATION',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (existingCampaign) {
      return NextResponse.json(
        { error: "An event notification campaign is already in progress. Please wait for it to complete." },
        { status: 409 }
      );
    }

    // Fetch all registered, non-revoked users
    const users = await prisma.user.findMany({
      where: {
        revokeStatus: false,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
      },
    });

    const recipients = users
      .filter(u => Boolean(u.email?.trim() || u.phone?.trim()))
      .map(u => ({
        email: u.email || null,
        phone: u.phone || null,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        sent: false,
      }));

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No registered members found" }, { status: 404 });
    }

    // Create the campaign
    const campaign = await prisma.emailCampaign.create({
      data: {
        type: 'EVENT_NOTIFICATION',
        subject,
        htmlMessage,
        totalRecipients: recipients.length,
        recipients: JSON.stringify(recipients),
        status: 'IN_PROGRESS',
        adminId: userId,
      },
    });

    // Send notifications (email + SMS where available)
    const notificationResults = await sendBatchEventEmails(
      recipients.map(r => ({
        email: r.email,
        phone: r.phone,
        firstName: r.firstName,
        lastName: r.lastName,
      })),
      subject,
      htmlMessage,
      signature || 'Kind regards,\nKitwek Victoria'
    );

    // Update campaign with results
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'COMPLETED',
        sentCount: notificationResults.sent,
        failedCount: notificationResults.failed,
        failedEmails:
          notificationResults.failed > 0
            ? JSON.stringify(notificationResults.results.filter(r => !r.sent))
            : null,
        completedAt: new Date(),
      },
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "EVENT_INFORM_MEMBERS_CAMPAIGN",
        details: `Sent event notification "${subject}" to ${notificationResults.sent} members (email: ${notificationResults.emailSent}, sms: ${notificationResults.smsSent}). Failed: ${notificationResults.failed}.`,
      },
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      totalRecipients: recipients.length,
      sent: notificationResults.sent,
      failed: notificationResults.failed,
      emailSent: notificationResults.emailSent,
      smsSent: notificationResults.smsSent,
      message: `Campaign completed. ${notificationResults.sent} members notified successfully (${notificationResults.emailSent} emails, ${notificationResults.smsSent} SMS), ${notificationResults.failed} failed.`,
    });
  } catch (error) {
    console.error("[EVENTS_INFORM_MEMBERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
