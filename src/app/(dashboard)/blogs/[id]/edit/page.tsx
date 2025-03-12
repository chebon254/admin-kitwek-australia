'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { uploadFile } from "@/lib/uploadFile";
import Image from "next/image";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function EditBlogPage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [currentFiles, setCurrentFiles] = useState<string[]>([]);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/blogs/${id}`);
        if (!response.ok) throw new Error('Blog not found');
        const blog = await response.json();
        
        setTitle(blog.title);
        setDescription(blog.description);
        setThumbnailPreview(blog.thumbnail);
        setCurrentFiles(blog.files || []);
      } catch (error) {
        console.error('Error fetching blog:', error);
        toast.error('Failed to load blog');
        router.push('/blogs');
      }
    };

    fetchBlog();
  }, [params, router]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const removeCurrentFile = (index: number) => {
    setCurrentFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { id } = await params;

      let thumbnailUrl = thumbnailPreview;
      if (thumbnail) {
        thumbnailUrl = await uploadFile(thumbnail, "blogs");
      }

      // Upload new files if any
      const newFileUrls = await Promise.all(
        files.map(file => uploadFile(file, "blogs"))
      );

      // Combine current and new files
      const allFiles = [...currentFiles, ...newFileUrls];

      const response = await fetch(`/api/blogs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          thumbnail: thumbnailUrl,
          files: allFiles,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update blog post");
      }

      toast.success("Blog post updated successfully");
      router.push("/blogs");
    } catch (error) {
      console.error("Error updating blog:", error);
      toast.error("Failed to update blog post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Blog Post</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded-md h-32"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thumbnail Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="w-full mb-4"
            disabled={loading}
          />
          {thumbnailPreview && (
            <div className="relative h-48 w-full rounded-lg overflow-hidden">
              <Image
                src={thumbnailPreview}
                alt="Thumbnail preview"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Files
          </label>
          {currentFiles.length > 0 && (
            <div className="space-y-2 mb-4">
              {currentFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <a
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {file.split('/').pop()}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeCurrentFile(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add New Files
          </label>
          <input
            type="file"
            onChange={handleFileAdd}
            className="w-full mb-4"
            disabled={loading}
          />
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/blogs')}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Blog Post"}
          </button>
        </div>
      </form>
    </div>
  );
}