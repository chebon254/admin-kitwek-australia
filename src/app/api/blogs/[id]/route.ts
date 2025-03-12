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
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const blog = await prisma.blog.findUnique({
      where: { id: (await params).id },
    });
    
    if (!blog || blog.adminId !== userId) {
      return new NextResponse("Not found", { status: 404 });
    }
    
    return NextResponse.json(blog);
  } catch (error) {
    console.error("[BLOG_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const blog = await prisma.blog.findUnique({
      where: { id: params.id },
    });
    
    if (!blog || blog.adminId !== userId) {
      return new NextResponse("Not found", { status: 404 });
    }
    
    const { title, description, thumbnail, files } = await request.json();
    const updatedBlog = await prisma.blog.update({
      where: { id: params.id },
      data: {
        title,
        description,
        thumbnail,
        files: files || [],
      },
    });
    
    return NextResponse.json(updatedBlog);
  } catch (error) {
    console.error("[BLOG_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const blog = await prisma.blog.findUnique({
      where: { id: params.id },
    });
    
    if (!blog || blog.adminId !== userId) {
      return new NextResponse("Not found", { status: 404 });
    }
    
    await prisma.blog.delete({
      where: { id: params.id },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[BLOG_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}