'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Users, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Application {
  id: string;
  deceasedName: string;
  claimAmount: number;
  payoutDate: string;
  reimbursementDue: string;
  applicationType: string;
  applicant: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  };
  totalReimbursements: number;
  pendingReimbursements: number;
  paidReimbursements: number;
  activeMembers: number;
  needsReimbursements: boolean;
  reimbursementProgress: number;
}

interface CreateReimbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateReimbursementModal({ isOpen, onClose, onSuccess }: CreateReimbursementModalProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [amount, setAmount] = useState('19.00');
  const [totalActiveMembers, setTotalActiveMembers] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchApplications();
    }
  }, [isOpen]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/welfare/applications/pending-reimbursement');
      const data = await response.json();

      if (response.ok) {
        setApplications(data.applications);
        setTotalActiveMembers(data.totalActiveMembers);
      } else {
        toast.error(data.error || 'Failed to load applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedApp) {
      toast.error('Please select an application');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/welfare/reimbursements/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp,
          amountPerMember: amountNum
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Created ${data.created} reimbursements of AUD $${amountNum} each`,
          { duration: 5000 }
        );
        onSuccess();
        onClose();
        // Reset form
        setSelectedApp('');
        setAmount('19.00');
      } else {
        toast.error(data.error || 'Failed to create reimbursements');
      }
    } catch (error) {
      console.error('Error creating reimbursements:', error);
      toast.error('Failed to create reimbursements');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedApplication = applications.find(app => app.id === selectedApp);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Reimbursements</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select a paid application and set the reimbursement amount per member
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Active Members Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {totalActiveMembers} Active Welfare Members
                  </span>
                </div>
              </div>

              {/* Application Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Application *
                </label>
                {applications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No paid applications found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {applications.map(app => (
                      <label
                        key={app.id}
                        className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedApp === app.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="application"
                          value={app.id}
                          checked={selectedApp === app.id}
                          onChange={(e) => setSelectedApp(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">
                                Applicant: {app.applicant.firstName && app.applicant.lastName
                                  ? `${app.applicant.firstName} ${app.applicant.lastName}`
                                  : app.applicant.username || app.applicant.email}
                              </h4>
                              {app.totalReimbursements > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {app.totalReimbursements} / {app.activeMembers} created
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Claim: AUD ${app.claimAmount.toFixed(2)}</span>
                              <span>•</span>
                              <span>{new Date(app.payoutDate).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="capitalize">{app.applicationType}</span>
                            </div>
                            {app.totalReimbursements > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                  <span>Reimbursement Progress</span>
                                  <span>{app.reimbursementProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      app.reimbursementProgress === 100 ? 'bg-green-600' : 'bg-orange-600'
                                    }`}
                                    style={{ width: `${app.reimbursementProgress}%` }}
                                  />
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-xs">
                                  <span className="text-yellow-600">
                                    {app.pendingReimbursements} pending
                                  </span>
                                  <span className="text-green-600">
                                    {app.paidReimbursements} paid
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          {app.needsReimbursements ? (
                            <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Needs Reimbursements
                            </span>
                          ) : (
                            <CheckCircle className="ml-4 h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount Input */}
              {selectedApp && selectedApplication && (
                <div>
                  {selectedApplication.needsReimbursements ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount Per Member (AUD) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          placeholder="19.00"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">AUD</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Total to collect: AUD ${(parseFloat(amount) * (selectedApplication.activeMembers - selectedApplication.totalReimbursements)).toFixed(2)} from {selectedApplication.activeMembers - selectedApplication.totalReimbursements} remaining members
                      </p>
                    </>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            All Reimbursements Created
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            This application already has reimbursements for all {selectedApplication.activeMembers} active members.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedApp || submitting || loading || (selectedApplication && !selectedApplication.needsReimbursements)}
            className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4" />
                Create Reimbursements
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
