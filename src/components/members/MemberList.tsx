"use client";

import { useEffect, useState } from 'react';
import Link from "next/link";
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { User } from "lucide-react";

interface Member {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImage: string | null;
  membershipStatus: string;
  subscription: string;
  revokeStatus: boolean;
  createdAt: string;
}

export default function MembersList() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/members?${searchParams.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }
        const data = await response.json();
        setMembers(data);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No members match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => (
        <div key={member.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                {member.profileImage ? (
                  <Image
                    src={member.profileImage || "/ui-assets/avatar.webp"}
                    alt={`${member.firstName} ${member.lastName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
                <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                  member.membershipStatus === 'ACTIVE' ? 'bg-green-500' :
                  member.membershipStatus === 'INACTIVE' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {member.firstName} {member.lastName}
                </h2>
                <p className="text-gray-600">{member.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subscription</span>
                <span className="font-medium">Annual</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">
                  {new Date(member.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  member.membershipStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  member.membershipStatus === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {member.membershipStatus}
                </span>
                {member.revokeStatus && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    Revoked
                  </span>
                )}
              </div>
              <Link
                href={`/members/${member.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}