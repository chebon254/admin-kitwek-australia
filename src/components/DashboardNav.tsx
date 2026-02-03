'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import UserDropdown from "./Navbar/UserDropdown";

interface DashboardNavProps {
  user: {
    name: string;
    profileImage: string;
  };
  unreadNotifications: number;
}

export default function DashboardNav({ user, unreadNotifications }: DashboardNavProps) {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/members">Members</NavLink>
              <NavLink href="/blogs">News</NavLink>
              <NavLink href="/events">Events</NavLink>
              <NavLink href="/donations">Donations</NavLink>
              <NavLink href="/welfare">Welfare</NavLink>
              <NavLink href="/voting">Voting</NavLink>
              <NavLink href="/forums">Forums</NavLink>
            </div>
          </div>
          <div className="flex items-center">
            <UserDropdown
              user={user}
              unreadNotifications={unreadNotifications}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const isActive = pathname === href;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === href) return; // Don't navigate if already on this page

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
      className={`inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-600'
      } ${isNavigating ? 'opacity-70' : ''}`}
    >
      {isNavigating && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      {children}
    </a>
  );
}