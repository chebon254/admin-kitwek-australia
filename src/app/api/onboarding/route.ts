import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      console.error("[ONBOARDING_ERROR] No userId or user found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("[ONBOARDING_ERROR] Failed to parse request body", e);
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { name, profileImage } = body;

    // Validate required fields
    if (!name?.trim() || !profileImage?.trim()) {
      console.error("[ONBOARDING_ERROR] Missing required fields", {
        name,
        profileImage,
      });
      return new NextResponse("Name and profile image are required", {
        status: 400,
      });
    }

    // Get primary email
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress;

    if (!primaryEmail) {
      console.error(
        "[ONBOARDING_ERROR] No primary email found for user",
        userId
      );
      return new NextResponse("No primary email found", { status: 400 });
    }

    // Create or update admin user
    try {
      const adminUser = await prisma.adminUser.upsert({
        where: { id: userId },
        update: {
          name: name.trim(),
          profileImage,
          email: primaryEmail,
        },
        create: {
          id: userId,
          email: primaryEmail,
          name: name.trim(),
          profileImage,
        },
      });

      return NextResponse.json(adminUser);
    } catch (e) {
      console.error("[ONBOARDING_ERROR] Database operation failed", e);
      return new NextResponse("Failed to save user data", { status: 500 });
    }
  } catch (error) {
    // Fix the console.error call to handle null/undefined values properly
    console.error(
      "[ONBOARDING_ERROR] Unhandled error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
