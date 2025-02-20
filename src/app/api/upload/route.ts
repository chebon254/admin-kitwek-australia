import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { uploadImage } from '@/lib/digitalocean';

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

    const imageUrl = await uploadImage(file, path);
    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("[UPLOAD_ERROR]", error);
    return new NextResponse(error instanceof Error ? error.message : "Upload failed", { status: 500 });
  }
}