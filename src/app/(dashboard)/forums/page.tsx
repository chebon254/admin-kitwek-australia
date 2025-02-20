import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MessageSquare, Clock, Users } from "lucide-react";

export default async function ForumsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const forums = await prisma.forum.findMany({
    where: { adminId: userId },
    include: {
      _count: {
        select: { comments: true }
      },
      comments: true
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Forums Management</h1>
        <Link
          href="/forums/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create New Forum
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forums.map((forum) => {
          const latestComment = forum.comments[0];
          const uniqueCommenters = new Set(forum.comments.map(comment => comment.email)).size;

          return (
            <div key={forum.id} className="bg-white rounded-lg shadow overflow-hidden">
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

                <div className="flex justify-end">
                  <Link
                    href={`/forums/${forum.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}