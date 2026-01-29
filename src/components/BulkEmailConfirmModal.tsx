"use client";

import { X, AlertCircle, Users, Mail, Calendar } from "lucide-react";

interface BulkEmailConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalUsers: number;
  lastSentDate?: string;
  isLoading?: boolean;
}

export function BulkEmailConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  totalUsers,
  lastSentDate,
  isLoading,
}: BulkEmailConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Confirm Bulk Email
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Warning Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Notice
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  This action can only be performed once per week to avoid spamming users.
                </p>
              </div>
            </div>
          </div>

          {/* Email Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Recipients</div>
                <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
                <div className="text-xs text-gray-500">inactive members</div>
              </div>
            </div>

            {lastSentDate && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
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
          </div>

          {/* Email Content Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2 mb-2">
              <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
              <h4 className="font-medium text-gray-900">Email Content</h4>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-7">
              <li>• Membership activation reminder</li>
              <li>• Constitution PDF attachment</li>
              <li>• Benefits overview</li>
              <li>• Activation link</li>
            </ul>
          </div>

          {/* Confirmation Text */}
          <p className="text-sm text-gray-700">
            Are you sure you want to send activation emails to{" "}
            <span className="font-semibold text-gray-900">{totalUsers}</span>{" "}
            inactive members?
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Preparing...</span>
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                <span>Start Sending</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
