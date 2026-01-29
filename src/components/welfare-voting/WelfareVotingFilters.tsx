"use client";

import { Vote, Calendar, Users, Eye } from "lucide-react";
import { LoadingLink } from "@/components/ui/LoadingLink";

interface WelfareVotingFiltersProps {
  currentFilter: string;
}

export function WelfareVotingFilters({ currentFilter }: WelfareVotingFiltersProps) {
  const filters = [
    {
      key: 'all',
      href: '/welfare-voting',
      label: 'All Campaigns',
      icon: Vote,
      color: 'blue'
    },
    {
      key: 'upcoming',
      href: '/welfare-voting?filter=upcoming',
      label: 'Upcoming',
      icon: Calendar,
      color: 'blue'
    },
    {
      key: 'active',
      href: '/welfare-voting?filter=active',
      label: 'Active',
      icon: Users,
      color: 'green'
    },
    {
      key: 'completed',
      href: '/welfare-voting?filter=completed',
      label: 'Completed',
      icon: Eye,
      color: 'gray'
    }
  ];

  const getActiveClass = (filterKey: string, color: string) => {
    if (currentFilter === filterKey) {
      return color === 'green'
        ? 'bg-green-600 text-white'
        : color === 'gray'
        ? 'bg-gray-600 text-white'
        : 'bg-blue-600 text-white';
    }
    return 'bg-gray-100 hover:bg-gray-200 text-gray-700';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex gap-2 flex-wrap">
        {filters.map((filter) => {
          const Icon = filter.icon;
          return (
            <LoadingLink
              key={filter.key}
              href={filter.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${getActiveClass(filter.key, filter.color)}`}
            >
              <Icon className="w-4 h-4" />
              {filter.label}
            </LoadingLink>
          );
        })}
      </div>
    </div>
  );
}
