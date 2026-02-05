import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import { prisma } from "@/lib/prisma";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// GET: Return list of active welfare members
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
      recipients,
    });
  } catch (error) {
    console.error("[WELFARE_INFORM_MEMBERS_LIST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Send a single welfare notification email
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { email, firstName, subject, htmlMessage } = await request.json();

    if (!email || !subject || !htmlMessage) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await transporter.sendMail({
      from: `"Kitwek Australia Welfare" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
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
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WELFARE_INFORM_SEND]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
