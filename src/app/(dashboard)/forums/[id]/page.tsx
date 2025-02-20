import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ForumDetailPage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;
  
  const forum = await prisma.forum.findUnique({
    where: { id },
    include: {
      comments: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!forum || forum.adminId !== userId) {
    redirect("/forums");
  }

  const uniqueCommenters = new Set(forum.comments.map(comment => comment.email)).size;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Forum Details</h1>
        <Link
          href="/forums"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Forums
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-2">{forum.title}</h2>
            <p className="text-gray-600 whitespace-pre-wrap mb-4">{forum.description}</p>
            
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-b">
              <div className="text-center">
                <MessageSquare className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                <div className="text-sm font-medium text-gray-600">Total Comments</div>
                <div className="text-lg font-semibold">{forum.comments.length}</div>
              </div>
              <div className="text-center">
                <Users className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <div className="text-sm font-medium text-gray-600">Unique Participants</div>
                <div className="text-lg font-semibold">{uniqueCommenters}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600">Created On</div>
                <div className="text-sm">{new Date(forum.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Comments</h2>
            <div className="space-y-4">
              {forum.comments.map((comment) => (
                <div key={comment.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">{comment.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{comment.email}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}

              {forum.comments.length === 0 && (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Analytics</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Comment Activity</h3>
                <div className="mt-2">
                  {/* Simple bar chart showing last 5 days of comments */}
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const date = new Date();
                      date.setDate(date.getDate() - index);
                      const commentsOnDay = forum.comments.filter(
                        comment => 
                          new Date(comment.createdAt).toDateString() === date.toDateString()
                      ).length;
                      const percentage = (commentsOnDay / forum.comments.length) * 100 || 0;
                      
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <div className="text-sm text-gray-500 w-20">
                            {date.toLocaleDateString(undefined, { weekday: 'short' })}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-sm text-gray-600 w-8">
                            {commentsOnDay}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600">Most Active Times</h3>
                <div className="mt-2 space-y-1">
                  {Array.from({ length: 4 }).map((_, index) => {
                    const hour = index * 6;
                    const commentsInPeriod = forum.comments.filter(comment => {
                      const commentHour = new Date(comment.createdAt).getHours();
                      return commentHour >= hour && commentHour < (hour + 6);
                    }).length;
                    const percentage = (commentsInPeriod / forum.comments.length) * 100 || 0;

                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="text-sm text-gray-500 w-20">
                          {`${hour}:00-${hour + 6}:00`}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-sm text-gray-600 w-8">
                          {commentsInPeriod}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}