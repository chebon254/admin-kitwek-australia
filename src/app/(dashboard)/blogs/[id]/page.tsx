import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function BlogDetailPage({params}: Props) {

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;

  const blog = await prisma.blog.findUnique({
    where: { id },
  });  

  if (!blog || blog.adminId !== userId) {
    redirect("/blogs");
  }

  const files = blog.files as string[] || [];

  // Helper function to get file type
  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    if (['pdf'].includes(extension || '')) return 'pdf';
    if (['doc', 'docx'].includes(extension || '')) return 'document';
    if (['xls', 'xlsx'].includes(extension || '')) return 'spreadsheet';
    return 'other';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Blog Details</h1>
        <Link
          href="/blogs"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Blogs
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-[400px] w-full">
          <Image
            src={blog.thumbnail}
            alt={blog.title}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="p-6">
          <h2 className="text-3xl font-bold mb-4">{blog.title}</h2>
          <p className="text-gray-600 mb-6 whitespace-pre-wrap">{blog.description}</p>
          
          {files.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Attached Files</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.map((file, index) => {
                  const fileType = getFileType(file);
                  return (
                    <div
                      key={index}
                      className="border rounded-lg overflow-hidden bg-gray-50"
                    >
                      {/* Preview Section */}
                      <div className="h-40 relative bg-gray-100">
                        {fileType === 'image' ? (
                          <Image
                            src={file}
                            alt={`File ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <div className="text-4xl text-gray-400">
                              {fileType === 'pdf' && '📄'}
                              {fileType === 'document' && '📝'}
                              {fileType === 'spreadsheet' && '📊'}
                              {fileType === 'other' && '📎'}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Download Button */}
                      <div className="p-3 bg-white">
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500">
            Created on {new Date(blog.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}