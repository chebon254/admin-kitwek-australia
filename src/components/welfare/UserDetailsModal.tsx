"use client";

import { useState, useEffect } from "react";
import { X, User, Users, FileText, Download, Loader2, Mail, Phone, Calendar, CreditCard } from "lucide-react";
import Image from "next/image";

interface FamilyDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

interface FamilyMember {
  id: string;
  fullName: string;
  relationship: string;
  phone: string;
  email: string | null;
  idNumber: string | null;
  documents: FamilyDocument[];
}

interface UserDetails {
  user: {
    id: string;
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    memberNumber: string | null;
    phone: string | null;
    createdAt: string;
  };
  registration: {
    id: string;
    status: string;
    paymentStatus: string;
    registrationDate: string;
    registrationFee: number;
  };
  familyMembers: FamilyMember[];
}

interface Props {
  registrationId: string;
  onClose: () => void;
}

export function UserDetailsModal({ registrationId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/welfare/registrations/${registrationId}/details`);

        if (!response.ok) {
          throw new Error('Failed to load user details');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [registrationId]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity animate-in fade-in duration-200" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <User className="h-6 w-6 mr-2" />
              User Details
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-full p-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <div className="text-red-600 mb-2">{error}</div>
                <button
                  onClick={onClose}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Close
                </button>
              </div>
            ) : data ? (
              <div className="p-6 space-y-6">
                {/* User Info Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start gap-6">
                    <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {data.user.profileImage ? (
                        <Image
                          src={data.user.profileImage}
                          alt={data.user.firstName || 'User'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User className="h-full w-full p-4 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                        {data.user.firstName && data.user.lastName
                          ? `${data.user.firstName} ${data.user.lastName}`
                          : data.user.username || 'N/A'
                        }
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">{data.user.email}</span>
                        </div>
                        {data.user.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">{data.user.phone}</span>
                          </div>
                        )}
                        {data.user.memberNumber && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <CreditCard className="h-4 w-4" />
                            <span className="text-sm font-medium">Member #{data.user.memberNumber}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Joined {new Date(data.user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registration Info */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Registration Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Registration Date</p>
                      <p className="font-medium">{new Date(data.registration.registrationDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Fee</p>
                      <p className="font-medium">${data.registration.registrationFee.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Status</p>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        data.registration.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {data.registration.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        data.registration.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : data.registration.status === 'SUSPENDED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {data.registration.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Family Members Section */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Beneficiaries ({data.familyMembers.length})
                  </h4>

                  {data.familyMembers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No beneficiaries added yet</p>
                  ) : (
                    <div className="space-y-4">
                      {data.familyMembers.map((member, index) => (
                        <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">Beneficiary {index + 1}</h5>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {member.relationship}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Full Name</p>
                              <p className="font-medium">{member.fullName}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Phone</p>
                              <p className="font-medium">{member.phone}</p>
                            </div>
                            {member.email && (
                              <div>
                                <p className="text-gray-500">Email</p>
                                <p className="font-medium">{member.email}</p>
                              </div>
                            )}
                            {member.idNumber && (
                              <div>
                                <p className="text-gray-500">ID Number</p>
                                <p className="font-medium">{member.idNumber}</p>
                              </div>
                            )}
                          </div>

                          {/* Documents for this member */}
                          {member.documents && member.documents.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <FileText className="h-4 w-4 mr-1" />
                                Documents ({member.documents.length})
                              </p>
                              <div className="space-y-2">
                                {member.documents.map((doc) => (
                                  <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                    <div className="flex items-center flex-1 min-w-0">
                                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                      <span className="ml-2 text-sm text-gray-700 truncate">{doc.fileName}</span>
                                    </div>
                                    <a
                                      href={doc.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-2 text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                                    >
                                      <Download className="h-4 w-4" />
                                      Download
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {!loading && !error && (
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
