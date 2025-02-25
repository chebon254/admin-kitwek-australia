import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, profileImage } = body;

    // Validate required fields
    if (!name?.trim() || !profileImage?.trim()) {
      return new NextResponse("Name and profile image are required", { 
        status: 400 
      });
    }

    // Get primary email
    const primaryEmail = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    )?.emailAddress;

    if (!primaryEmail) {
      return new NextResponse("No primary email found", { status: 400 });
    }

    // Create or update admin user
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

  } catch (error) {
    console.error("[ONBOARDING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}