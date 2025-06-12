'use client';

import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  id: string;
  type: 'blog' | 'event' | 'donation' | 'forum' | 'voting-campaign';
  onDelete?: () => void;
}

export function DeleteButton({ id, type, onDelete }: DeleteButtonProps) {
  const getApiEndpoint = (type: string, id: string) => {
    switch (type) {
      case 'voting-campaign':
        return `/api/voting/campaigns/${id}`;
      default:
        return `/api/${type}s/${id}`;
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      const endpoint = getApiEndpoint(type, id);
      await fetch(endpoint, {
        method: 'DELETE',
      });
      if (onDelete) {
        onDelete();
      } else {
        window.location.reload();
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
    >
      <Trash2 className="h-5 w-5" />
    </button>
  );
}