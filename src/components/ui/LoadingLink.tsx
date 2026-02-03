"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface LoadingLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  showLoader?: boolean;
}

export function LoadingLink({
  href,
  children,
  className = "",
  showLoader = true
}: LoadingLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't intercept external links - let them work normally
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return;
    }

    e.preventDefault();
    setIsNavigating(true);

    // Brief delay to show spinner, then trigger full page reload
    setTimeout(() => {
      window.location.href = href;
    }, 100);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`${className} ${isNavigating ? 'opacity-70 pointer-events-none' : ''}`}
    >
      {showLoader && isNavigating && (
        <Loader2 className="h-4 w-4 animate-spin inline-block mr-1" />
      )}
      {children}
    </a>
  );
}
