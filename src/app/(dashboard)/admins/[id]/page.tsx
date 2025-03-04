"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admins/${params.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Admin not found");
          }
          throw new Error("Failed to fetch admin details");
        }

        const data = await response.json();
        setAdmin(data);
      } catch (error) {
        console.error("Error fetching admin:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load admin details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAdmin();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {error || "Admin not found"}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Please try again or go back to the admin list.
        </p>
        <div className="mt-6">
          <Link
            href="/admins"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Admin List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admins" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Admin Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative h-32 w-32 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {admin.profileImage ? (
                <Image
                  src={admin.profileImage}
                  alt={admin.name || "Admin"}
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-full w-full p-6 text-gray-400" />
              )}
            </div>

            <div className="space-y-4 text-center sm:text-left">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {admin.name || "Unnamed Admin"}
                </h2>
                <p className="text-gray-500">{admin.email}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(admin.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-medium">
                    {new Date(admin.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {admin.email === "info@kitwekvictoria.org" && (
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Super Admin
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
