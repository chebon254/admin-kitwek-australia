"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { uploadFile } from "@/lib/uploadFile";

export default function OnboardingPage() {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.fullName) {
      setName(user.fullName);
    }
  }, [user?.fullName]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!image) {
        toast.error("Please select a profile image");
        return;
      }

      if (!name.trim()) {
        toast.error("Please enter your name");
        return;
      }

      const uploadToast = toast.loading("Uploading image...");
      const imageUrl = await uploadFile(image, "admin-profiles");
      toast.dismiss(uploadToast);
      
      const saveToast = toast.loading("Saving profile...");

      // First update the admin user in our database
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          profileImage: imageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to complete onboarding");
      }

      // Then update the Clerk user profile
      // Then update the Clerk user profile
        if (user) {
          // Update username only
          await user.update({
            username: name.trim(),
          });

          // Then update profile image
          await user.setProfileImage({
            file: image
          });
        }

      toast.dismiss(saveToast);
      toast.success("Profile updated successfully");
      
      // Force a hard refresh to ensure the new state is picked up
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
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
              Profile Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full"
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}