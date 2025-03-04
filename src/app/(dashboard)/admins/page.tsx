"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserPlus,
  Search,
  AlertCircle,
  Loader2,
  User,
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  profileImage: string | null;
  createdAt: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const superAdminEmail = "info@kitwekvictoria.org";

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admins");

      if (!response.ok) {
        throw new Error("Failed to fetch admins");
      }

      const data = await response.json();
      setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to load admin users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    // Prevent deleting super admin
    if (email === superAdminEmail) {
      toast.error("Cannot delete super admin account");
      return;
    }

    if (confirm("Are you sure you want to delete this admin?")) {
      try {
        const response = await fetch(`/api/admins/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete admin");
        }

        toast.success("Admin deleted successfully");
        fetchAdmins(); // Refresh the list
      } catch (error) {
        console.error("Error deleting admin:", error);
        toast.error("Failed to delete admin");
      }
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Users</h1>
          <p className="text-gray-600 mt-1">Manage platform administrators</p>
        </div>
        <Link
          href="/admins/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Admin
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search admins..."
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredAdmins.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Admin
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 relative rounded-full overflow-hidden bg-gray-100">
                          {admin.profileImage ? (
                            <Image
                              src={admin.profileImage || "/ui-assets/avatar.webp"}
                              alt={admin.name || "Admin"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <User className="h-full w-full p-2 text-gray-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {admin.name || "Unnamed Admin"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/admins/${admin.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        {admin.email !== superAdminEmail ? (
                          <button
                            onClick={() => handleDelete(admin.id, admin.email)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-gray-400 cursor-not-allowed">
                            Delete
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No admins found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "Try a different search term"
                : "Add your first admin to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
