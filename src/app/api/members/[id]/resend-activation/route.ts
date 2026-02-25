import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import { prisma } from "@/lib/prisma";
import { sendSmsIfPossible } from "@/lib/sms";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const activationLink = `https://kitwekvictoria.org/dashboard/membership`;
    
    await transporter.sendMail({
      from: `"Kitwek Victoria Admin" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Complete Your Kitwek Victoria Membership Activation',
      html: `
        <!DOCTYPE html>
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
                <p style="color: #666666;">Membership Activation</p>
              </div>
              <div class="content">
                <p>Dear ${user.firstName} ${user.lastName},</p>
                
                <p>Thank you for joining Kitwek Victoria. To complete your membership activation and access all member features, please click the button below:</p>
                
                <div style="text-align: center;">
                  <a href="${activationLink}" class="button" style="color: #FFFFFF !important;">Activate Membership</a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #4a90e2;">${activationLink}</p>
                
                <p>This link will take you to your membership dashboard where you can complete the activation process.</p>
                
                <p>If you did not request this activation, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>This email was sent by Kitwek Victoria</p>
                <p>© ${new Date().getFullYear()} Kitwek Victoria. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    try {
      await sendSmsIfPossible({
        email: user.email,
        phone: user.phone ?? undefined,
        message:
          "Kitwek Victoria: Membership activation email resent. Please check your inbox and complete activation in your dashboard.",
      });
    } catch (smsError) {
      console.error("[MEMBER_RESEND_ACTIVATION_SMS]", smsError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MEMBER_RESEND_ACTIVATION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
