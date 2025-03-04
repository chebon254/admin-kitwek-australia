import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClerkClient } from "@clerk/backend";

// Initialize Clerk backend SDK
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: (await params).id },
    });

    if (!admin) {
      return new NextResponse("Admin not found", { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error("[ADMIN_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if trying to delete super admin
    const admin = await prisma.adminUser.findUnique({
      where: { id: (await params).id },
    });

    if (!admin) {
      return new NextResponse("Admin not found", { status: 404 });
    }

    if (admin.email === "info@kitwekvictoria.org") {
      return new NextResponse("Cannot delete super admin", { status: 403 });
    }

    // Delete from Clerk
    try {
      await clerk.users.deleteUser((await params).id);
    } catch (clerkError) {
      console.error("[CLERK_DELETE_USER]", clerkError);
      // Continue with database deletion even if Clerk deletion fails
    }

    // Delete from database
    await prisma.adminUser.delete({
      where: { id: (await params).id },
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "DELETE",
        details: `Deleted admin user: ${admin.email}`,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ADMIN_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
