"use client";

import Image from "next/image";
import { DollarSign, Users, TrendingUp, Pencil } from "lucide-react";
import { DeleteButton } from "@/components/Delete/DeleteButton";
import { LoadingLink } from "@/components/ui/LoadingLink";

interface Donation {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  goal: number | null;
  createdAt: Date;
  _count: {
    donors: number;
  };
  donors: Array<{
    amount: number;
  }>;
}

interface DonationsListProps {
  donations: Donation[];
}

export function DonationsList({ donations }: DonationsListProps) {
  if (donations.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Donation Campaigns Yet</h2>
        <p className="text-gray-600 mb-4">Start by creating your first donation campaign.</p>
        <LoadingLink
          href="/donations/new"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          Create a Campaign →
        </LoadingLink>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {donations.map((donation) => {
        const totalAmount = donation.donors.reduce((sum, d) => sum + d.amount, 0);
        const averageDonation = donation.donors.length > 0
          ? totalAmount / donation.donors.length
          : 0;

        return (
          <div key={donation.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-200">
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
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((totalAmount / donation.goal) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    ${totalAmount.toFixed(2)} of ${donation.goal.toFixed(2)} goal
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-gray-500">
                  {new Date(donation.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2 items-center">
                  <LoadingLink
                    href={`/donations/${donation.id}/edit`}
                    className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-colors"
                    showLoader={false}
                  >
                    <Pencil className="h-5 w-5" />
                  </LoadingLink>
                  <DeleteButton id={donation.id} type="donation" />
                  <LoadingLink
                    href={`/donations/${donation.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View Details
                  </LoadingLink>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
