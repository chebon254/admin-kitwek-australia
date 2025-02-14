"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Image as ImageIcon, X } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import Image from "next/image";

const donationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

type DonationFormData = z.infer<typeof donationSchema>;

interface Donation {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  amount: number;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
  });

  useEffect(() => {
    fetch("/api/donations")
      .then((res) => res.json())
      .then(setDonations);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: DonationFormData) => {
    try {
      if (!thumbnail) {
        alert("Please select a thumbnail image");
        return;
      }

      const formData = new FormData();
      formData.append("file", thumbnail);

      // Upload image
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image");
      const { imageUrl } = await uploadRes.json();

      // Create donation
      const donationRes = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          thumbnail: imageUrl,
        }),
      });

      if (!donationRes.ok) throw new Error("Failed to create donation");
      const newDonation = await donationRes.json();

      setDonations((prev) => [newDonation, ...prev]);
      setIsCreating(false);
      reset();
      setThumbnail(null);
      setThumbnailPreview("");
    } catch (error) {
      console.error("Error creating donation:", error);
      alert("Failed to create donation");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Donations</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Donation
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Donation</h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  {...register("title")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.title?.message && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.description?.message && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Thumbnail
                </label>
                <div className="mt-1 flex items-center">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <ImageIcon className="h-5 w-5 mr-2" />
                      Select Image
                    </span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                  {thumbnailPreview && (
                    <Image
                      src={thumbnailPreview}
                      alt="Preview"
                      height={80}
                      width={80}
                      className="ml-4 h-20 w-20 object-cover rounded"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {donations.map((donation) => (
          <div
            key={donation.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <Image
              src={donation.thumbnail}
              alt={donation.title}
              width={250}
              height={192}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold">{donation.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {donation.description}
              </p>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900">
                  Total Donated: {formatCurrency(donation.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  Created on {formatDate(new Date(donation.createdAt))}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
