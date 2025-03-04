import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClerkClient } from '@clerk/backend';

// Initialize Clerk backend SDK
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error("[ADMINS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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
      // Create user in Clerk
      const clerkUser = await clerk.users.createUser({
        emailAddress: [email],
        firstName: name?.split(' ')[0] || undefined,
        lastName: name?.split(' ').slice(1).join(' ') || undefined,
      });

      // Create admin in database
      const admin = await prisma.adminUser.create({
        data: {
          id: clerkUser.id,
          email,
          name: name || null,
        },
      });

      // Log the action
      await prisma.adminLog.create({
        data: {
          adminId: userId,
          action: "CREATE",
          details: `Created new admin user: ${email}`,
        },
      });

      return NextResponse.json(admin);
    } catch (clerkError: any) {
      console.error("[CLERK_CREATE_USER]", clerkError);
      
      // Handle specific Clerk errors
      if (clerkError.errors?.[0]?.message?.includes("already exists")) {
        return new NextResponse("User with this email already exists in authentication system", { status: 400 });
      }
      
      return new NextResponse(clerkError.message || "Failed to create user in authentication system", { status: 500 });
    }
  } catch (error) {
    console.error("[ADMINS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}