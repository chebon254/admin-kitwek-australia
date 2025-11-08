"use client";

import { BookOpen, Newspaper } from "lucide-react";
import { LoadingLink } from "@/components/ui/LoadingLink";

interface BlogFiltersProps {
  currentFilter: string;
}

export function BlogFilters({ currentFilter }: BlogFiltersProps) {
  const filters = [
    { value: 'all', label: 'All', icon: BookOpen },
    { value: 'Blog', label: 'Blogs', icon: BookOpen },
    { value: 'News', label: 'News', icon: Newspaper },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = currentFilter === filter.value;

          return (
            <LoadingLink
              key={filter.value}
              href={filter.value === 'all' ? '/blogs' : `/blogs?filter=${filter.value}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
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
