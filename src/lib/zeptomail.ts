/**
 * ZeptoMail Service for Bulk Email Sending
 *
 * Replaces Zoho Mail SMTP with ZeptoMail API for immediate bulk email sending.
 * No rate limiting - designed for transactional and bulk emails.
 */

// Type declaration for zeptomail package (lacks official TypeScript types)
declare module "zeptomail" {
  export class SendMailClient {
    constructor(config: { url: string; token: string });
    sendMail(options: {
      from: { address: string; name: string };
      to: Array<{ email_address: { address: string; name: string } }>;
      subject: string;
      htmlbody: string;
      attachments?: Array<{ content: string; mime_type: string; name: string }>;
    }): Promise<void>;
  }
}

import { SendMailClient } from "zeptomail";
import path from "path";
import fs from "fs";

// Initialize ZeptoMail client
const client = new SendMailClient({
  url: process.env.ZEPTOMAIL_URL || "api.zeptomail.com/",
  token: process.env.ZEPTOMAIL_TOKEN || "",
});

interface EmailRecipient {
  email: string;
  firstName: string;
  lastName?: string;
}

interface EmailResult {
  sent: boolean;
  email: string;
  error?: string;
}

interface ZeptoMailAddress {
  address: string;
  name: string;
}

interface ZeptoMailRecipient {
  email_address: {
    address: string;
    name: string;
  };
}

interface ZeptoMailAttachment {
  content: string;
  mime_type: string;
  name: string;
}

interface ZeptoMailOptions {
  from: ZeptoMailAddress;
  to: ZeptoMailRecipient[];
  subject: string;
  htmlbody: string;
  attachments?: ZeptoMailAttachment[];
}

/**
 * Build HTML template for activation email
 */
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
          <p style="margin: 5px 0 0 0; font-size: 14px;">We've attached our organization's constitution document for your review.</p>
        </div>
        <p>Best regards,<br>Kitwek Victoria Welfare Committee</p>
        <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px;"><strong>Need help?</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Contact us at <a href="mailto:welfare@kitwekvictoria.org" style="color: #3b82f6; text-decoration: none;">welfare@kitwekvictoria.org</a></p>
        </div>
      </div>
      <div class="footer">
        <p>This email was sent by Kitwek Victoria</p>
        <p>&copy; ${new Date().getFullYear()} Kitwek Victoria. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Build HTML template for welfare notification email
 */
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
      .footer { text-align: center; padding-top: 20px; border-top: 2px solid #f0f0f0; color: #666666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="color: #333333; margin: 0;">Kitwek Victoria</h1>
        <p style="color: #666666;">Welfare Notification</p>
      </div>
      <div class="content">
        <p>Dear ${firstName || 'Member'},</p>
        ${htmlMessage}
        <p>Kind regards,<br>Kitwek Victoria Welfare Committee</p>
        <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px;"><strong>Need help?</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Contact us at <a href="mailto:welfare@kitwekvictoria.org" style="color: #3b82f6; text-decoration: none;">welfare@kitwekvictoria.org</a></p>
        </div>
      </div>
      <div class="footer">
        <p>This email was sent by Kitwek Victoria Welfare Committee</p>
        <p>&copy; ${new Date().getFullYear()} Kitwek Victoria. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Send batch activation emails to inactive users
 * Sends all emails immediately via ZeptoMail API
 */
export async function sendBatchActivationEmails(
  recipients: EmailRecipient[],
  activationLink: string,
  pdfPath?: string
): Promise<{ sent: number; failed: number; results: EmailResult[] }> {
  const results: EmailResult[] = [];
  let sent = 0;
  let failed = 0;

  // Read PDF attachment if provided
  let pdfContent: string | undefined;
  if (pdfPath && fs.existsSync(pdfPath)) {
    const pdfBuffer = fs.readFileSync(pdfPath);
    pdfContent = pdfBuffer.toString('base64');
  }

  // Send emails one by one (ZeptoMail handles rate limiting)
  for (const recipient of recipients) {
    try {
      const htmlContent = buildActivationEmailHtml(
        recipient.firstName,
        recipient.lastName || '',
        activationLink
      );

      const mailOptions: ZeptoMailOptions = {
        from: {
          address: process.env.SMTP_USER || "noreply@kitwekvictoria.org",
          name: "Kitwek Victoria"
        },
        to: [
          {
            email_address: {
              address: recipient.email,
              name: `${recipient.firstName} ${recipient.lastName || ''}`.trim()
            }
          }
        ],
        subject: "Activate Your Kitwek Victoria Membership",
        htmlbody: htmlContent,
      };

      // Add PDF attachment if available
      if (pdfContent && pdfPath) {
        mailOptions.attachments = [
          {
            content: pdfContent,
            mime_type: "application/pdf",
            name: path.basename(pdfPath)
          }
        ];
      }

      await client.sendMail(mailOptions);
      results.push({ sent: true, email: recipient.email });
      sent++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to send email to ${recipient.email}:`, errorMessage);
      results.push({
        sent: false,
        email: recipient.email,
        error: errorMessage
      });
      failed++;
    }
  }

  return { sent, failed, results };
}

/**
 * Send batch welfare notification emails
 * Sends all emails immediately via ZeptoMail API
 */
export async function sendBatchWelfareEmails(
  recipients: EmailRecipient[],
  subject: string,
  htmlMessage: string
): Promise<{ sent: number; failed: number; results: EmailResult[] }> {
  const results: EmailResult[] = [];
  let sent = 0;
  let failed = 0;

  // Send emails one by one (ZeptoMail handles rate limiting)
  for (const recipient of recipients) {
    try {
      const htmlContent = buildWelfareEmailHtml(
        recipient.firstName,
        subject,
        htmlMessage
      );

      await client.sendMail({
        from: {
          address: process.env.SMTP_USER || "noreply@kitwekvictoria.org",
          name: "Kitwek Victoria"
        },
        to: [
          {
            email_address: {
              address: recipient.email,
              name: `${recipient.firstName} ${recipient.lastName || ''}`.trim()
            }
          }
        ],
        subject: subject,
        htmlbody: htmlContent,
      });

      results.push({ sent: true, email: recipient.email });
      sent++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to send email to ${recipient.email}:`, errorMessage);
      results.push({
        sent: false,
        email: recipient.email,
        error: errorMessage
      });
      failed++;
    }
  }

  return { sent, failed, results };
}
