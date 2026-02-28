"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Mail, Eye, EyeOff, Send, Users, CheckCircle, XCircle, Loader2, AlertCircle, X, Clock } from "lucide-react";
import toast from "react-hot-toast";

function convertTextToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
    .map(paragraph => {
      const escaped = paragraph
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
      return `<p>${escaped}</p>`;
    })
    .join('\n');
}

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

export default function InformMembersPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  // Confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);

  // Campaign tracking
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [showCampaignDetails, setShowCampaignDetails] = useState<Campaign | null>(null);

  const htmlMessage = convertTextToHtml(message);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/welfare/inform-members");
      if (!response.ok) return;
      const data = await response.json();
      setRecipientCount(data.total);
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

  const handleSendClick = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }

    if (activeCampaign) {
      toast.error("A campaign is already in progress. Please wait for it to complete.");
      return;
    }

    await fetchStatus();
    if (recipientCount === 0) {
      toast("No active welfare members found");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSend = async () => {
    try {
      setShowConfirm(false);
      setLoading(true);

      const response = await fetch("/api/welfare/inform-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          htmlMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create campaign");
        setLoading(false);
        return;
      }

      toast.success(data.message);
      setSubject("");
      setMessage("");
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
      const response = await fetch(`/api/welfare/inform-members?campaignId=${campaignId}`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <a href="/welfare" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <h1 className="text-2xl font-bold">Inform Welfare Members</h1>
          <p className="text-gray-600 mt-1">Send email and SMS notifications to all active welfare members</p>
        </div>
      </div>

      {/* Active Campaign Banner */}
      {activeCampaign && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <h3 className="font-medium text-blue-900">Campaign In Progress</h3>
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
            <span className="text-blue-700">Processing notifications...</span>
          </div>
        </div>
      )}

      {/* Compose Form */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Email Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Welfare Support Notice - Passing of a Member"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={!!activeCampaign}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Write your message in plain text. Separate paragraphs with a blank line. Each paragraph will be formatted as a separate block in the email. Members with a phone number also receive an SMS summary.
          </p>
          <textarea
            id="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={12}
            placeholder={`It is with deep sorrow that we inform you of the passing of our beloved member, [Name].\n\n[Name] was a valued member of our Kitwek Victoria community and will be greatly missed by all who knew them.\n\nAs per our welfare fund guidelines, we will be processing the welfare claim to support the family during this difficult time. Each active member will be required to contribute the agreed welfare amount.\n\nPlease keep the family in your thoughts and prayers during this time.`}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
            disabled={!!activeCampaign}
          />
        </div>

        {/* Preview Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Hide Preview" : "Show Email Preview"}
          </button>
        </div>

        {showPreview && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs text-gray-500">Email Preview</p>
              <p className="text-sm font-medium text-gray-900">{subject || "(No subject)"}</p>
            </div>
            <div className="p-6 bg-white">
              <div style={{ maxWidth: 600, margin: "0 auto", fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>
                <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: "2px solid #f0f0f0" }}>
                  <h2 style={{ color: "#333", margin: 0 }}>Kitwek Victoria</h2>
                  <p style={{ color: "#666" }}>Welfare Notification</p>
                </div>
                <div style={{ padding: "16px 0" }}>
                  <p style={{ color: "#333" }}>Dear Member,</p>
                  {message ? (
                    <div dangerouslySetInnerHTML={{ __html: htmlMessage }} />
                  ) : (
                    <p style={{ color: "#999", fontStyle: "italic" }}>Your message will appear here...</p>
                  )}
                  <p style={{ color: "#333" }}>Kind regards,<br />Kitwek Victoria Welfare Committee</p>
                </div>
                <div style={{ textAlign: "center", paddingTop: 16, borderTop: "2px solid #f0f0f0", color: "#666", fontSize: 12 }}>
                  <p>This email was sent by Kitwek Victoria Welfare Committee</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSendClick}
            disabled={loading || !!activeCampaign || !subject.trim() || !message.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating campaign...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send to All Active Members ({recipientCount})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Campaigns */}
      {recentCampaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Campaigns (Last 24h)</h3>
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
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Confirm Send</h2>
              <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600" title="Close">
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
                      Notifications are sent immediately. Email and SMS are attempted independently based on each member&apos;s available contact details.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg mb-6">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Recipients</div>
                  <div className="text-2xl font-bold text-blue-600">{recipientCount}</div>
                  <div className="text-xs text-gray-500">active welfare members</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2 mb-2">
                  <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
                  <h4 className="font-medium text-gray-900">Email Details</h4>
                </div>
                <div className="ml-7 text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Subject:</span> {subject}</p>
                  <p><span className="font-medium">Message:</span> {message.length > 100 ? message.substring(0, 100) + "..." : message}</p>
                  <p><span className="font-medium">Channels:</span> Email + SMS (when phone exists)</p>
                </div>
              </div>

              <p className="text-sm text-gray-700">
                Create this campaign to send notifications to{" "}
                <span className="font-semibold text-gray-900">{recipientCount}</span>{" "}
                active welfare members? Members with email receive email, members with phone receive SMS, and members with both receive both.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSend}
                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2"
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
                    <h3 className="font-medium text-red-900">Failed Deliveries ({showCampaignDetails.failedEmails.length})</h3>
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
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
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
