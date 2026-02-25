import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import path from 'path';
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

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, firstName, lastName, phone, userId: targetUserId } = body;

    if (!email || !targetUserId) {
      return NextResponse.json(
        { success: false, error: "Email and userId required" },
        { status: 400 }
      );
    }

    const activationLink = `https://kitwekvictoria.org/dashboard/membership`;

    // Wrap email sending in try-catch to ensure we always return JSON
    try {
      await transporter.sendMail({
        from: `"Kitwek Victoria Admin" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Complete Your Kitwek Victoria Membership Activation',
        attachments: [
          {
            filename: "Kitwek Victoria - Strengthening the Kalenjin Community.pdf",
            path: path.join(
              process.cwd(),
              "public/files/Kitwek Victoria - Strengthening the Kalenjin Community.pdf"
            ),
          },
        ],
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
        </html>
      `,
      });

      try {
        await sendSmsIfPossible({
          email,
          phone,
          message:
            "Kitwek Victoria: Membership activation reminder sent. Check your email and complete activation from your dashboard.",
        });
      } catch (smsError) {
        console.error("[SMS_SEND_ERROR]", smsError);
      }
    } catch (emailError) {
      console.error("[EMAIL_SEND_ERROR]", emailError);
      return NextResponse.json(
        {
          success: false,
          error: emailError instanceof Error ? emailError.message : "Failed to send email - SMTP error"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email,
    });

  } catch (error) {
    console.error("[SEND_ACTIVATION_EMAIL]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email"
      },
      { status: 500 }
    );
  }
}
