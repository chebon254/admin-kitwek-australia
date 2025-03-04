"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useClerk } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  Bell, 
  ClipboardList, 
  LogOut,
  User,
  Users
} from "lucide-react";

interface UserDropdownProps {
  user: {
    name: string;
    profileImage: string;
  };
  unreadNotifications?: number;
}

export default function UserDropdown({ user, unreadNotifications = 0 }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition"
      >
        <div className="relative h-8 w-8 rounded-full overflow-hidden">
          {user.profileImage ? (
            <Image
              src={user.profileImage}
              alt={user.name}
              fill
              className="object-cover"
            />
          ) : (
            <User className="h-full w-full p-1 text-gray-600" />
          )}
        </div>
        <span className="font-medium hidden sm:block">{user.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
          </div>

          <div className="py-2">
            <Link
              href="/notifications"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition relative"
              onClick={() => setIsOpen(false)}
            >
              <Bell className="h-4 w-4" />
              Notifications
              {unreadNotifications > 0 && (
                <span className="absolute right-4 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {unreadNotifications}
                </span>
              )}
            </Link>
            <Link
              href="/logs"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setIsOpen(false)}
            >
              <ClipboardList className="h-4 w-4" />
              System Logs
            </Link>
            <Link
              href="/admins"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setIsOpen(false)}
            >
              <Users className="h-4 w-4" />
              Manage Admins
            </Link>
          </div>

          <div className="border-t border-gray-100 pt-2">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}