import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClerkClient } from '@clerk/backend';

// Initialize Clerk backend SDK
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return new NextResponse("Admin with this email already exists", { status: 400 });
    }

    try {
      // Create invitation in Clerk
      const invitation = await clerk.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: {
          role: "admin",
          name: name || undefined
        },
        redirectUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/',
      });

      // Create admin in database (we'll mark it as pending)
      const admin = await prisma.adminUser.create({
        data: {
          id: invitation.id, // Using invitation ID temporarily
          email,
          name: name || null,
        },
      });

      // Log the action
      await prisma.adminLog.create({
        data: {
          adminId: userId,
          action: "INVITE",
          details: `Invited new admin user: ${email}`,
        },
      });

      return NextResponse.json(admin);
    } catch (error: any) {
      console.error("[CLERK_CREATE_INVITATION]", error);

      if (error.errors?.[0]?.message?.includes("already exists")) {
        return new NextResponse("User with this email already exists in authentication system", { status: 400 });
      }

      return new NextResponse(
        error.message || "Failed to create invitation", 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[ADMINS_INVITE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}