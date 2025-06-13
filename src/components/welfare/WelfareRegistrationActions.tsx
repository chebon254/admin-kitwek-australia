"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, UserX, UserCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Flexible interface that works with Prisma types
interface Props {
  registration: {
    id: string;
    status: string;
    paymentStatus: string;
    user?: {
      id: string;
      email: string;
      username?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  };
}

export function WelfareRegistrationActions({ registration }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleStatusToggle = async () => {
    const newStatus = registration.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'activate' : 'suspend';
    
    if (!confirm(`Are you sure you want to ${actionText} this welfare registration?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/welfare/registrations/${registration.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${actionText} registration`);
      }

      toast.success(`Registration ${actionText}d successfully`);
      router.refresh();
    } catch (error) {
      console.error(`Error ${actionText}ing registration:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${actionText} registration`);
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };


  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-gray-100 rounded-full"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
            <div className="py-1">
              <button
                onClick={() => {
                  // View user details - you can implement this
                  setShowMenu(false);
                  toast("User details view not implemented yet", {
                    icon: "ℹ️"
                  });
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Eye className="h-4 w-4" />
                View User Details
              </button>
              
              {registration.paymentStatus === 'PAID' && (
                <button
                  onClick={handleStatusToggle}
                  className={`flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 ${
                    registration.status === 'ACTIVE' 
                      ? 'text-red-700' 
                      : 'text-green-700'
                  }`}
                >
                  {registration.status === 'ACTIVE' ? (
                    <>
                      <UserX className="h-4 w-4" />
                      Suspend Registration
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Activate Registration
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}