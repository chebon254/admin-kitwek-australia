import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get the registration with user and family members
    const registration = await prisma.welfareRegistration.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            memberNumber: true,
            phone: true,
            createdAt: true,
          }
        }
      }
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Get family members for this user
    const familyMembers = await prisma.immediateFamily.findMany({
      where: {
        userId: registration.userId
      },
      include: {
        documents: {
          orderBy: {
            uploadedAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      user: registration.user,
      registration: {
        id: registration.id,
        status: registration.status,
        paymentStatus: registration.paymentStatus,
        registrationDate: registration.registrationDate,
        registrationFee: registration.registrationFee,
      },
      familyMembers: familyMembers
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
