"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { uploadFile } from "@/lib/uploadFile";
import Image from "next/image";
import { SuccessNotification } from "@/components/SuccessNotification";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

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

      if (!thumbnail) {
        toast.error("Please select a thumbnail image");
        return;
      }

      if (!date || !time) {
        toast.error("Please select both date and time");
        return;
      }

      // Combine date and time
      const eventDateTime = new Date(`${date}T${time}`);

      // Upload thumbnail
      const thumbnailUrl = await uploadFile(thumbnail, "events");

      // Create event
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          thumbnail: thumbnailUrl,
          date: eventDateTime.toISOString(),
          location,
          capacity: parseInt(capacity),
          isPaid,
          price: isPaid ? parseFloat(price) : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/events");
      }, 5000);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Event</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Title
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border rounded-md"
              min={new Date().toISOString().split("T")[0]}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacity
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full p-2 border rounded-md"
              min="1"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is this a paid event?
            </label>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                disabled={loading}
              />
              <span className="ml-2 text-gray-700">
                Yes, this is a paid event
              </span>
            </div>
          </div>
        </div>

        {isPaid && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ticket Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 pl-8 border rounded-md"
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="w-full mb-4"
            required
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Event"}
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
