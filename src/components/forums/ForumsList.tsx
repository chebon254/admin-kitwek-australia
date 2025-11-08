"use client";

import { MessageSquare, Clock, Users, Pencil } from "lucide-react";
import { DeleteButton } from "@/components/Delete/DeleteButton";
import { LoadingLink } from "@/components/ui/LoadingLink";

interface Forum {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  _count: {
    comments: number;
  };
  comments: Array<{
    content: string;
    name: string;
    email: string;
    createdAt: Date;
  }>;
}

interface ForumsListProps {
  forums: Forum[];
}

export function ForumsList({ forums }: ForumsListProps) {
  if (forums.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Forums Yet</h2>
        <p className="text-gray-600 mb-4">Start by creating your first forum discussion.</p>
        <LoadingLink
          href="/forums/new"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          Create a Forum →
        </LoadingLink>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forums.map((forum) => {
        const latestComment = forum.comments[0];
        const uniqueCommenters = new Set(forum.comments.map(comment => comment.email)).size;

        return (
          <div key={forum.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{forum.title}</h2>
              <p className="text-gray-600 line-clamp-2 mb-4">{forum.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <MessageSquare className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                  <div className="text-sm font-medium text-gray-600">Comments</div>
                  <div className="text-lg font-semibold">{forum._count.comments}</div>
                </div>
                <div className="text-center">
                  <Users className="h-5 w-5 mx-auto text-green-600 mb-1" />
                  <div className="text-sm font-medium text-gray-600">Participants</div>
                  <div className="text-lg font-semibold">{uniqueCommenters}</div>
                </div>
                <div className="text-center">
                  <Clock className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                  <div className="text-sm font-medium text-gray-600">Created</div>
                  <div className="text-sm font-semibold">
                    {new Date(forum.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {latestComment && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 line-clamp-2">{latestComment.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Latest comment by {latestComment.name} • {new Date(latestComment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 items-center pt-4 border-t">
                <LoadingLink
                  href={`/forums/${forum.id}/edit`}
                  className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-colors"
                  showLoader={false}
                >
                  <Pencil className="h-5 w-5" />
                </LoadingLink>
                <DeleteButton id={forum.id} type="forum" />
                <LoadingLink
                  href={`/forums/${forum.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View Details
                </LoadingLink>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
