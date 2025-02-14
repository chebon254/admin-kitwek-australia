import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalMembers,
      activeMembers,
      totalDonations,
      totalEvents,
      totalForums
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { membershipStatus: 'ACTIVE' }
      }),
      prisma.donation.aggregate({
        _sum: { amount: true }
      }),
      prisma.event.count(),
      prisma.forumPost.count()
    ]);

    return NextResponse.json({
      totalMembers,
      activeMembers,
      totalDonations: totalDonations._sum.amount || 0,
      totalEvents,
      totalForums
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}