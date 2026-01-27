import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Search, Filter, Users, DollarSign, CheckCircle, Clock, FileSpreadsheet, FileText } from "lucide-react";
import { WelfareRegistrationActions } from '@/components/welfare/WelfareRegistrationActions';
import type { WelfareRegistrationWithUser } from '@/types/welfare';
import { Prisma } from '@prisma/client';
import { ExportButtons } from '@/components/welfare/ExportButtons';

// Define the props with promises as required by Next.js 14
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Define the registration type with user relation
type RegistrationWithUser = {
  id: string;
  status: string;
  paymentStatus: string;
  registrationDate: Date;
  registrationFee: number;
  createdAt: Date;
  user: {
    id: string;
    email: string | null;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    memberNumber: string | null;
    membershipStatus: string | null;
  } | null;
};

export default async function WelfareRegistrationsPage(props: {
  searchParams: SearchParams
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  const searchParams = await props.searchParams;
  const status = searchParams.status as string || 'all';
  const search = searchParams.search as string || '';

  // Build where clause with proper Prisma types
  const whereClause: Prisma.WelfareRegistrationWhereInput = {};
  
  if (status !== 'all') {
    if (status === 'active') {
      whereClause.status = 'ACTIVE';
      whereClause.paymentStatus = 'PAID';
    } else if (status === 'pending') {
      whereClause.paymentStatus = 'PENDING';
    } else if (status === 'inactive') {
      whereClause.status = 'INACTIVE';
    }
  }

  // Get registrations with user data
  const registrations = await prisma.welfareRegistration.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          memberNumber: true,
          membershipStatus: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Filter by search term if provided
  const filteredRegistrations = search 
    ? registrations.filter(reg => 
        reg.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        reg.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
        reg.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        reg.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        reg.user?.memberNumber?.toLowerCase().includes(search.toLowerCase())
      )
    : registrations;

  // Calculate statistics
  const totalRegistrations = registrations.length;
  const activeCount = registrations.filter(r => r.status === 'ACTIVE' && r.paymentStatus === 'PAID').length;
  const pendingCount = registrations.filter(r => r.paymentStatus === 'PENDING').length;
  const totalAmount = activeCount * 200;

  const getStatusBadge = (registration: RegistrationWithUser): string => {
    if (registration.status === 'ACTIVE' && registration.paymentStatus === 'PAID') {
      return 'bg-green-100 text-green-800';
    } else if (registration.paymentStatus === 'PENDING') {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (registration: RegistrationWithUser): string => {
    if (registration.status === 'ACTIVE' && registration.paymentStatus === 'PAID') {
      return 'Active';
    } else if (registration.paymentStatus === 'PENDING') {
      return 'Pending Payment';
    } else {
      return 'Inactive';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/welfare" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Welfare Registrations</h1>
            <p className="text-gray-600 mt-1">Manage welfare fund registrations</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Registrations</p>
              <p className="text-2xl font-semibold text-gray-900">{totalRegistrations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Members</p>
              <p className="text-2xl font-semibold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Fund</p>
              <p className="text-2xl font-semibold text-gray-900">${totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 md:hidden">Filters & Export</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <form method="GET">
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Search registrations..."
                  className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input type="hidden" name="status" value={status} />
              </form>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <div className="flex gap-2">
              <Link
                href="/welfare/registrations"
                className={`px-3 py-1 rounded-md text-sm ${
                  status === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </Link>
              <Link
                href="/welfare/registrations?status=active"
                className={`px-3 py-1 rounded-md text-sm ${
                  status === 'active' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </Link>
              <Link
                href="/welfare/registrations?status=pending"
                className={`px-3 py-1 rounded-md text-sm ${
                  status === 'pending' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </Link>
              <Link
                href="/welfare/registrations?status=inactive"
                className={`px-3 py-1 rounded-md text-sm ${
                  status === 'inactive'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactive
              </Link>
            </div>
            </div>

            {/* Export Buttons */}
            <ExportButtons status={status} />
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRegistrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRegistrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {registration.user?.firstName && registration.user?.lastName 
                            ? `${registration.user.firstName} ${registration.user.lastName}`
                            : registration.user?.username || 'N/A'
                          }
                        </div>
                        <div className="text-sm text-gray-500">
                          {registration.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registration.user?.memberNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(registration.registrationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        registration.paymentStatus === 'PAID' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {registration.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${registration.registrationFee.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(registration)}`}>
                        {getStatusText(registration)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <WelfareRegistrationActions registration={registration as WelfareRegistrationWithUser} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || status !== 'all' 
                ? "Try adjusting your search or filter criteria" 
                : "No welfare registrations have been submitted yet"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}