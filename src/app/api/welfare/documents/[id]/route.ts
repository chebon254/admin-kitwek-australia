import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

// DELETE - Remove document
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: documentId } = await params;

    // Check if document exists
    const document = await prisma.familyDocument.findUnique({
      where: { id: documentId },
      include: {
        familyMember: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    });

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), 'public', document.fileUrl);
      await unlink(filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Continue even if file deletion fails
    }

    // Delete document record from database
    await prisma.familyDocument.delete({
      where: { id: documentId }
    });

    // Log the admin action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "DELETE_BENEFICIARY_DOCUMENT",
        details: `Deleted ${document.fileType} document for beneficiary ${document.familyMember.fullName} (${document.familyMember.user.email})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error("[DELETE_BENEFICIARY_DOCUMENT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
