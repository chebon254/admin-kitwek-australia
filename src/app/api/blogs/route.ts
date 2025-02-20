import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, description, thumbnail, files } = await req.json();

    const blog = await prisma.blog.create({
      data: {
        title,
        description,
        thumbnail,
        files: files || [],
        adminId: userId,
      },
    });

    return NextResponse.json(blog);
  } catch (error) {
    console.error("[BLOGS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const blogs = await prisma.blog.findMany({
      where: { adminId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(blogs);
  } catch (error) {
    console.error("[BLOGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}