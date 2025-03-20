import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Newspaper, BookOpen } from "lucide-react";
import { DeleteButton } from "@/components/Delete/DeleteButton";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function BlogsPage({ searchParams }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const filter = (searchParams.filter as string) || "all";

  const blogs = await prisma.blog.findMany({
    where: {
      adminId: userId,
      ...(filter !== "all" ? { blogTag: filter } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Content Management</h1>
        <Link
          href="/blogs/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Add New Content
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-2">
          <Link
            href="/blogs"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            All
          </Link>
          <Link
            href="/blogs?filter=Blog"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              filter === "Blog"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Blogs
          </Link>
          <Link
            href="/blogs?filter=News"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              filter === "News"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Newspaper className="w-4 h-4" />
            News
          </Link>
        </div>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Content Yet
          </h2>
          <p className="text-gray-600 mb-4">
            Get started by creating your first piece of content.
          </p>
          <Link
            href="/blogs/new"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            Create Content →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="relative h-48">
                <div className="absolute top-2 right-2 z-10 bg-white px-2 py-1 rounded-full text-sm font-medium">
                  {blog.blogTag}
                </div>
                <Image
                  src={blog.thumbnail}
                  alt={blog.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{blog.title}</h2>
                <p className="text-gray-600 line-clamp-2">{blog.description}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/blogs/${blog.id}/edit`}
                      className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                    >
                      <Pencil className="h-5 w-5" />
                    </Link>
                    <DeleteButton id={blog.id} type="blog" />
                    <Link
                      href={`/blogs/${blog.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
