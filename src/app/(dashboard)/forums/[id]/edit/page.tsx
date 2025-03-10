'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function EditForumPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchForum = async () => {
      try {
        const response = await fetch(`/api/forums/${params.id}`);
        if (!response.ok) throw new Error('Forum not found');
        const forum = await response.json();
        
        setTitle(forum.title);
        setDescription(forum.description);
      } catch (error) {
        console.error('Error fetching forum:', error);
        toast.error('Failed to load forum');
        router.push('/forums');
      }
    };

    fetchForum();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const response = await fetch(`/api/forums/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update forum");
      }

      toast.success("Forum updated successfully");
      router.push("/forums");
    } catch (error) {
      console.error("Error updating forum:", error);
      toast.error("Failed to update forum");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Forum</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Forum Title
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

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/forums')}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Forum"}
          </button>
        </div>
      </form>
    </div>
  );
}