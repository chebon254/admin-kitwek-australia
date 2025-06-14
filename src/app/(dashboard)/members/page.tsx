"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mail, Users } from "lucide-react";
import MembersList from "@/components/members/MemberList";
import { SuccessNotification } from "@/components/SuccessNotification";
import toast from "react-hot-toast";

export default function MembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const updateSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(`/members?${params.toString()}`);
  };

  const updateStatus = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.push(`/members?${params.toString()}`);
  };

  const handleBulkEmailInactive = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/members/bulk-email-inactive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to send bulk emails");
      }

      const result = await response.json();
      
      setNotificationMessage(`Successfully sent ${result.emailsSent} activation emails to inactive users`);
      setShowNotification(true);
      toast.success(`Sent ${result.emailsSent} activation emails successfully`);
    } catch (error) {
      console.error("Error sending bulk emails:", error);
      toast.error("Failed to send bulk emails");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Members Management</h1>
        <button
          onClick={handleBulkEmailInactive}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              <Users className="h-4 w-4" />
            </>
          )}
          {loading ? "Sending..." : "Email Inactive Users"}
        </button>
      </div>
      
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search members..."
          className="px-4 py-2 border rounded-lg border-slate-300"
          defaultValue={search}
          onChange={(e) => updateSearch(e.target.value)}
        />
        <select
          className="px-4 py-2 pr-10 border rounded-lg border-slate-300"
          defaultValue={status}
          onChange={(e) => updateStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      
      <MembersList />

      {showNotification && (
        <SuccessNotification
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />
      )}
    </div>
  );
}