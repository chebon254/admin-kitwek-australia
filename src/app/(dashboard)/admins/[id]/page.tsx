"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, Loader2, AlertCircle, Eye, EyeOff, Save } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import { LoadingLink } from "@/components/ui/LoadingLink";

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
  const { user: currentUser } = useUser();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const isOwnProfile = currentUser?.id === params.id;

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admins/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Admin not found');
          }
          throw new Error('Failed to fetch admin details');
        }
        
        const data = await response.json();
        setAdmin(data);
      } catch (error) {
        console.error('Error fetching admin:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        toast.error(error instanceof Error ? error.message : 'Failed to load admin details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAdmin();
    }
  }, [params.id]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    
    try {
      setPasswordLoading(true);
      const response = await fetch(`/api/admins/${params.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update password');
      }
      
      toast.success('Password updated successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

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
        <h3 className="mt-2 text-sm font-medium text-gray-900">{error || 'Admin not found'}</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please try again or go back to the admin list.
        </p>
        <div className="mt-6">
          <LoadingLink
            href="/admins"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Admin List
          </LoadingLink>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LoadingLink href="/admins" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </LoadingLink>
        <h1 className="text-2xl font-bold">Admin Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative h-32 w-32 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {admin.profileImage ? (
                <Image
                  src={admin.profileImage || "/ui-assets/avatar.webp"}
                  alt={admin.name || 'Admin'}
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
                  {admin.name || 'Unnamed Admin'}
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
              
              {isOwnProfile && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {showPasswordForm ? 'Cancel' : 'Change Password'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {isOwnProfile && showPasswordForm && (
            <div className="mt-8 max-w-md mx-auto sm:mx-0">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      required
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      required
                      minLength={8}
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={passwordLoading}
                  />
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}