import type { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH_SIZE = 50;

interface Recipient {
  email: string;
  firstName: string;
  lastName?: string;
  sent: boolean;
}

function buildWelfareEmailHtml(firstName: string, subject: string, htmlMessage: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
      .content { padding: 20px 0; }
      .content p { margin: 0 0 16px 0; color: #333333; }
      .footer { text-align: center; padding-top: 20px; border-top: 2px solid #f0f0f0; color: #666666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="color: #333333; margin: 0;">Kitwek Australia</h1>
        <p style="color: #666666;">Welfare Notification</p>
      </div>
      <div class="content">
        <p>Dear ${firstName || 'Member'},</p>
        ${htmlMessage}
        <p>Kind regards,<br>Kitwek Victoria Welfare Committee</p>
      </div>
      <div class="footer">
        <p>This email was sent by Kitwek Victoria Welfare Committee</p>
        <p>&copy; ${new Date().getFullYear()} Kitwek Australia. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;
}

function buildActivationEmailHtml(firstName: string, lastName: string, activationLink: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activate Your Membership</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
      .content { padding: 20px 0; }
      .button { display: inline-block; padding: 12px 24px; background-color: #4a90e2; color: #ffffff !important; text-decoration: none; border-radius: 4px; margin: 20px 0; }
      .footer { text-align: center; padding-top: 20px; border-top: 2px solid #f0f0f0; color: #666666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="color: #333333; margin: 0;">Kitwek Victoria</h1>
        <p style="color: #666666;">Membership Activation Reminder</p>
      </div>
      <div class="content">
        <p>Dear ${firstName || 'Member'} ${lastName || ''},</p>
        <p>We noticed that your Kitwek Victoria membership is still inactive. To access all member features and benefits, please complete your activation by clicking the button below:</p>
        <div style="text-align: center;">
          <a href="${activationLink}" class="button" style="color: #FFFFFF !important;">Activate Membership</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4a90e2;">${activationLink}</p>
        <p>This link will take you to your membership dashboard where you can complete the activation process.</p>
        <p><strong>Benefits of activating your membership:</strong></p>
        <ul>
          <li>Access to exclusive member events</li>
          <li>Voting rights in community decisions</li>
          <li>Welfare program benefits</li>
          <li>Member directory access</li>
          <li>Community forums participation</li>
        </ul>
        <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;"><strong>📄 Constitution Document Attached</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">We've attached our organization's constitution document for your review. It outlines our principles, guidelines, and community values.</p>
        </div>
        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Kitwek Victoria Welfare Committee</p>
      </div>
      <div class="footer">
        <p>This email was sent by Kitwek Victoria Welfare Committee</p>
        <p>&copy; ${new Date().getFullYear()} Kitwek Victoria. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Find active campaigns (PENDING or IN_PROGRESS)
    const campaigns = await prisma.emailCampaign.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'asc' },
      take: 1, // Process one campaign at a time
    });

    if (campaigns.length === 0) {
      return Response.json({ success: true, message: 'No campaigns to process' });
    }

    const campaign = campaigns[0];

    // Mark as IN_PROGRESS
    if (campaign.status === 'PENDING') {
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Parse recipients
    const recipients: Recipient[] = JSON.parse(campaign.recipients);
    const unsent = recipients.filter(r => !r.sent);

    if (unsent.length === 0) {
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
      return Response.json({ success: true, message: 'Campaign already complete' });
    }

    // Take the next batch
    const batch = unsent.slice(0, BATCH_SIZE);

    // Create pooled transporter
    const transporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 2,
      maxMessages: 50,
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      socketTimeout: 30000,
      greetingTimeout: 15000,
      connectionTimeout: 15000,
    });

    let batchSent = 0;
    let batchFailed = 0;
    const newFailedEmails: Array<{ email: string; error: string }> = campaign.failedEmails
      ? JSON.parse(campaign.failedEmails)
      : [];

    const activationLink = 'https://kitwekvictoria.org/dashboard/membership';
    const pdfPath = path.join(
      process.cwd(),
      'public/files/Kitwek Victoria - Strengthening the Kalenjin Community.pdf'
    );

    // Send emails one by one with a small delay to respect Zoho rate limits
    for (const recipient of batch) {
      try {
        const mailOptions: nodemailer.SendMailOptions = {
          from: `"Kitwek Victoria Welfare Committee" <${process.env.SMTP_USER}>`,
          to: recipient.email,
          subject: campaign.subject,
        };

        if (campaign.type === 'WELFARE_NOTIFICATION') {
          mailOptions.html = buildWelfareEmailHtml(
            recipient.firstName,
            campaign.subject,
            campaign.htmlMessage || ''
          );
        } else if (campaign.type === 'ACTIVATION_REMINDER') {
          mailOptions.html = buildActivationEmailHtml(
            recipient.firstName,
            recipient.lastName || '',
            activationLink
          );
          mailOptions.attachments = [
            {
              filename: 'Kitwek Victoria - Strengthening the Kalenjin Community.pdf',
              path: pdfPath,
            },
          ];
        }

        await transporter.sendMail(mailOptions);
        recipient.sent = true;
        batchSent++;
      } catch (error) {
        recipient.sent = true; // Mark as processed to avoid retrying indefinitely
        batchFailed++;
        newFailedEmails.push({
          email: recipient.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Small delay between individual emails to stay within Zoho rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    transporter.close();

    // Update campaign in DB
    const newSentCount = campaign.sentCount + batchSent;
    const newFailedCount = campaign.failedCount + batchFailed;
    const totalProcessed = newSentCount + newFailedCount;
    const isComplete = totalProcessed >= campaign.totalRecipients;

    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        recipients: JSON.stringify(recipients),
        sentCount: newSentCount,
        failedCount: newFailedCount,
        failedEmails: newFailedEmails.length > 0 ? JSON.stringify(newFailedEmails) : null,
        status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isComplete ? new Date() : null,
      },
    });

    console.log(
      `[CRON] Campaign ${campaign.id}: sent ${batchSent}, failed ${batchFailed}. ` +
      `Total: ${totalProcessed}/${campaign.totalRecipients}. ${isComplete ? 'COMPLETED' : 'Continuing next batch...'}`
    );

    return Response.json({
      success: true,
      campaignId: campaign.id,
      batchSent,
      batchFailed,
      totalProcessed,
      totalRecipients: campaign.totalRecipients,
      isComplete,
    });
  } catch (error) {
    console.error('[CRON_PROCESS_CAMPAIGNS]', error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
