import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBatchWelfareEmails } from "@/lib/zeptomail";

// GET: Return count of active welfare members (for confirmation) or campaign status
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

    // Otherwise return recipient count
    const activeMembers = await prisma.welfareRegistration.findMany({
      where: {
        status: 'ACTIVE',
        paymentStatus: 'PAID',
      },
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    const total = activeMembers.filter(m => m.user?.email).length;

    // Also return any active campaigns
    const activeCampaigns = await prisma.emailCampaign.findMany({
      where: {
        type: 'WELFARE_NOTIFICATION',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    // Recent completed campaigns (last 24h)
    const recentCampaigns = await prisma.emailCampaign.findMany({
      where: {
        type: 'WELFARE_NOTIFICATION',
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
    console.error("[WELFARE_INFORM_MEMBERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Create a new email campaign for welfare members
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { subject, htmlMessage } = await request.json();

    if (!subject || !htmlMessage) {
      return NextResponse.json({ error: "Missing subject or message" }, { status: 400 });
    }

    // Check for existing active campaign
    const existingCampaign = await prisma.emailCampaign.findFirst({
      where: {
        type: 'WELFARE_NOTIFICATION',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (existingCampaign) {
      return NextResponse.json(
        { error: "A welfare notification campaign is already in progress. Please wait for it to complete." },
        { status: 409 }
      );
    }

    // Fetch all active welfare members
    const activeMembers = await prisma.welfareRegistration.findMany({
      where: {
        status: 'ACTIVE',
        paymentStatus: 'PAID',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    const recipients = activeMembers
      .filter(m => m.user?.email)
      .map(m => ({
        email: m.user!.email!,
        firstName: m.user!.firstName || '',
        lastName: m.user!.lastName || '',
        sent: false,
      }));

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No active welfare members found" }, { status: 404 });
    }

    // Create the campaign
    const campaign = await prisma.emailCampaign.create({
      data: {
        type: 'WELFARE_NOTIFICATION',
        subject,
        htmlMessage,
        totalRecipients: recipients.length,
        recipients: JSON.stringify(recipients),
        status: 'IN_PROGRESS',
        adminId: userId,
      },
    });

    // Send emails immediately via ZeptoMail
    const emailResults = await sendBatchWelfareEmails(
      recipients.map(r => ({
        email: r.email,
        firstName: r.firstName,
        lastName: r.lastName
      })),
      subject,
      htmlMessage
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
        action: "WELFARE_INFORM_MEMBERS_CAMPAIGN",
        details: `Sent welfare notification "${subject}" to ${emailResults.sent} members via ZeptoMail. Failed: ${emailResults.failed}.`,
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
    console.error("[WELFARE_INFORM_MEMBERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
