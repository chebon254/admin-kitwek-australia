"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Edit2, Save, X, Loader2, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Beneficiary {
  id: string;
  fullName: string;
  relationship: string;
  phone: string;
  email: string | null;
  idNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  memberNumber: string | null;
}

export default function BeneficiariesManagementPage() {
  const params = useParams();
  const registrationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Beneficiary>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchBeneficiaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationId]);

  const fetchBeneficiaries = async () => {
    try {
      const response = await fetch(`/api/welfare/registrations/${registrationId}/details`);
      if (response.ok) {
        const data = await response.json();
        setBeneficiaries(data.familyMembers || []);
        setUserInfo(data.user);
      } else {
        toast.error("Failed to load beneficiaries");
      }
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
      toast.error("Failed to load beneficiaries");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (beneficiary: Beneficiary) => {
    setEditingId(beneficiary.id);
    setEditForm({
      fullName: beneficiary.fullName,
      relationship: beneficiary.relationship,
      phone: beneficiary.phone,
      email: beneficiary.email || "",
      idNumber: beneficiary.idNumber || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (beneficiaryId: string) => {
    if (!editForm.fullName || !editForm.relationship || !editForm.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/welfare/beneficiaries/${beneficiaryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Beneficiary updated successfully");
        setEditingId(null);
        setEditForm({});
        fetchBeneficiaries(); // Refresh data
      } else {
        toast.error(data.error || "Failed to update beneficiary");
      }
    } catch (error) {
      console.error("Error updating beneficiary:", error);
      toast.error("Failed to update beneficiary");
    } finally {
      setSaving(false);
    }
  };

  const deleteBeneficiary = async (beneficiaryId: string) => {
    try {
      const response = await fetch(`/api/welfare/beneficiaries/${beneficiaryId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Beneficiary deleted successfully");
        setDeleteConfirm(null);
        fetchBeneficiaries(); // Refresh data
      } else {
        toast.error(data.error || "Failed to delete beneficiary");
      }
    } catch (error) {
      console.error("Error deleting beneficiary:", error);
      toast.error("Failed to delete beneficiary");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/welfare/registrations"
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Manage Beneficiaries</h1>
          {userInfo && (
            <p className="text-gray-600 mt-1">
              For {userInfo.firstName} {userInfo.lastName} ({userInfo.email})
            </p>
          )}
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Administrator Access</p>
            <p>
              You can edit or delete beneficiaries. Regular users cannot modify
              their beneficiaries once submitted. All changes are logged for
              audit purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Beneficiaries List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Beneficiaries ({beneficiaries.length})
          </h3>
        </div>

        {beneficiaries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No beneficiaries found for this registration.</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-6">
            {beneficiaries.map((beneficiary, index) => (
              <div
                key={beneficiary.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">
                    Beneficiary {index + 1}
                  </h4>
                  <div className="flex gap-2">
                    {editingId === beneficiary.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(beneficiary.id)}
                          disabled={saving}
                          className="inline-flex items-center px-3 py-1.5 text-sm border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(beneficiary)}
                          className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(beneficiary.id)}
                          className="inline-flex items-center px-3 py-1.5 text-sm border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={
                        editingId === beneficiary.id
                          ? editForm.fullName || ""
                          : beneficiary.fullName
                      }
                      onChange={(e) =>
                        setEditForm({ ...editForm, fullName: e.target.value })
                      }
                      disabled={editingId !== beneficiary.id}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship *
                    </label>
                    <input
                      type="text"
                      value={
                        editingId === beneficiary.id
                          ? editForm.relationship || ""
                          : beneficiary.relationship
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          relationship: e.target.value,
                        })
                      }
                      disabled={editingId !== beneficiary.id}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={
                        editingId === beneficiary.id
                          ? editForm.phone || ""
                          : beneficiary.phone
                      }
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      disabled={editingId !== beneficiary.id}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={
                        editingId === beneficiary.id
                          ? editForm.email || ""
                          : beneficiary.email || ""
                      }
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      disabled={editingId !== beneficiary.id}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={
                        editingId === beneficiary.id
                          ? editForm.idNumber || ""
                          : beneficiary.idNumber || ""
                      }
                      onChange={(e) =>
                        setEditForm({ ...editForm, idNumber: e.target.value })
                      }
                      disabled={editingId !== beneficiary.id}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  <p>Added: {new Date(beneficiary.createdAt).toLocaleString()}</p>
                  <p>Last Updated: {new Date(beneficiary.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Beneficiary
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to delete this beneficiary? This action
                  cannot be undone. If this is the last beneficiary for a paid
                  welfare member, deletion will be prevented.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteBeneficiary(deleteConfirm)}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
