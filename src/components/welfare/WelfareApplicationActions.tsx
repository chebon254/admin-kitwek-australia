"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, DollarSign, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface WelfareApplication {
  id: string;
  status: string;
  claimAmount: number;
  applicationType: string;
  deceasedName: string;
}

interface Props {
  application: WelfareApplication;
}

export function WelfareApplicationActions({ application }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this application?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/welfare/applications/${application.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve application");
      }

      toast.success("Application approved successfully");
      router.refresh();
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve application");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    if (!confirm("Are you sure you want to reject this application?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/welfare/applications/${application.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject application");
      }

      toast.success("Application rejected");
      router.refresh();
      setShowRejectionForm(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reject application");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm(`Are you sure you want to mark this application as paid? This will record a payout of $${application.claimAmount.toLocaleString()}.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/welfare/applications/${application.id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to mark as paid");
      }

      toast.success("Application marked as paid");
      router.refresh();
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error(error instanceof Error ? error.message : "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  };

  if (application.status === "PAID") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Payment Completed</span>
        </div>
        <p className="text-sm text-green-700 mt-1">
          This application has been fully processed and paid.
        </p>
      </div>
    );
  }

  if (application.status === "REJECTED") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <XCircle className="h-5 w-5" />
          <span className="font-medium">Application Rejected</span>
        </div>
        <p className="text-sm text-red-700 mt-1">
          This application has been rejected and cannot be modified.
        </p>
      </div>
    );
  }

  if (application.status === "APPROVED") {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Application Approved</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            This application is approved for ${application.claimAmount.toLocaleString()}.
          </p>
        </div>

        <button
          onClick={handleMarkAsPaid}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <DollarSign className="h-5 w-5" />
          )}
          {loading ? "Processing..." : "Mark as Paid"}
        </button>
      </div>
    );
  }

  if (application.status === "PENDING") {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            This application is pending review. Choose an action below.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            {loading ? "Processing..." : "Approve Application"}
          </button>

          <button
            onClick={() => setShowRejectionForm(!showRejectionForm)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            <XCircle className="h-5 w-5" />
            Reject Application
          </button>
        </div>

        {showRejectionForm && (
          <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                placeholder="Please provide a clear reason for rejecting this application..."
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                {loading ? "Processing..." : "Confirm Rejection"}
              </button>
              <button
                onClick={() => {
                  setShowRejectionForm(false);
                  setRejectionReason("");
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}