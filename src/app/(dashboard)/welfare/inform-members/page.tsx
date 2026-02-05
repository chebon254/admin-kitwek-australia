"use client";

import { useState } from "react";
import { ArrowLeft, Mail, Eye, EyeOff, Send, Users, CheckCircle, XCircle, Loader2, AlertCircle, X } from "lucide-react";
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

interface ProgressState {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentEmail: string;
  isComplete: boolean;
  failedEmails: Array<{ email: string; error: string }>;
}

export default function InformMembersPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);

  // Progress modal
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    currentEmail: "",
    isComplete: false,
    failedEmails: [],
  });

  const htmlMessage = convertTextToHtml(message);

  const handleSendClick = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }

    if (isSending) {
      setShowProgress(true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/welfare/inform-members");
      if (!response.ok) throw new Error("Failed to fetch recipients");

      const data = await response.json();
      if (data.total === 0) {
        toast("No active welfare members found");
        setLoading(false);
        return;
      }

      setRecipientCount(data.total);
      setShowConfirm(true);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching recipients:", error);
      toast.error("Failed to fetch member list");
      setLoading(false);
    }
  };

  const handleConfirmSend = async () => {
    try {
      setShowConfirm(false);

      setProgress({
        total: recipientCount,
        processed: 0,
        successful: 0,
        failed: 0,
        currentEmail: "",
        isComplete: false,
        failedEmails: [],
      });
      setIsSending(true);
      setShowProgress(true);

      // Single POST request — server handles all sending and streams progress
      const response = await fetch("/api/welfare/inform-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          htmlMessage,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start sending");
      }

      // Read the NDJSON stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === 'start') {
              setProgress(prev => ({ ...prev, total: event.total }));
            } else if (event.type === 'progress') {
              setProgress({
                total: event.total,
                processed: event.processed,
                successful: event.successful,
                failed: event.failed,
                currentEmail: event.currentEmail || "",
                isComplete: false,
                failedEmails: event.failedEmails || [],
              });
            } else if (event.type === 'complete') {
              setProgress({
                total: event.total,
                processed: event.processed,
                successful: event.successful,
                failed: event.failed,
                currentEmail: "",
                isComplete: true,
                failedEmails: event.failedEmails || [],
              });

              if (event.failed === 0) {
                toast.success(`All ${event.successful} emails sent successfully!`);
              } else {
                toast.error(`${event.successful} sent, ${event.failed} failed`);
              }
            }
          } catch {
            // Skip malformed lines
          }
        }
      }

      setIsSending(false);
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error("Failed to send emails");
      setIsSending(false);
      setShowProgress(false);
    }
  };

  const handleCloseProgress = () => {
    setShowProgress(false);
    if (progress.isComplete) {
      setProgress({
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        currentEmail: "",
        isComplete: false,
        failedEmails: [],
      });
    }
  };

  const progressPercent = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <a href="/welfare" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <h1 className="text-2xl font-bold">Inform Welfare Members</h1>
          <p className="text-gray-600 mt-1">Send email notifications to all active welfare members</p>
        </div>
      </div>

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
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Write your message in plain text. Separate paragraphs with a blank line. Each paragraph will be formatted as a separate block in the email.
          </p>
          <textarea
            id="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={12}
            placeholder={`It is with deep sorrow that we inform you of the passing of our beloved member, [Name].\n\n[Name] was a valued member of our Kitwek Australia community and will be greatly missed by all who knew them.\n\nAs per our welfare fund guidelines, we will be processing the welfare claim to support the family during this difficult time. Each active member will be required to contribute the agreed welfare amount.\n\nPlease keep the family in your thoughts and prayers during this time.`}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
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

        {/* Email Preview */}
        {showPreview && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs text-gray-500">Email Preview</p>
              <p className="text-sm font-medium text-gray-900">{subject || "(No subject)"}</p>
            </div>
            <div className="p-6 bg-white">
              <div style={{ maxWidth: 600, margin: "0 auto", fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>
                <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: "2px solid #f0f0f0" }}>
                  <h2 style={{ color: "#333", margin: 0 }}>Kitwek Australia</h2>
                  <p style={{ color: "#666" }}>Welfare Notification</p>
                </div>
                <div style={{ padding: "16px 0" }}>
                  <p style={{ color: "#333" }}>Dear Member,</p>
                  {message ? (
                    <div dangerouslySetInnerHTML={{ __html: htmlMessage }} />
                  ) : (
                    <p style={{ color: "#999", fontStyle: "italic" }}>Your message will appear here...</p>
                  )}
                  <p style={{ color: "#333" }}>Kind regards,<br />Kitwek Australia Welfare Committee</p>
                </div>
                <div style={{ textAlign: "center", paddingTop: 16, borderTop: "2px solid #f0f0f0", color: "#666", fontSize: 12 }}>
                  <p>This email was sent by Kitwek Australia Welfare</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSendClick}
            disabled={loading || isSending || !subject.trim() || !message.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send to All Active Members</span>
              </>
            )}
          </button>
        </div>
      </div>

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
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Please Confirm</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      This will send an email to all active welfare members. Please review your message before proceeding.
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
                </div>
              </div>

              <p className="text-sm text-gray-700">
                Are you sure you want to send this email to{" "}
                <span className="font-semibold text-gray-900">{recipientCount}</span>{" "}
                active welfare members?
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
                <span>Send Emails</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {progress.isComplete ? "Emails Sent" : "Sending Welfare Notification"}
              </h2>
              {progress.isComplete && (
                <button onClick={handleCloseProgress} className="text-gray-400 hover:text-gray-600" title="Close">
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
            <div className="p-6">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{progress.processed} / {progress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progress.isComplete
                        ? progress.failed > 0 ? "bg-yellow-500" : "bg-green-500"
                        : "bg-orange-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">{progress.total}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Successful</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 mt-1">{progress.successful}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Failed</span>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600 mt-1">{progress.failed}</div>
                </div>
              </div>

              {/* Current Email */}
              {!progress.isComplete && progress.currentEmail && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
                    <span className="text-sm text-gray-600">Sending to:</span>
                    <span className="text-sm font-medium text-gray-900">{progress.currentEmail}</span>
                  </div>
                </div>
              )}

              {/* Failed Emails */}
              {progress.failedEmails.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-medium text-red-900">Failed Emails ({progress.failedEmails.length})</h3>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {progress.failedEmails.map((item, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-red-900">{item.email}</div>
                        <div className="text-red-700 text-xs">{item.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion */}
              {progress.isComplete && (
                <div className={`rounded-lg p-4 ${
                  progress.failed > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"
                }`}>
                  <div className="flex items-center gap-2">
                    {progress.failed > 0 ? (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <p className="text-sm text-yellow-900">
                          Completed with {progress.failed} error{progress.failed !== 1 ? "s" : ""}. {progress.successful} email{progress.successful !== 1 ? "s" : ""} sent successfully.
                        </p>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-sm text-green-900">
                          All emails sent successfully! {progress.successful} welfare notification{progress.successful !== 1 ? "s" : ""} delivered.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              {progress.isComplete ? (
                <button
                  onClick={handleCloseProgress}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  Close
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending emails... Please wait</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
