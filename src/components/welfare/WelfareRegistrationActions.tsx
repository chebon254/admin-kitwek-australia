"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, UserX, UserCheck, Loader2, Users } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { UserDetailsModal } from "./UserDetailsModal";

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
  const [showModal, setShowModal] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If less than 200px space below and more space above, show menu above
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        setMenuPosition('top');
      } else {
        setMenuPosition('bottom');
      }
    }
  }, [showMenu]);

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
        ref={buttonRef}
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
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className={`absolute right-0 w-48 bg-white rounded-md shadow-lg z-50 border ${
            menuPosition === 'top' ? 'bottom-full mb-2 origin-bottom-right' : 'mt-2 origin-top-right'
          }`}>
            <div className="py-1">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Eye className="h-4 w-4" />
                View User Details
              </button>

              <Link
                href={`/welfare/registrations/${registration.id}/beneficiaries`}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <Users className="h-4 w-4" />
                Manage Beneficiaries
              </Link>

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

      {showModal && (
        <UserDetailsModal
          registrationId={registration.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}