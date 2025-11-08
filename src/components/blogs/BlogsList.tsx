"use client";

import Image from "next/image";
import { Pencil } from "lucide-react";
import { DeleteButton } from "@/components/Delete/DeleteButton";
import { LoadingLink } from "@/components/ui/LoadingLink";

interface Blog {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  blogTag: string;
  createdAt: Date;
}

interface BlogsListProps {
  blogs: Blog[];
}

export function BlogsList({ blogs }: BlogsListProps) {
  if (blogs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Content Yet</h2>
        <p className="text-gray-600 mb-4">Get started by creating your first piece of content.</p>
        <LoadingLink
          href="/blogs/new"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          Create Content →
        </LoadingLink>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <div key={blog.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-200">
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
              <div className="flex gap-2 items-center">
                <LoadingLink
                  href={`/blogs/${blog.id}/edit`}
                  className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-colors"
                  showLoader={false}
                >
                  <Pencil className="h-5 w-5" />
                </LoadingLink>
                <DeleteButton id={blog.id} type="blog" />
                <LoadingLink
                  href={`/blogs/${blog.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View Details
                </LoadingLink>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
