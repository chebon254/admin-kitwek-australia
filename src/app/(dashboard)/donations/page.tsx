import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { DollarSign, Users, TrendingUp } from "lucide-react";

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
        <Link
          href="/donations/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create New Campaign
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {donations.map((donation) => {
          const totalAmount = donation.donors.reduce((sum, d) => sum + d.amount, 0);
          const averageDonation = donation.donors.length > 0 
            ? totalAmount / donation.donors.length 
            : 0;

          return (
            <div key={donation.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={donation.thumbnail}
                  alt={donation.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{donation.name}</h2>
                <p className="text-gray-600 line-clamp-2 mb-4">{donation.description}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <DollarSign className="h-5 w-5 mx-auto text-green-600 mb-1" />
                    <div className="text-sm font-medium text-gray-600">Total</div>
                    <div className="text-lg font-semibold">${totalAmount.toFixed(2)}</div>
                  </div>
                  <div className="text-center">
                    <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                    <div className="text-sm font-medium text-gray-600">Donors</div>
                    <div className="text-lg font-semibold">{donation._count.donors}</div>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                    <div className="text-sm font-medium text-gray-600">Average</div>
                    <div className="text-lg font-semibold">${averageDonation.toFixed(2)}</div>
                  </div>
                </div>

                {donation.goal && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min((totalAmount / donation.goal) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      ${totalAmount.toFixed(2)} of ${donation.goal.toFixed(2)} goal
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(donation.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/donations/${donation.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}