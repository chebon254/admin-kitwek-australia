import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import path from 'path';
import { prisma } from "@/lib/prisma";

// Allow up to 5 minutes for bulk email sending on Vercel
export const maxDuration = 300;

function buildActivationEmailHtml(firstName: string, lastName: string, activationLink: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activate Your Membership</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding: 20px 0;
        border-bottom: 2px solid #f0f0f0;
      }
      .content {
        padding: 20px 0;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: #4a90e2;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 4px;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        padding-top: 20px;
        border-top: 2px solid #f0f0f0;
        color: #666666;
        font-size: 12px;
      }
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

        <p>Best regards,<br>The Kitwek Victoria Team</p>
      </div>
      <div class="footer">
        <p>This email was sent by Kitwek Victoria</p>
        <p>© ${new Date().getFullYear()} Kitwek Victoria. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Get limit from query params (default all)
  const { searchParams } = new URL(request.url);
  const maxEmails = parseInt(searchParams.get('limit') || '0');

  // Get all inactive users
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
    ...(maxEmails > 0 ? { take: maxEmails } : {}),
  });

  if (inactiveUsers.length === 0) {
    return NextResponse.json({
      message: "No inactive users found",
      emailsSent: 0
    });
  }

  const total = inactiveUsers.length;
  const activationLink = `https://kitwekvictoria.org/dashboard/membership`;
  const pdfPath = path.join(
    process.cwd(),
    "public/files/Kitwek Victoria - Strengthening the Kalenjin Community.pdf"
  );

  // Create a pooled SMTP transporter for fast bulk sending
  const transporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      send({ type: 'start', total });

      let processed = 0;
      let successful = 0;
      let failed = 0;
      const failedEmails: Array<{ email: string; error: string }> = [];
      const batchSize = 3;

      for (let i = 0; i < inactiveUsers.length; i += batchSize) {
        const batch = inactiveUsers.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(user =>
            transporter.sendMail({
              from: `"Kitwek Victoria Admin" <${process.env.SMTP_USER}>`,
              to: user.email,
              subject: 'Complete Your Kitwek Victoria Membership Activation',
              attachments: [
                {
                  filename: "Kitwek Victoria - Strengthening the Kalenjin Community.pdf",
                  path: pdfPath,
                },
              ],
              html: buildActivationEmailHtml(
                user.firstName || '',
                user.lastName || '',
                activationLink
              ),
            })
          )
        );

        for (let j = 0; j < results.length; j++) {
          processed++;
          const result = results[j];
          if (result.status === 'fulfilled') {
            successful++;
          } else {
            failed++;
            failedEmails.push({
              email: batch[j].email,
              error: result.reason?.message || 'Unknown error',
            });
          }
        }

        send({
          type: 'progress',
          total,
          processed,
          successful,
          failed,
          currentEmail: batch[batch.length - 1].email,
          failedEmails,
        });
      }

      transporter.close();

      // Get total count for reporting
      const totalInactiveCount = await prisma.user.count({
        where: {
          membershipStatus: "INACTIVE",
          revokeStatus: false,
        },
      });

      // Log the bulk email activity
      try {
        await prisma.adminLog.create({
          data: {
            adminId: userId,
            action: "BULK_EMAIL_INACTIVE_USERS",
            details: `Sent activation emails with constitution PDF to ${successful}/${total} inactive users. ${failed} failed. Total inactive users: ${totalInactiveCount}`,
          },
        });
      } catch (logError) {
        console.error("[BULK_EMAIL_LOG]", logError);
      }

      send({
        type: 'complete',
        total,
        processed,
        successful,
        failed,
        failedEmails,
        totalInactive: totalInactiveCount,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
