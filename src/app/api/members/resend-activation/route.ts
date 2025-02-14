import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

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
    const { email } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await transporter.sendMail({
      from: `"Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Account Activation Reminder',
      html: `
        <h1>Hello ${user.name},</h1>
        <p>This is a reminder to activate your account. Please complete your membership activation to access all features.</p>
        <p>Visit your dashboard to get started: ${process.env.NEXT_PUBLIC_URL}/dashboard/membership</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resending activation:', error);
    return NextResponse.json(
      { error: 'Failed to resend activation email' },
      { status: 500 }
    );
  }
}