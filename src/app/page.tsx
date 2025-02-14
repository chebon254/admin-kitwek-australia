"use client";

import { useEffect, useState } from "react";
import { Users, Calendar, Gift, MessageSquare } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalDonations: number;
  totalEvents: number;
  totalForums: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold">{stats.totalMembers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">Active Members</p>
            <p className="text-lg font-semibold">{stats.activeMembers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Donations</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalDonations)}
              </p>
            </div>
            <Gift className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Events</p>
              <p className="text-2xl font-bold">{stats.totalEvents}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Forum Topics</p>
              <p className="text-2xl font-bold">{stats.totalForums}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
