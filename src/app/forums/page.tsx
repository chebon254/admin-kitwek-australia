'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MessageSquare, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const forumSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

type ForumFormData = z.infer<typeof forumSchema>;

interface ForumPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  _count: {
    comments: number;
  };
}

export default function ForumsPage() {
  const [forums, setForums] = useState<ForumPost[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ForumFormData>({
    resolver: zodResolver(forumSchema),
  });

  useEffect(() => {
    fetch('/api/forums')
      .then(res => res.json())
      .then(setForums);
  }, []);

  const onSubmit = async (data: ForumFormData) => {
    try {
      const response = await fetch('/api/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create forum');
      const newForum = await response.json();

      setForums(prev => [newForum, ...prev]);
      setIsCreating(false);
      reset();
    } catch (error) {
      console.error('Error creating forum:', error);
      alert('Failed to create forum');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Forums</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Forum
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Forum</h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  {...register('title')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.title?.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  {...register('content')}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.content?.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Forum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {forums.map((forum) => (
          <div key={forum.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold">{forum.title}</h3>
            <p className="text-sm text-gray-600 mt-2">{forum.content}</p>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>{forum._count.comments} comments</span>
              </div>
              <span>Created on {formatDate(new Date(forum.createdAt))}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}