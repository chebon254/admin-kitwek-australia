import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClerkClient } from '@clerk/backend';

// Define a type for Clerk errors
interface ClerkError {
  errors?: Array<{
    message?: string;
    code?: string;
  }>;
  message?: string;
}

// Initialize Clerk backend SDK
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only allow users to change their own password
    if (userId !== (await params).id) {
      return new NextResponse("You can only change your own password", { status: 403 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new NextResponse("Current password and new password are required", { status: 400 });
    }

    if (newPassword.length < 8) {
      return new NextResponse("New password must be at least 8 characters", { status: 400 });
    }

    try {
      // Use the correct method from Clerk API
      await clerk.users.updateUser((await params).id, {
        password: newPassword
      });

      // Log the action
      await prisma.adminLog.create({
        data: {
          adminId: userId,
          action: "UPDATE",
          details: "Password updated successfully",
        },
      });

      return NextResponse.json({ success: true });
    } catch (clerkError: unknown) {
      const error = clerkError as ClerkError;
      console.error("[CLERK_UPDATE_PASSWORD]", error);

      // Handle specific Clerk errors
      if (error.errors?.[0]?.message?.includes("incorrect")) {
        return new NextResponse("Current password is incorrect", { status: 400 });
      }

      return new NextResponse(error.message || "Failed to update password", { status: 500 });
    }
  } catch (error) {
    console.error("[ADMIN_PASSWORD_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}