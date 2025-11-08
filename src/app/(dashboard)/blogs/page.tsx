import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoadingLink } from "@/components/ui/LoadingLink";
import { BlogsList } from "@/components/blogs/BlogsList";
import { BlogFilters } from "@/components/blogs/BlogFilters";

// Define the props with promises as required by Next.js 14
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function BlogsPage(props: {
  searchParams: SearchParams
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Await the searchParams promise
  const searchParams = await props.searchParams;
  const filter = searchParams.filter as string || 'all';

  const blogs = await prisma.blog.findMany({
    where: {
      adminId: userId,
      ...(filter !== 'all' ? { blogTag: filter } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Content Management</h1>
        <LoadingLink
          href="/blogs/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md inline-flex items-center gap-2"
        >
          <span>Add New Content</span>
        </LoadingLink>
      </div>

      <BlogFilters currentFilter={filter} />

      <BlogsList blogs={blogs} />
    </div>
  );
}