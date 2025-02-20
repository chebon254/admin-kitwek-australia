"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { User, Mail, Calendar, Clock, Shield, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface MemberProps {
  member: {
    id: string;
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    profileImage: string | null;
    membershipStatus: string;
    subscription: string;
    revokeStatus: boolean;
    revokeReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export default function MemberDetail({ member }: MemberProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  const handleResendActivation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/members/${member.id}/resend-activation`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to resend activation email");
      
      toast.success("Activation email sent successfully");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send activation email");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/members/${member.id}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revokeReason }),
      });

      if (!response.ok) throw new Error("Failed to revoke member");
      
      toast.success("Member access revoked successfully");
      setShowRevokeModal(false);
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to revoke member access");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/members/${member.id}/approve`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to approve member");
      
      toast.success("Member access restored successfully");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to restore member access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Member Details</h1>
        <Link
          href="/members"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Members
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                {member.profileImage ? (
                  <Image
                    src={member.profileImage}
                    alt={member.username || member.email}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
                <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                  member.membershipStatus === 'ACTIVE' ? 'bg-green-500' :
                  member.membershipStatus === 'INACTIVE' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {member.firstName} {member.lastName}
                </h2>
                <p className="text-gray-600">{member.email}</p>
                {member.username && (
                  <p className="text-gray-500">@{member.username}</p>
                )}
              </div>
            </div>

            {member.bio && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Bio</h3>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Member Since</div>
                  <div>{new Date(member.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Last Updated</div>
                  <div>{new Date(member.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Subscription</div>
                  <div>{member.subscription}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Status</div>
                  <div className={`font-medium ${
                    member.membershipStatus === 'ACTIVE' ? 'text-green-600' :
                    member.membershipStatus === 'INACTIVE' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {member.membershipStatus}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {member.revokeStatus && member.revokeReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-medium">Account Revoked</h3>
              </div>
              <p className="text-red-600">{member.revokeReason}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Actions</h2>
            <div className="space-y-4">
              {member.membershipStatus === 'INACTIVE' && (
                <button
                  onClick={handleResendActivation}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Resend Activation Email
                </button>
              )}

              {!member.revokeStatus ? (
                <button
                  onClick={() => setShowRevokeModal(true)}
                  disabled={loading}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  Revoke Access
                </button>
              ) : (
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  Approve Access
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Revoke Member Access</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for revoking this member&apos;s access. They will be unable to sign in or reset their password.
            </p>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="w-full p-2 border rounded-md mb-4"
              rows={4}
              placeholder="Enter reason for revocation..."
              required
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={!revokeReason.trim() || loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}