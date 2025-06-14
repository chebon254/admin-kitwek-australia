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

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all inactive users
    const inactiveUsers = await prisma.user.findMany({
      where: {
        membershipStatus: "INACTIVE",
        revokeStatus: false, // Don't email revoked users
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (inactiveUsers.length === 0) {
      return NextResponse.json({ 
        message: "No inactive users found",
        emailsSent: 0 
      });
    }

    const activationLink = `https://kitwekvictoria.org/dashboard/membership`;
    let emailsSent = 0;
    const failedEmails: string[] = [];

    // Send emails in batches to avoid overwhelming the SMTP server
    const batchSize = 10;
    for (let i = 0; i < inactiveUsers.length; i += batchSize) {
      const batch = inactiveUsers.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (user) => {
        try {
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
                      <p style="color: #666666;">Membership Activation Reminder</p>
                    </div>
                    <div class="content">
                      <p>Dear ${user.firstName || 'Member'} ${user.lastName || ''},</p>
                      
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
          emailsSent++;
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
          failedEmails.push(user.email);
        }
      });

      await Promise.allSettled(emailPromises);
      
      // Add a small delay between batches to be respectful to the SMTP server
      if (i + batchSize < inactiveUsers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log the bulk email activity
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "BULK_EMAIL_INACTIVE_USERS",
        details: `Sent activation emails to ${emailsSent} inactive users. ${failedEmails.length} emails failed.`,
      },
    });

    return NextResponse.json({ 
      message: `Successfully sent ${emailsSent} activation emails`,
      emailsSent,
      totalInactive: inactiveUsers.length,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined
    });

  } catch (error) {
    console.error("[BULK_EMAIL_INACTIVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}