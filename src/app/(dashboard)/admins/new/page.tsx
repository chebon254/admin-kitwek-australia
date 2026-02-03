"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { LoadingLink } from "@/components/ui/LoadingLink";
import toast from "react-hot-toast";
import { SuccessNotification } from "@/components/SuccessNotification";

export default function NewAdminPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !username.trim() || !password.trim()) {
      toast.error("Email, username, and password are required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          name: username.trim(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          password: password.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create admin");
      }
      setShowSuccess(true);
      setTimeout(() => {
        window.location.href = "/admins";
      }, 5000);
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create admin"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LoadingLink href="/admins" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </LoadingLink>
        <h1 className="text-2xl font-bold">Create New Admin</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username *
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="johndoe"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Doe"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
              minLength={8}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 8 characters
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Admin...
                </>
              ) : (
                "Create Admin"
              )}
            </button>
          </div>
        </form>
        {showSuccess && (
          <SuccessNotification
            message="Admin User was added successfully! Redirecting..."
            onClose={() => setShowSuccess(false)}
          />
        )}
      </div>
    </div>
  );
}
