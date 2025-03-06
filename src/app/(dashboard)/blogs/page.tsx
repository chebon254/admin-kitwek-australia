import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { DeleteButton } from "@/components/Delete/DeleteButton";

export default async function BlogsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const blogs = await prisma.blog.findMany({
    where: { adminId: userId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Blog Management</h1>
        <Link
          href="/blogs/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create New Blog
        </Link>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Blogs Yet</h2>
          <p className="text-gray-600 mb-4">Get started by creating your first blog post.</p>
          <Link
            href="/blogs/new"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            Create a Blog Post →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative h-48">
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