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
      let imageUrl;
      try {
        imageUrl = await uploadFile(image, "admin-profiles");
        toast.dismiss(uploadToast);
      } catch (error) {
        console.error("Error", error);
        toast.dismiss(uploadToast);
        toast.error("Failed to upload image");
        return;
      }

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

        let responseData = "";
        try {
          responseData = await response.text();
        } catch (e) {
          console.error("Error reading response text:", e);
        }

        if (!response.ok) {
          let errorMessage = "Failed to save profile";

          try {
            const jsonData = JSON.parse(responseData);
            errorMessage = jsonData.message || errorMessage;
          } catch (e) {
            console.error("error", e);
            errorMessage = responseData || errorMessage;
          }

          throw new Error(errorMessage);
        }

        // Then update Clerk profile
        if (user) {
          const nameParts = name.trim().split(" ");
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(" ");

          try {
            // Update Clerk user data with correct parameter names
            await user.update({
              firstName: firstName,
              lastName: lastName || undefined,
            });

            // Set profile image separately
            await user.setProfileImage({
              file: image,
            });
          } catch (clerkError) {
            console.error("Error updating Clerk profile:", clerkError);
            // Continue despite Clerk update error
            // The user has been saved in the database, so we can proceed
          }
        }

        toast.dismiss(saveToast);
        toast.success("Profile updated successfully");

        // Add a small delay before redirecting to ensure state is updated
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } catch (error) {
        toast.dismiss(saveToast);
        throw error;
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
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
