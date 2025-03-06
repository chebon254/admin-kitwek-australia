import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const forum = await prisma.forum.findUnique({
      where: { id: (await params).id },
    });

    if (!forum || forum.adminId !== userId) {
      return new NextResponse("Not found", { status: 404 });
    }

    await prisma.forum.delete({
      where: { id: (await params).id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[FORUM_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}