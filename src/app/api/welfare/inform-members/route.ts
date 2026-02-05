import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import { prisma } from "@/lib/prisma";

// Allow up to 5 minutes for bulk email sending on Vercel
export const maxDuration = 300;

function buildEmailHtml(firstName: string, subject: string, htmlMessage: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
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
      .content p {
        margin: 0 0 16px 0;
        color: #333333;
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
        <h1 style="color: #333333; margin: 0;">Kitwek Australia</h1>
        <p style="color: #666666;">Welfare Notification</p>
      </div>
      <div class="content">
        <p>Dear ${firstName || 'Member'},</p>
        ${htmlMessage}
        <p>Kind regards,<br>Kitwek Australia Welfare Committee</p>
      </div>
      <div class="footer">
        <p>This email was sent by Kitwek Australia Welfare</p>
        <p>&copy; ${new Date().getFullYear()} Kitwek Australia. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;
}

// GET: Return list of active welfare members (used for confirmation count)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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
        id: m.user!.id,
        email: m.user!.email!,
        firstName: m.user!.firstName || '',
        lastName: m.user!.lastName || '',
      }));

    return NextResponse.json({
      total: recipients.length,
    });
  } catch (error) {
    console.error("[WELFARE_INFORM_MEMBERS_LIST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Send welfare notification to all active members with pooled connections
// Streams NDJSON progress events back to the client
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: { subject?: string; htmlMessage?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { subject, htmlMessage } = body;
  if (!subject || !htmlMessage) {
    return NextResponse.json({ error: "Missing subject or htmlMessage" }, { status: 400 });
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
    }));

  const total = recipients.length;

  if (total === 0) {
    return NextResponse.json({ error: "No active welfare members found" }, { status: 404 });
  }

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

      // Send initial event
      send({ type: 'start', total });

      let processed = 0;
      let successful = 0;
      let failed = 0;
      const failedEmails: Array<{ email: string; error: string }> = [];
      const batchSize = 5;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        // Send current batch in parallel via the pool
        const results = await Promise.allSettled(
          batch.map(recipient =>
            transporter.sendMail({
              from: `"Kitwek Australia Welfare" <${process.env.SMTP_USER}>`,
              to: recipient.email,
              subject,
              html: buildEmailHtml(recipient.firstName, subject, htmlMessage),
            })
          )
        );

        // Process results
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

        // Stream progress after each batch
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

      // Close the pooled transporter
      transporter.close();

      // Log the bulk email activity
      try {
        await prisma.adminLog.create({
          data: {
            adminId: userId,
            action: "WELFARE_INFORM_MEMBERS",
            details: `Sent welfare notification "${subject}" to ${successful}/${total} active welfare members. ${failed} failed.`,
          },
        });
      } catch (logError) {
        console.error("[WELFARE_INFORM_LOG]", logError);
      }

      // Send completion event
      send({
        type: 'complete',
        total,
        processed,
        successful,
        failed,
        failedEmails,
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
