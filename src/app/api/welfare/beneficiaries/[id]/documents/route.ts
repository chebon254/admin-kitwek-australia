import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// POST - Upload document for beneficiary
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: beneficiaryId } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json({
        error: 'No file provided'
      }, { status: 400 });
    }

    // Check if beneficiary exists
    const beneficiary = await prisma.immediateFamily.findUnique({
      where: { id: beneficiaryId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!beneficiary) {
      return new NextResponse("Beneficiary not found", { status: 404 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${originalName}`;
    const filePath = join(process.cwd(), 'public', 'uploads', 'welfare-documents', fileName);

    // Ensure directory exists
    const dir = join(process.cwd(), 'public', 'uploads', 'welfare-documents');
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Save file
    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/welfare-documents/${fileName}`;

    // Create document record
    const document = await prisma.familyDocument.create({
      data: {
        familyMemberId: beneficiaryId,
        fileName: file.name,
        fileUrl,
        fileType: fileType || 'other',
      }
    });

    // Log the admin action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "UPLOAD_BENEFICIARY_DOCUMENT",
        details: `Uploaded ${fileType || 'document'} for beneficiary ${beneficiary.fullName} (${beneficiary.user.email})`,
      },
    });

    return NextResponse.json({
      success: true,
      document,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error("[UPLOAD_BENEFICIARY_DOCUMENT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
