import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { LoadingLink } from "@/components/ui/LoadingLink";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

interface Block {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'bold';
  content: string;
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
  let blocks: Block[] = [];
  
  try {
    blocks = JSON.parse(blog.description);
  } catch {
    blocks = [{ id: '1', type: 'paragraph', content: blog.description }];
  }

  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    if (['pdf'].includes(extension || '')) return 'pdf';
    if (['doc', 'docx'].includes(extension || '')) return 'document';
    if (['xls', 'xlsx'].includes(extension || '')) return 'spreadsheet';
    return 'other';
  };

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'heading':
        return <h2 className="text-2xl font-bold mb-4">{block.content}</h2>;
      case 'list':
        return <li className="ml-6 mb-2">• {block.content}</li>;
      case 'bold':
        return <p className="font-bold mb-4">{block.content}</p>;
      default:
        return <p className="mb-4">{block.content}</p>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Content Details</h1>
        <div className="flex gap-4">
          <LoadingLink
            href={`/blogs/${id}/edit`}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Edit
          </LoadingLink>
          <LoadingLink
            href="/blogs"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Back to List
          </LoadingLink>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-[400px] w-full">
          <div className="absolute top-4 right-4 z-10 bg-white px-3 py-1 rounded-full">
            {blog.blogTag}
          </div>
          <Image
            src={blog.thumbnail}
            alt={blog.title}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="p-6">
          <h2 className="text-3xl font-bold mb-6">{blog.title}</h2>
          
          <div className="prose max-w-none">
            {blocks.map((block) => (
              <div key={block.id}>{renderBlock(block)}</div>
            ))}
          </div>
          
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