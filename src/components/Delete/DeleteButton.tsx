'use client';

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface DeleteButtonProps {
  id: string;
  type: 'blog' | 'event' | 'donation' | 'forum' | 'voting-campaign' | 'welfare-voting-campaign';
  onDelete?: () => void;
}

export function DeleteButton({ id, type, onDelete }: DeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getApiEndpoint = (type: string, id: string) => {
    switch (type) {
      case 'voting-campaign':
        return `/api/voting/campaigns/${id}`;
      case 'welfare-voting-campaign':
        return `/api/welfare-voting/campaigns/${id}`;
      default:
        return `/api/${type}s/${id}`;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'voting-campaign':
        return 'voting campaign';
      case 'welfare-voting-campaign':
        return 'welfare voting campaign';
      case 'blog':
        return 'blog post';
      default:
        return type;
    }
  };

  const performDelete = async () => {
    setShowConfirm(false);
    setIsDeleting(true);

    try {
      const endpoint = getApiEndpoint(type, id);
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${getTypeName(type)}`);
      }

      toast.success(`${getTypeName(type).charAt(0).toUpperCase() + getTypeName(type).slice(1)} deleted successfully`);

      if (onDelete) {
        onDelete();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error instanceof Error ? error.message : `Failed to delete ${getTypeName(type)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Trash2 className="h-5 w-5" />
        )}
      </button>

      {showConfirm && (
        <ConfirmDialog
          title={`Delete ${getTypeName(type)}?`}
          message={`Are you sure you want to delete this ${getTypeName(type)}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={performDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}