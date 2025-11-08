"use client";

import { useState, FormEvent } from "react";
import { LoadingButton } from "./LoadingButton";

interface FormWithLoadingProps {
  onSubmit: () => Promise<void>;
  children: React.ReactNode;
  submitText?: string;
  loadingText?: string;
  className?: string;
  showCancel?: boolean;
  cancelText?: string;
  onCancel?: () => void;
}

export function FormWithLoading({
  onSubmit,
  children,
  submitText = "Submit",
  loadingText = "Submitting...",
  className = "",
  showCancel = false,
  cancelText = "Cancel",
  onCancel,
}: FormWithLoadingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}

      <div className="flex gap-3 justify-end mt-6">
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
        )}

        <LoadingButton
          type="submit"
          loading={isSubmitting}
          loadingText={loadingText}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitText}
        </LoadingButton>
      </div>
    </form>
  );
}
