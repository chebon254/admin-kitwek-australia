import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const forum = await prisma.forum.findUnique({
      where: { id: (await params).id },
    });

    if (!forum || forum.adminId !== userId) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(forum);
  } catch (error) {
    console.error("[FORUM_GET]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const forum = await prisma.forum.findUnique({
      where: { id: (await params).id },
    });

    if (!forum || forum.adminId !== userId) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    const { title, description } = await request.json();

    const updatedForum = await prisma.forum.update({
      where: { id: (await params).id },
      data: {
        title,
        description,
      },
    });

    return NextResponse.json(updatedForum);
  } catch (error) {
    console.error("[FORUM_PATCH]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string } >}
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const forumId = (await params).id;

    const forum = await prisma.forum.findUnique({
      where: { id: forumId },
    });

    if (!forum || forum.adminId !== userId) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    // Delete forum comments first, then forum
    await prisma.$transaction(async (tx) => {
      // Delete all comments for this forum
      await tx.forumComment.deleteMany({
        where: { forumId: forumId },
      });

      // Delete the forum
      await tx.forum.delete({
        where: { id: forumId },
      });
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "DELETE_FORUM",
        details: `Deleted forum: ${forum.title}`,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[FORUM_DELETE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete forum" },
      { status: 500 }
    );
  }
}
