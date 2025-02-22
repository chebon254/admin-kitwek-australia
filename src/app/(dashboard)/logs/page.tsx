"use client";

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import useSWR from 'swr';
import { 
  AlertCircle, 
  Clock, 
  FileText, 
  UserPlus, 
  DollarSign,
  Trash2,
  Edit,
  Lock,
  Unlock,
  RefreshCw,
  Loader2
} from "lucide-react";

const ITEMS_PER_PAGE = 20;

interface Log {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const { ref, inView } = useInView();

  const { data, error } = useSWR<{
    logs: Log[];
    hasMore: boolean;
  }>(`/api/logs?page=${page}&limit=${ITEMS_PER_PAGE}`, fetcher);

  useEffect(() => {
    if (inView && data?.hasMore) {
      setPage(prev => prev + 1);
    }
  }, [inView, data?.hasMore]);

  // Helper function to get icon based on action type
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'update':
        return <Edit className="h-5 w-5 text-blue-500" />;
      case 'delete':
        return <Trash2 className="h-5 w-5 text-red-500" />;
      case 'register':
        return <UserPlus className="h-5 w-5 text-purple-500" />;
      case 'payment':
        return <DollarSign className="h-5 w-5 text-emerald-500" />;
      case 'revoke':
        return <Lock className="h-5 w-5 text-red-500" />;
      case 'approve':
        return <Unlock className="h-5 w-5 text-green-500" />;
      case 'sync':
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading logs</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  const logs = data?.logs || [];

  // Group logs by date
  const groupedLogs = logs.reduce((groups, log) => {
    const date = new Date(log.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, typeof logs>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">System Logs</h1>
          <p className="text-gray-600 mt-1">Track all system activities and changes</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="space-y-8">
            {Object.entries(groupedLogs).map(([date, dayLogs], groupIndex) => (
              <div key={date}>
                <h2 className="text-sm font-medium text-gray-500 sticky top-0 bg-white py-2">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
                <div className="mt-4 space-y-4">
                  {dayLogs.map((log, index) => (
                    <div 
                      key={log.id}
                      ref={
                        groupIndex === Object.keys(groupedLogs).length - 1 && 
                        index === dayLogs.length - 1 ? 
                        ref : undefined
                      }
                      className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-grow">
                        <p className="text-gray-900">{log.details}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-500">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.action.toLowerCase() === 'create' ? 'bg-green-100 text-green-800' :
                            log.action.toLowerCase() === 'update' ? 'bg-blue-100 text-blue-800' :
                            log.action.toLowerCase() === 'delete' ? 'bg-red-100 text-red-800' :
                            log.action.toLowerCase() === 'revoke' ? 'bg-red-100 text-red-800' :
                            log.action.toLowerCase() === 'approve' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.action}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {data?.hasMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}

            {Object.keys(groupedLogs).length === 0 && !error && (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  System activities will appear here as they occur.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}