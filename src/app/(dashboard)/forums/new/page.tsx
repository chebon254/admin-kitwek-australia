"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SuccessNotification } from "@/components/SuccessNotification";

export default function NewForumPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch("/api/forums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create forum");
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/forums");
      }, 5000);
    } catch (error) {
      console.error("Error creating forum:", error);
      toast.error("Failed to create forum");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Forum</h1>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Forum"}
        </button>
      </form>
      {showSuccess && (
        <SuccessNotification
          message="Blog was added successfully!"
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
}
