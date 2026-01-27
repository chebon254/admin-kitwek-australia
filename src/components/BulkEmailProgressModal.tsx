"use client";

import { X, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

interface BulkEmailProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentEmail?: string;
  isComplete: boolean;
  failedEmails: Array<{ email: string; error: string }>;
}

export function BulkEmailProgressModal({
  isOpen,
  onClose,
  total,
  processed,
  successful,
  failed,
  currentEmail,
  isComplete,
  failedEmails,
}: BulkEmailProgressModalProps) {
  if (!isOpen) return null;

  const progress = total > 0 ? (processed / total) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isComplete ? 'Bulk Email Complete' : 'Sending Activation Emails'}
          </h2>
          {isComplete && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{processed} / {total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isComplete
                    ? failed > 0
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              </div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{total}</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Successful</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600 mt-1">{successful}</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Failed</span>
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600 mt-1">{failed}</div>
            </div>
          </div>

          {/* Current Email Being Processed */}
          {!isComplete && currentEmail && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
                <span className="text-sm text-gray-600">Sending to:</span>
                <span className="text-sm font-medium text-gray-900">{currentEmail}</span>
              </div>
            </div>
          )}

          {/* Failed Emails List */}
          {failedEmails.length > 0 && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-medium text-red-900">Failed Emails ({failedEmails.length})</h3>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {failedEmails.map((item, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium text-red-900">{item.email}</div>
                    <div className="text-red-700 text-xs">{item.error}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion Message */}
          {isComplete && (
            <div className={`rounded-lg p-4 ${
              failed > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-center gap-2">
                {failed > 0 ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-900">
                      Completed with {failed} error{failed !== 1 ? 's' : ''}. {successful} email{successful !== 1 ? 's' : ''} sent successfully.
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-900">
                      All emails sent successfully! {successful} activation email{successful !== 1 ? 's' : ''} delivered.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          {isComplete ? (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
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
  );
}
