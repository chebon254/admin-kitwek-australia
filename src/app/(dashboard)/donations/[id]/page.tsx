import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function DonationDetailPage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;
  
  const donation = await prisma.donation.findUnique({
    where: { id },
    include: {
      donors: true,
    }
  });

  if (!donation || donation.adminId !== userId) {
    redirect("/donations");
  }

  // Calculate donation statistics
  const totalDonated = donation.donors.reduce((sum, donor) => sum + donor.amount, 0);
  const totalDonors = donation.donors.length;
  const averageDonation = totalDonors > 0 ? totalDonated / totalDonors : 0;
  const progress = donation.goal ? (totalDonated / donation.goal) * 100 : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Donation Campaign Details</h1>
        <Link
          href="/donations"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Donations
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative h-[300px] w-full">
              <Image
                src={donation.thumbnail}
                alt={donation.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{donation.name}</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{donation.description}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Campaign Progress</h2>
            {donation.goal && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${Math.min(progress || 0, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  ${totalDonated.toFixed(2)} raised of ${donation.goal.toFixed(2)} goal
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">${totalDonated.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Donated</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{totalDonors}</p>
                <p className="text-sm text-gray-600">Total Donors</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">${averageDonation.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Average Donation</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Donors</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {donation.donors.map((donor) => (
                  <tr key={donor.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donor.anonymous ? "Anonymous" : donor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${donor.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(donor.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Campaign Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Created</p>
            <p>{new Date(donation.createdAt).toLocaleDateString()}</p>
          </div>
          {donation.endDate && (
            <div>
              <p className="text-sm font-medium text-gray-500">End Date</p>
              <p>{new Date(donation.endDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}