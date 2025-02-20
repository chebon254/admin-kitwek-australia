import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const { name, profileImage } = await req.json();
    const user = await currentUser();

    if (!userId) {
      console.error("[ONBOARDING_ERROR] No userId found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!name || !profileImage) {
      console.error("[ONBOARDING_ERROR] Missing required fields", { name, profileImage });
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!user?.emailAddresses?.[0]?.emailAddress) {
      console.error("[ONBOARDING_ERROR] No email found for user");
      return new NextResponse("Email not found", { status: 400 });
    }

    const userEmail = user.emailAddresses[0].emailAddress;

    console.log("[ONBOARDING] Creating/updating admin user", { userId, email: userEmail, name });

    const adminUser = await prisma.adminUser.upsert({
      where: { id: userId },
      update: {
        name,
        profileImage,
      },
      create: {
        id: userId,
        email: userEmail,
        name,
        profileImage,
      },
    });

    console.log("[ONBOARDING] Admin user created/updated successfully", adminUser);

    return NextResponse.json(adminUser);
  } catch (error) {
    console.error("[ONBOARDING_ERROR] Detailed error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}