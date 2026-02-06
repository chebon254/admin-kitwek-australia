"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Mail, FileSpreadsheet, FileText, Loader2, CheckCircle, XCircle, AlertCircle, Users, Calendar, Clock, X } from "lucide-react";
import MembersList from "@/components/members/MemberList";
import { LoadingButton } from "@/components/ui/LoadingButton";
import toast from "react-hot-toast";

interface Campaign {
  id: string;
  subject?: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  failedEmails?: Array<{ email: string; error: string }>;
  createdAt: string;
  completedAt: string | null;
}

export default function MembersPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Additional filter states
  const [subscription, setSubscription] = useState("all");
  const [revokeStatus, setRevokeStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Campaign-based bulk email states
  const [inactiveUsersCount, setInactiveUsersCount] = useState(0);
  const [canSendBulkEmail, setCanSendBulkEmail] = useState(true);
  const [lastSentDate, setLastSentDate] = useState<string | null>(null);
  const [nextAvailableDate, setNextAvailableDate] = useState<string | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCampaignDetails, setShowCampaignDetails] = useState<Campaign | null>(null);

  const updateSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    window.location.href = `/members?${params.toString()}`;
  };

  const updateStatus = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    window.location.href = `/members?${params.toString()}`;
  };

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/members/bulk-email-inactive");
      if (!response.ok) return;
      const data = await response.json();
      setInactiveUsersCount(data.total);
      setCanSendBulkEmail(data.canSend);
      setLastSentDate(data.lastSentDate);
      setNextAvailableDate(data.nextAvailableDate);
      setActiveCampaign(data.activeCampaign);
      setRecentCampaigns(data.recentCampaigns || []);
    } catch {
      // Silently fail on status polling
    }
  }, []);

  // Fetch status on mount (no polling needed - campaigns complete immediately)
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleBulkEmailInactive = async () => {
    if (!canSendBulkEmail && nextAvailableDate) {
      toast.error(
        `You can send bulk emails again after ${new Date(nextAvailableDate).toLocaleDateString()}`
      );
      return;
    }

    if (activeCampaign) {
      toast.error("A campaign is already in progress. Please wait for it to complete.");
      return;
    }

    await fetchStatus();

    if (inactiveUsersCount === 0) {
      toast("No inactive users found");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmBulkEmail = async () => {
    try {
      setShowConfirmModal(false);
      setLoading(true);

      const response = await fetch("/api/members/bulk-email-inactive", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create campaign");
        setLoading(false);
        return;
      }

      toast.success(data.message);
      setLoading(false);

      // Refresh status to show the new campaign
      await fetchStatus();
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign");
      setLoading(false);
    }
  };

  const fetchCampaignDetails = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/members/bulk-email-inactive?campaignId=${campaignId}`);
      if (!response.ok) return;
      const data = await response.json();
      setShowCampaignDetails(data);
    } catch {
      toast.error("Failed to fetch campaign details");
    }
  };

  const progressPercent = activeCampaign
    ? ((activeCampaign.sentCount + activeCampaign.failedCount) / activeCampaign.totalRecipients) * 100
    : 0;

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
        <div className="flex gap-3 items-center">
          <LoadingButton
            onClick={handleBulkEmailInactive}
            loading={loading}
            loadingText="Creating campaign..."
            disabled={!canSendBulkEmail || !!activeCampaign}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              canSendBulkEmail && !activeCampaign
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={
              activeCampaign
                ? 'A campaign is currently in progress'
                : !canSendBulkEmail && nextAvailableDate
                ? `Available again on ${new Date(nextAvailableDate).toLocaleDateString()}`
                : 'Send activation emails to all inactive members'
            }
          >
            <Mail className="h-4 w-4" />
            <span>Send Email to Inactive Users</span>
          </LoadingButton>
          {!canSendBulkEmail && nextAvailableDate && !activeCampaign && (
            <span className="text-xs text-gray-500">
              Available {new Date(nextAvailableDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Active Campaign Banner */}
      {activeCampaign && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <h3 className="font-medium text-blue-900">Activation Email Campaign In Progress</h3>
            </div>
            <span className="text-sm text-blue-700">
              {activeCampaign.sentCount + activeCampaign.failedCount} / {activeCampaign.totalRecipients} processed
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-700">{activeCampaign.sentCount} sent</span>
            {activeCampaign.failedCount > 0 && (
              <span className="text-red-700">{activeCampaign.failedCount} failed</span>
            )}
            <span className="text-blue-700">
              ~{Math.ceil((activeCampaign.totalRecipients - activeCampaign.sentCount - activeCampaign.failedCount) / 50) * 20} min remaining
            </span>
          </div>
        </div>
      )}

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

      {/* Recent Campaigns */}
      {recentCampaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Email Campaigns (Last 24h)</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentCampaigns.map(campaign => (
              <div key={campaign.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{campaign.subject}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(campaign.createdAt).toLocaleString()} &middot; {campaign.totalRecipients} recipients
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-sm">
                    <span className="text-green-600">{campaign.sentCount} sent</span>
                    {campaign.failedCount > 0 && (
                      <span className="text-red-600 ml-2">{campaign.failedCount} failed</span>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    campaign.status === 'COMPLETED' ? 'bg-green-100 text-green-800'
                    : campaign.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {campaign.status === 'IN_PROGRESS' ? 'Sending' : campaign.status === 'COMPLETED' ? 'Complete' : 'Queued'}
                  </span>
                  {campaign.failedCount > 0 && campaign.status === 'COMPLETED' && (
                    <button
                      onClick={() => fetchCampaignDetails(campaign.id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Details
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Confirm Bulk Email</h2>
              <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-gray-600" title="Close">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Batch Sending</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Emails will be sent in batches of 50 every 20 minutes to comply with email provider rate limits. Estimated time: ~{Math.ceil(inactiveUsersCount / 50) * 20} minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      This action can only be performed once per week to avoid spamming users.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg mb-6">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Recipients</div>
                  <div className="text-2xl font-bold text-blue-600">{inactiveUsersCount}</div>
                  <div className="text-xs text-gray-500">inactive members</div>
                </div>
              </div>

              {lastSentDate && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-6">
                  <Calendar className="h-6 w-6 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Last Sent</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(lastSentDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2 mb-2">
                  <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
                  <h4 className="font-medium text-gray-900">Email Content</h4>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 ml-7">
                  <li>Membership activation reminder</li>
                  <li>Constitution PDF attachment</li>
                  <li>Benefits overview</li>
                  <li>Activation link</li>
                </ul>
              </div>

              <p className="text-sm text-gray-700">
                Create this campaign to send activation emails to{" "}
                <span className="font-semibold text-gray-900">{inactiveUsersCount}</span>{" "}
                inactive members? You can close this page — emails will continue sending in the background.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkEmail}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                <span>Create Campaign</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {showCampaignDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Campaign Details</h2>
              <button onClick={() => setShowCampaignDetails(null)} className="text-gray-400 hover:text-gray-600" title="Close">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">{showCampaignDetails.totalRecipients}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sent</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 mt-1">{showCampaignDetails.sentCount}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Failed</span>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600 mt-1">{showCampaignDetails.failedCount}</div>
                </div>
              </div>

              {showCampaignDetails.failedEmails && showCampaignDetails.failedEmails.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-medium text-red-900">Failed Emails ({showCampaignDetails.failedEmails.length})</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {showCampaignDetails.failedEmails.map((item, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-red-900">{item.email}</div>
                        <div className="text-red-700 text-xs">{item.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowCampaignDetails(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
