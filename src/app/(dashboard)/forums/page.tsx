import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoadingLink } from "@/components/ui/LoadingLink";
import { ForumsList } from "@/components/forums/ForumsList";

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
        <LoadingLink
          href="/forums/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md inline-flex items-center gap-2"
        >
          <span>Create New Forum</span>
        </LoadingLink>
      </div>

      <ForumsList forums={forums} />
    </div>
  );
}
