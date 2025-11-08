"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
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
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === href) return;

    setIsNavigating(true);
    startTransition(() => {
      router.push(href);
      setTimeout(() => setIsNavigating(false), 300);
    });
  };

  const isLoading = isNavigating || isPending;

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`${className} ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
    >
      {showLoader && isLoading && (
        <Loader2 className="h-4 w-4 animate-spin inline-block mr-1" />
      )}
      {children}
    </Link>
  );
}
