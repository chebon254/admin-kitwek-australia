import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoadingLink } from "@/components/ui/LoadingLink";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export default async function ReimbursementsListPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get all PAID applications with their reimbursement statistics
  const paidApplications = await prisma.welfareApplication.findMany({
    where: {
      status: 'PAID'
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          username: true
        }
      },
      reimbursements: {
        select: {
          id: true,
          status: true,
          amountDue: true,
          amountPaid: true
        }
      }
    },
    orderBy: { payoutDate: 'desc' }
  });

  // Calculate statistics for each application
  const applicationsWithStats = paidApplications.map(app => {
    const totalReimbursements = app.reimbursements.length;
    const paidReimbursements = app.reimbursements.filter(r => r.status === 'PAID').length;
    const pendingReimbursements = app.reimbursements.filter(r => r.status === 'PENDING').length;
    const overdueReimbursements = app.reimbursements.filter(r => r.status === 'OVERDUE').length;

    const totalDue = app.reimbursements
      .filter(r => r.status === 'PENDING' || r.status === 'OVERDUE')
      .reduce((sum, r) => sum + (r.amountDue || 0), 0);

    const totalCollected = app.reimbursements
      .filter(r => r.status === 'PAID')
      .reduce((sum, r) => sum + (r.amountPaid || 0), 0);

    const collectionRate = totalReimbursements > 0
      ? ((paidReimbursements / totalReimbursements) * 100).toFixed(1)
      : '0';

    return {
      ...app,
      stats: {
        totalReimbursements,
        paidReimbursements,
        pendingReimbursements,
        overdueReimbursements,
        totalDue,
        totalCollected,
        collectionRate
      }
    };
  });

  // Overall statistics
  const overallStats = {
    totalClaims: applicationsWithStats.length,
    totalReimbursements: applicationsWithStats.reduce((sum, app) => sum + app.stats.totalReimbursements, 0),
    totalPaid: applicationsWithStats.reduce((sum, app) => sum + app.stats.paidReimbursements, 0),
    totalPending: applicationsWithStats.reduce((sum, app) => sum + app.stats.pendingReimbursements, 0),
    totalOverdue: applicationsWithStats.reduce((sum, app) => sum + app.stats.overdueReimbursements, 0),
    totalAmountDue: applicationsWithStats.reduce((sum, app) => sum + app.stats.totalDue, 0),
    totalAmountCollected: applicationsWithStats.reduce((sum, app) => sum + app.stats.totalCollected, 0),
  };

  const overallCollectionRate = overallStats.totalReimbursements > 0
    ? ((overallStats.totalPaid / overallStats.totalReimbursements) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <LoadingLink
          href="/welfare"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Welfare Dashboard
        </LoadingLink>
        <h1 className="text-3xl font-bold text-gray-900">Reimbursement Tracking</h1>
        <p className="text-gray-600 mt-2">
          Track member reimbursements for all paid welfare claims
        </p>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Claims</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalClaims}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-green-600">{overallCollectionRate}%</p>
              <p className="text-xs text-gray-500">{overallStats.totalPaid} / {overallStats.totalReimbursements} paid</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{overallStats.totalPending}</p>
              <p className="text-xs text-gray-500">AUD ${overallStats.totalAmountDue.toFixed(2)}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overallStats.totalOverdue}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Claims Requiring Reimbursement</h2>
        </div>

        {applicationsWithStats.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No paid claims with reimbursements yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payout Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reimbursements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collection
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applicationsWithStats.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {app.deceasedName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.applicationType === 'MEMBER_DEATH' ? 'Member Death' : 'Family Death'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {app.user.firstName && app.user.lastName
                          ? `${app.user.firstName} ${app.user.lastName}`
                          : app.user.username || app.user.email}
                      </div>
                      <div className="text-sm text-gray-500">{app.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      AUD ${app.claimAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {app.payoutDate ? new Date(app.payoutDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {app.stats.paidReimbursements}
                        </span>
                        {app.stats.pendingReimbursements > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <Clock className="w-3 h-3 mr-1" />
                            {app.stats.pendingReimbursements}
                          </span>
                        )}
                        {app.stats.overdueReimbursements > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {app.stats.overdueReimbursements}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Total: {app.stats.totalReimbursements} members
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              {app.stats.collectionRate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${app.stats.collectionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        AUD ${app.stats.totalCollected.toFixed(2)} collected
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <LoadingLink
                        href={`/welfare/reimbursements/${app.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </LoadingLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
