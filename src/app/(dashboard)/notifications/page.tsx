"use client";

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import useSWR from 'swr';
import { 
  Bell,
  UserPlus,
  DollarSign,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { ref, inView } = useInView();

  const { data, error, mutate } = useSWR<{
    notifications: Notification[];
    hasMore: boolean;
  }>(`/api/notifications?page=${page}&limit=${ITEMS_PER_PAGE}`, fetcher);

  useEffect(() => {
    if (inView && data?.hasMore) {
      setPage(prev => prev + 1);
    }
  }, [inView, data?.hasMore]);

  // Helper function to get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'new_user':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'new_donation':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'new_event':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'new_comment':
        return <MessageSquare className="h-5 w-5 text-orange-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/mark-read`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to mark notification as read');

      mutate(); // Refresh the notifications data
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to mark all notifications as read');

      mutate(); // Refresh the notifications data
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading notifications</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  const notifications = data?.notifications || [];
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with system activities</p>
        </div>
        {unreadNotifications.length > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Unread Notifications */}
        {unreadNotifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <h2 className="font-semibold text-blue-900">Unread Notifications</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {unreadNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4"
                >
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-900">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Mark as read</span>
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Read Notifications */}
        {readNotifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h2 className="font-semibold text-gray-700">Previous Notifications</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {readNotifications.map((notification, index) => (
                <div 
                  key={notification.id}
                  ref={index === readNotifications.length - 1 ? ref : undefined}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4 opacity-75"
                >
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-900">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {data?.hasMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {notifications.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}