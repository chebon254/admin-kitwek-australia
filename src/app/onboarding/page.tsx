"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { uploadFile } from "@/lib/uploadFile";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
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

      // Upload image first
      const uploadToast = toast.loading("Uploading image...");
      const imageUrl = await uploadFile(image, "admin-profiles");
      toast.dismiss(uploadToast);
      
      // Save profile
      const saveToast = toast.loading("Saving profile...");
      
      try {
        // Update database first
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
          const errorText = await response.text();
          throw new Error(errorText || "Failed to save profile");
        }

        // Then update Clerk profile
        if (user) {
          await Promise.all([
            user.update({
              firstName: name.trim().split(" ")[0],
              lastName: name.trim().split(" ").slice(1).join(" "),
            }),
            user.setProfileImage({
              file: image
            })
          ]);
        }

        toast.dismiss(saveToast);
        toast.success("Profile updated successfully");
        
        // Use router.push instead of window.location for better navigation
        router.push("/dashboard");
      } catch (error) {
        toast.dismiss(saveToast);
        throw error;
      }

    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
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