"use client";

import { Loader2 } from "lucide-react";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function LoadingButton({
  loading = false,
  children,
  loadingText,
  disabled,
  className = "",
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${className} ${loading ? 'opacity-70' : ''}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
