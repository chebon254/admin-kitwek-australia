"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mail, Users, Download, FileSpreadsheet, FileText } from "lucide-react";
import MembersList from "@/components/members/MemberList";
import { SuccessNotification } from "@/components/SuccessNotification";
import { LoadingButton } from "@/components/ui/LoadingButton";
import toast from "react-hot-toast";

export default function MembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Additional filter states
  const [subscription, setSubscription] = useState("all");
  const [revokeStatus, setRevokeStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setExporting(true);
      const params = new URLSearchParams({
        format,
        status: status || 'all',
        subscription,
        revokeStatus,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const response = await fetch(`/api/members/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to export members");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kitwek-members-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Members exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting members:", error);
      toast.error("Failed to export members");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Members Management</h1>
        <div className="flex gap-3">
          <LoadingButton
            onClick={handleBulkEmailInactive}
            loading={loading}
            loadingText="Sending..."
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md"
          >
            <Mail className="h-4 w-4" />
            <span>Email Inactive</span>
          </LoadingButton>
        </div>
      </div>

      {/* Filters and Export Section */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">Filters & Export</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showFilters ? 'Hide Filters' : 'Show More Filters'}
          </button>
        </div>

        {/* Basic Filters */}
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search members..."
            className="px-4 py-2 border rounded-lg border-slate-300 flex-1 min-w-[200px]"
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

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription
              </label>
              <select
                value={subscription}
                onChange={(e) => setSubscription(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg border-slate-300"
              >
                <option value="all">All Subscriptions</option>
                <option value="Free">Free</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revoke Status
              </label>
              <select
                value={revokeStatus}
                onChange={(e) => setRevokeStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg border-slate-300"
              >
                <option value="all">All</option>
                <option value="not_revoked">Active</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg border-slate-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg border-slate-300"
              />
            </div>
          </div>
        )}
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