import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoadingLink } from "@/components/ui/LoadingLink";
import { DonationsList } from "@/components/donations/DonationsList";

export default async function DonationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const donations = await prisma.donation.findMany({
    where: { adminId: userId },
    include: {
      _count: {
        select: { donors: true }
      },
      donors: {
        select: {
          amount: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Donations Management</h1>
        <LoadingLink
          href="/donations/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md inline-flex items-center gap-2"
        >
          <span>Create New Campaign</span>
        </LoadingLink>
      </div>

      <DonationsList donations={donations} />
    </div>
  );
}
