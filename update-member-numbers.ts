import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// User mappings: email -> new member number
const userMappings = [
  { email: 'sawesons@gmail.com', newNumber: 'KTWV001', name: 'Brian Too' },
  { email: 'kirwastan89@gmail.com', newNumber: 'KTWV002', name: 'Stanley Kirwa' },
  { email: 'edwinkering311@gmail.com', newNumber: 'KTWV003', name: 'Edwin Kering' },
  { email: 'boenemmanuel@gmail.com', newNumber: 'KTWV004', name: 'Emmanuel Boen' },
  { email: 'kipyegogerald@gmail.com', newNumber: 'KTWV005', name: 'Gerald Kipyego' },
];

async function sendNumberChangeEmail(
  email: string,
  name: string,
  oldNumber: string | null,
  newNumber: string
) {
  try {
    await transporter.sendMail({
      from: `"Kitwek Victoria Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Kitwek Victoria - Member Number Update',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Member Number Update</title>
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
              .number-box {
                background-color: #f8f9fa;
                border-left: 4px solid #4a90e2;
                padding: 15px;
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
                <p style="color: #666666;">Member Number Update</p>
              </div>
              <div class="content">
                <p>Dear ${name},</p>

                <p>We are writing to inform you that your Kitwek Victoria member number has been updated.</p>

                ${oldNumber ? `
                  <div class="number-box">
                    <p style="margin: 0;"><strong>Previous Member Number:</strong> ${oldNumber}</p>
                  </div>
                ` : ''}

                <div class="number-box">
                  <p style="margin: 0;"><strong>New Member Number:</strong> <span style="color: #4a90e2; font-size: 18px;">${newNumber}</span></p>
                </div>

                <p>This change has been made to reorganize our member database. Your new member number is now active and should be used for all future interactions with Kitwek Victoria.</p>

                <p>If you have any questions or concerns about this change, please don't hesitate to contact us.</p>

                <p>Thank you for being a valued member of Kitwek Victoria.</p>

                <p>Best regards,<br>Kitwek Victoria Admin Team</p>
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
    console.log(`✓ Email sent to ${email}`);
  } catch (error) {
    console.error(`✗ Failed to send email to ${email}:`, error);
    throw error;
  }
}

async function updateMemberNumbers() {
  console.log('Starting member number update process...\n');

  for (const mapping of userMappings) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: mapping.email },
      });

      if (!user) {
        console.log(`⚠ User not found with email: ${mapping.email}`);
        continue;
      }

      const oldNumber = user.memberNumber;

      // Check if the new number is already in use by someone else
      const existingUser = await prisma.user.findUnique({
        where: { memberNumber: mapping.newNumber },
      });

      if (existingUser && existingUser.id !== user.id) {
        console.log(`\n→ Swapping numbers for ${mapping.email}`);
        console.log(`  Old number: ${oldNumber}`);
        console.log(`  New number: ${mapping.newNumber}`);
        console.log(`  Current holder of ${mapping.newNumber}: ${existingUser.email}`);

        // Temporarily set the existing user's memberNumber to null to avoid unique constraint
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { memberNumber: null },
        });

        // Update the target user's memberNumber
        await prisma.user.update({
          where: { id: user.id },
          data: { memberNumber: mapping.newNumber },
        });

        // Set the existing user's memberNumber to the old number
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { memberNumber: oldNumber },
        });

        console.log(`✓ Swapped numbers successfully`);

        // Send email to both users
        await sendNumberChangeEmail(
          mapping.email,
          mapping.name,
          oldNumber,
          mapping.newNumber
        );

        await sendNumberChangeEmail(
          existingUser.email,
          `${existingUser.firstName || ''} ${existingUser.lastName || ''}`.trim() || existingUser.email,
          mapping.newNumber,
          oldNumber || 'None'
        );
      } else {
        // Simple update - no swap needed
        console.log(`\n→ Updating ${mapping.email}`);
        console.log(`  Old number: ${oldNumber}`);
        console.log(`  New number: ${mapping.newNumber}`);

        await prisma.user.update({
          where: { id: user.id },
          data: { memberNumber: mapping.newNumber },
        });

        console.log(`✓ Updated successfully`);

        // Send email
        await sendNumberChangeEmail(
          mapping.email,
          mapping.name,
          oldNumber,
          mapping.newNumber
        );
      }
    } catch (error) {
      console.error(`\n✗ Error processing ${mapping.email}:`, error);
    }
  }

  console.log('\n✓ Member number update process completed!');
}

async function main() {
  try {
    await updateMemberNumbers();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
