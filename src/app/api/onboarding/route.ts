import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, profileImage } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (!profileImage) {
      return new NextResponse("Profile image is required", { status: 400 });
    }

    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { id: userId },
    });

    if (existingAdmin) {
      // Update existing admin
      const updatedAdmin = await prisma.adminUser.update({
        where: { id: userId },
        data: {
          name,
          profileImage,
        },
      });

      return NextResponse.json(updatedAdmin);
    } else {
      // Get email from Clerk
      const clerkUser = await fetch(
        `https://api.clerk.dev/v1/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        }
      ).then((res) => res.json());

      const email = clerkUser.email_addresses?.[0]?.email_address;

      if (!email) {
        return new NextResponse(
          "Failed to retrieve email from authentication provider",
          { status: 500 }
        );
      }

      // Create new admin
      const newAdmin = await prisma.adminUser.create({
        data: {
          id: userId,
          email,
          name,
          profileImage,
        },
      });

      return NextResponse.json(newAdmin);
    }
  } catch (error) {
    console.error("[ONBOARDING_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
