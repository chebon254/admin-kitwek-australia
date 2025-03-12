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

export default function EditDonationPage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/donations/${id}`);
        if (!response.ok) throw new Error('Donation not found');
        const donation = await response.json();
        
        setName(donation.name);
        setDescription(donation.description);
        setGoal(donation.goal?.toString() || "");
        setEndDate(donation.endDate ? new Date(donation.endDate).toISOString().split('T')[0] : "");
        setThumbnailPreview(donation.thumbnail);
      } catch (error) {
        console.error('Error fetching donation:', error);
        toast.error('Failed to load donation campaign');
        router.push('/donations');
      }
    };

    fetchDonation();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { id } = await params;

      let thumbnailUrl = thumbnailPreview;
      if (thumbnail) {
        thumbnailUrl = await uploadFile(thumbnail, "donations");
      }

      const response = await fetch(`/api/donations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          thumbnail: thumbnailUrl,
          goal: goal ? parseFloat(goal) : null,
          endDate: endDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update donation campaign");
      }

      toast.success("Donation campaign updated successfully");
      router.push("/donations");
    } catch (error) {
      console.error("Error updating donation:", error);
      toast.error("Failed to update donation campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Donation Campaign</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fundraising Goal (Optional)
            </label>
            <input
              type="number"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter amount"
              min="0"
              step="0.01"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded-md"
              min={new Date().toISOString().split('T')[0]}
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Image
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

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/donations')}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}