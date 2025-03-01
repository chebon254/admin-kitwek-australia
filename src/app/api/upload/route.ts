import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { uploadImage } from '@/lib/digitalocean';

export const maxDuration = 60; // Set Next.js route handler timeout to 60 seconds

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return new NextResponse("File and path are required", { status: 400 });
    }

    // Reduce file size limit to 2MB for more reliable uploads
    if (file.size > 2 * 1024 * 1024) {
      return new NextResponse("File size exceeds 2MB limit", { status: 400 });
    }

    console.log(`API route received file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    try {
      const imageUrl = await uploadImage(file, path);
      return NextResponse.json({ url: imageUrl });
    } catch (uploadError) {
      console.error("[UPLOAD_ERROR]", uploadError);
      return new NextResponse(
        uploadError instanceof Error ? uploadError.message : "Upload failed", 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[UPLOAD_ERROR]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Upload failed", 
      { status: 500 }
    );
  }
}