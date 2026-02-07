import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle
} from "lucide-react";

// Define the props with promises as required by Next.js 14
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function WelfareApplicationsPage(props: {
  searchParams: SearchParams
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  const searchParams = await props.searchParams;
  const status = searchParams.status as string || 'all';
  const type = searchParams.type as string || 'all';
  const search = searchParams.search as string || '';

  // Build where clause with proper typing
  const whereClause: {
    status?: string;
    applicationType?: string;
  } = {};
  
  if (status !== 'all') {
    whereClause.status = status.toUpperCase();
  }

  if (type !== 'all') {
    whereClause.applicationType = type.toUpperCase();
  }

  // Get applications with user data
  const applications = await prisma.welfareApplication.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          memberNumber: true
        }
      },
      beneficiaries: true,
      documents: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Filter by search term if provided
  const filteredApplications = search 
    ? applications.filter(app => 
        app.deceasedName.toLowerCase().includes(search.toLowerCase()) ||
        app.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        app.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
        app.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        app.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        app.user?.memberNumber?.toLowerCase().includes(search.toLowerCase())
      )
    : applications;

  // Calculate statistics
  const totalApplications = applications.length;
  const pendingCount = applications.filter(a => a.status === 'PENDING').length;
  const approvedCount = applications.filter(a => a.status === 'APPROVED').length;
  const paidCount = applications.filter(a => a.status === 'PAID').length;
  const totalClaimAmount = applications
    .filter(a => a.status === 'APPROVED' || a.status === 'PAID')
    .reduce((sum, a) => sum + a.claimAmount, 0);
  const totalPaidAmount = applications
    .filter(a => a.status === 'PAID')
    .reduce((sum, a) => sum + a.claimAmount, 0);

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      PAID: "bg-blue-100 text-blue-800"
    };
    return badges[status as keyof typeof badges] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'PAID':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a href="/welfare" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <div>
            <h1 className="text-2xl font-bold">Welfare Applications</h1>
            <p className="text-gray-600 mt-1">Review and manage welfare claims</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{totalApplications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">{approvedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Claims</p>
              <p className="text-2xl font-semibold text-gray-900">${totalClaimAmount.toLocaleString()}</p>
              {totalPaidAmount > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  ${totalPaidAmount.toLocaleString()} paid out ({paidCount} claims)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <form method="GET">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search applications..."
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="type" value={type} />
            </form>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Status:</span>
              <div className="flex gap-2">
                <a
                  href="/welfare/applications"
                  className={`px-3 py-1 rounded-md text-sm ${
                    status === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </a>
                <a
                  href="/welfare/applications?status=pending"
                  className={`px-3 py-1 rounded-md text-sm ${
                    status === 'pending' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </a>
                <a
                  href="/welfare/applications?status=approved"
                  className={`px-3 py-1 rounded-md text-sm ${
                    status === 'approved' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Approved
                </a>
                <a
                  href="/welfare/applications?status=rejected"
                  className={`px-3 py-1 rounded-md text-sm ${
                    status === 'rejected' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Rejected
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Type:</span>
              <div className="flex gap-2">
                <a
                  href={`/welfare/applications?status=${status}`}
                  className={`px-3 py-1 rounded-md text-sm ${
                    type === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </a>
                <a
                  href={`/welfare/applications?status=${status}&type=family_death`}
                  className={`px-3 py-1 rounded-md text-sm ${
                    type === 'family_death' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Family
                </a>
                <a
                  href={`/welfare/applications?status=${status}&type=member_death`}
                  className={`px-3 py-1 rounded-md text-sm ${
                    type === 'member_death' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Member
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredApplications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deceased
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.user?.firstName && application.user?.lastName 
                            ? `${application.user.firstName} ${application.user.lastName}`
                            : application.user?.username || 'N/A'
                          }
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.user?.email}
                        </div>
                        {application.user?.memberNumber && (
                          <div className="text-xs text-gray-400">
                            Member: {application.user.memberNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {application.deceasedName}
                      </div>
                      {application.relationToDeceased && (
                        <div className="text-sm text-gray-500">
                          {application.relationToDeceased}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        application.applicationType === 'MEMBER_DEATH'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {application.applicationType === 'MEMBER_DEATH' ? 'Member Death' : 'Family Death'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${application.claimAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(application.status)}`}>
                        {getStatusIcon(application.status)}
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {application.documents.length}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href={`/welfare/applications/${application.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Review
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || status !== 'all' || type !== 'all'
                ? "Try adjusting your search or filter criteria" 
                : "No welfare applications have been submitted yet"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}