import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Type definition for update data
interface UpdateBeneficiaryData {
  fullName?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  idNumber?: string;
}

// GET - Fetch specific beneficiary details (admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const beneficiary = await prisma.immediateFamily.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        documents: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!beneficiary) {
      return new NextResponse("Beneficiary not found", { status: 404 });
    }

    return NextResponse.json(beneficiary);
  } catch (error) {
    console.error("[ADMIN_GET_BENEFICIARY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PUT - Update beneficiary (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const data: UpdateBeneficiaryData = await request.json();
    const { fullName, relationship, phone, email, idNumber } = data;

    // Validate required fields
    if (!fullName || !relationship || !phone) {
      return NextResponse.json({
        error: 'Full name, relationship, and phone are required'
      }, { status: 400 });
    }

    // Validate email format if provided
    if (email && email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({
          error: 'Invalid email format'
        }, { status: 400 });
      }
    }

    // Check if beneficiary exists
    const existingBeneficiary = await prisma.immediateFamily.findUnique({
      where: { id },
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

    if (!existingBeneficiary) {
      return new NextResponse("Beneficiary not found", { status: 404 });
    }

    // Update the beneficiary
    const updatedBeneficiary = await prisma.immediateFamily.update({
      where: { id },
      data: {
        fullName,
        relationship,
        phone,
        email: email || null,
        idNumber: idNumber || null,
      },
      include: {
        documents: true
      }
    });

    // Log the admin action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "UPDATE_BENEFICIARY",
        details: `Updated beneficiary ${fullName} (${relationship}) for user ${existingBeneficiary.user.email}`,
      },
    });

    return NextResponse.json({
      success: true,
      beneficiary: updatedBeneficiary,
      message: 'Beneficiary updated successfully'
    });
  } catch (error) {
    console.error("[ADMIN_UPDATE_BENEFICIARY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE - Remove beneficiary (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    // Check if beneficiary exists
    const existingBeneficiary = await prisma.immediateFamily.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!existingBeneficiary) {
      return new NextResponse("Beneficiary not found", { status: 404 });
    }

    // Check if user has paid registration - if yes, they must keep at least 1 beneficiary
    const registration = await prisma.welfareRegistration.findUnique({
      where: { userId: existingBeneficiary.userId }
    });

    if (registration && registration.paymentStatus === 'PAID') {
      // Count total beneficiaries for this user
      const beneficiaryCount = await prisma.immediateFamily.count({
        where: { userId: existingBeneficiary.userId }
      });

      if (beneficiaryCount <= 1) {
        return NextResponse.json({
          error: 'Cannot delete the last beneficiary for a paid welfare member. User must have at least one beneficiary.'
        }, { status: 400 });
      }
    }

    // Delete associated documents first
    await prisma.familyDocument.deleteMany({
      where: { familyMemberId: id }
    });

    // Delete the beneficiary
    await prisma.immediateFamily.delete({
      where: { id }
    });

    // Log the admin action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "DELETE_BENEFICIARY",
        details: `Deleted beneficiary ${existingBeneficiary.fullName} (${existingBeneficiary.relationship}) for user ${existingBeneficiary.user.email}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Beneficiary deleted successfully'
    });
  } catch (error) {
    console.error("[ADMIN_DELETE_BENEFICIARY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
