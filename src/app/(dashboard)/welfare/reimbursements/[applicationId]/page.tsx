import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoadingLink } from "@/components/ui/LoadingLink";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign
} from "lucide-react";

interface PageProps {
  params: Promise<{
    applicationId: string;
  }>;
}

export default async function ReimbursementDetailPage({ params }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { applicationId } = await params;

  // Get the application with all reimbursements
  const application = await prisma.welfareApplication.findUnique({
    where: { id: applicationId },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          username: true,
          phone: true
        }
      },
      reimbursements: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              username: true,
              phone: true,
              memberNumber: true
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // OVERDUE, PAID, PENDING
          { dueDate: 'asc' }
        ]
      }
    }
  });

  if (!application) {
    notFound();
  }

  // Calculate statistics
  const stats = {
    total: application.reimbursements.length,
    paid: application.reimbursements.filter(r => r.status === 'PAID').length,
    pending: application.reimbursements.filter(r => r.status === 'PENDING').length,
    overdue: application.reimbursements.filter(r => r.status === 'OVERDUE').length,
    totalDue: application.reimbursements
      .filter(r => r.status !== 'PAID')
      .reduce((sum, r) => sum + (r.amountDue || 0), 0),
    totalCollected: application.reimbursements
      .filter(r => r.status === 'PAID')
      .reduce((sum, r) => sum + (r.amountPaid || 0), 0)
  };

  const collectionRate = stats.total > 0
    ? ((stats.paid / stats.total) * 100).toFixed(1)
    : '0';

  // Separate reimbursements by status
  const overdueReimbursements = application.reimbursements.filter(r => r.status === 'OVERDUE');
  const pendingReimbursements = application.reimbursements.filter(r => r.status === 'PENDING');
  const paidReimbursements = application.reimbursements.filter(r => r.status === 'PAID');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };

  const ReimbursementRow = ({ reimbursement }: { reimbursement: typeof application.reimbursements[0] }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {reimbursement.user.firstName && reimbursement.user.lastName
                ? `${reimbursement.user.firstName} ${reimbursement.user.lastName}`
                : reimbursement.user.username || reimbursement.user.email}
            </div>
            <div className="text-sm text-gray-500">{reimbursement.user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {reimbursement.user.memberNumber || 'N/A'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        AUD ${reimbursement.amountDue?.toFixed(2) || '0.00'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {reimbursement.status === 'PAID'
          ? `AUD $${reimbursement.amountPaid?.toFixed(2) || '0.00'}`
          : '-'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {reimbursement.dueDate ? new Date(reimbursement.dueDate).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {reimbursement.paidAt ? new Date(reimbursement.paidAt).toLocaleDateString() : '-'}
      </td>
      <td className="px-6 py-4">
        {getStatusBadge(reimbursement.status)}
      </td>
    </tr>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <LoadingLink
          href="/welfare/reimbursements"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reimbursements
        </LoadingLink>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reimbursements for {application.deceasedName}
            </h1>
            <p className="text-gray-600 mt-2">
              {application.applicationType === 'MEMBER_DEATH' ? 'Member Death Benefit' : 'Family Death Benefit'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Claim Amount</div>
            <div className="text-2xl font-bold text-gray-900">
              AUD ${application.claimAmount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <User className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              <p className="text-xs text-gray-500">AUD ${stats.totalCollected.toFixed(2)}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-blue-600">{collectionRate}%</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Applicant Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Claim Applicant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center text-sm">
            <User className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600 mr-2">Name:</span>
            <span className="text-gray-900 font-medium">
              {application.user.firstName && application.user.lastName
                ? `${application.user.firstName} ${application.user.lastName}`
                : application.user.username || 'N/A'}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Mail className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600 mr-2">Email:</span>
            <span className="text-gray-900 font-medium">{application.user.email}</span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600 mr-2">Payout Date:</span>
            <span className="text-gray-900 font-medium">
              {application.payoutDate ? new Date(application.payoutDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600 mr-2">Reimbursement Due:</span>
            <span className="text-gray-900 font-medium">
              {application.reimbursementDue ? new Date(application.reimbursementDue).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Overdue Reimbursements */}
      {overdueReimbursements.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden mb-6">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-red-900">
                Overdue Reimbursements ({overdueReimbursements.length})
              </h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overdueReimbursements.map((reimbursement) => (
                  <ReimbursementRow key={reimbursement.id} reimbursement={reimbursement} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Reimbursements */}
      {pendingReimbursements.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-orange-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Reimbursements ({pendingReimbursements.length})
              </h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingReimbursements.map((reimbursement) => (
                  <ReimbursementRow key={reimbursement.id} reimbursement={reimbursement} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paid Reimbursements */}
      {paidReimbursements.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Paid Reimbursements ({paidReimbursements.length})
              </h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paidReimbursements.map((reimbursement) => (
                  <ReimbursementRow key={reimbursement.id} reimbursement={reimbursement} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.total === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No reimbursements created for this claim yet</p>
        </div>
      )}
    </div>
  );
}
