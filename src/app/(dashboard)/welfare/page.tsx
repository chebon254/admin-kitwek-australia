import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoadingLink } from "@/components/ui/LoadingLink";
import {
  Shield,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Vote,
  Mail
} from "lucide-react";

export default async function WelfareDashboard() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Get welfare fund statistics
  const welfareStats = await prisma.welfareFund.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  // Get registration counts
  const totalRegistrations = await prisma.welfareRegistration.count();
  const activeRegistrations = await prisma.welfareRegistration.count({
    where: {
      status: 'ACTIVE',
      paymentStatus: 'PAID'
    }
  });

  const pendingRegistrations = await prisma.welfareRegistration.count({
    where: {
      status: 'INACTIVE',
      paymentStatus: 'PENDING'
    }
  });

  // Get application counts
  const totalApplications = await prisma.welfareApplication.count();
  const pendingApplications = await prisma.welfareApplication.count({
    where: { status: 'PENDING' }
  });
  const approvedApplications = await prisma.welfareApplication.count({
    where: { status: 'APPROVED' }
  });

  // Calculate total fund amount
  const totalFundAmount = activeRegistrations * 100;

  // Get recent registrations
  const recentRegistrations = await prisma.welfareRegistration.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          username: true
        }
      }
    }
  });

  // Get recent applications
  const recentApplications = await prisma.welfareApplication.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          username: true
        }
      }
    }
  });

  const isOperational = activeRegistrations >= 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Welfare Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage the welfare fund</p>
        </div>
        <div className="flex gap-2">
          <LoadingLink
            href="/welfare/registrations"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md"
          >
            <span>View Registrations</span>
          </LoadingLink>
          <LoadingLink
            href="/welfare/applications"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 hover:shadow-md"
          >
            <span>View Applications</span>
          </LoadingLink>
          <LoadingLink
            href="/welfare/inform-members"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-all duration-200 hover:shadow-md inline-flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <span>Inform Members</span>
          </LoadingLink>
          <LoadingLink
            href="/welfare-voting"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 hover:shadow-md inline-flex items-center gap-2"
          >
            <Vote className="w-4 h-4" />
            <span>Welfare Voting</span>
          </LoadingLink>
        </div>
      </div>

      {/* Fund Status Alert */}
      <div className={`p-4 rounded-lg border ${
        isOperational 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-yellow-50 border-yellow-200 text-yellow-800'
      }`}>
        <div className="flex items-center">
          {isOperational ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <AlertTriangle className="h-5 w-5 mr-2" />
          )}
          <div>
            <p className="font-medium">
              {isOperational ? 'Welfare Fund is Operational' : 'Welfare Fund Not Yet Operational'}
            </p>
            <p className="text-sm">
              {isOperational 
                ? `Fund has ${activeRegistrations} active members and is ready to process claims.`
                : `Need ${100 - activeRegistrations} more active members to reach the 100 member minimum.`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Registrations</p>
              <p className="text-2xl font-semibold text-gray-900">{totalRegistrations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Members</p>
              <p className="text-2xl font-semibold text-gray-900">{activeRegistrations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Fund</p>
              <p className="text-2xl font-semibold text-gray-900">${totalFundAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Registrations</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingRegistrations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{totalApplications}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingApplications}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">{approvedApplications}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Registrations</h3>
              <LoadingLink href="/welfare/registrations" className="text-blue-600 hover:text-blue-800 text-sm transition-colors">
                View All
              </LoadingLink>
            </div>
          </div>
          <div className="p-6">
            {recentRegistrations.length > 0 ? (
              <div className="space-y-4">
                {recentRegistrations.map((registration) => (
                  <div key={registration.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {registration.user?.firstName && registration.user?.lastName 
                          ? `${registration.user.firstName} ${registration.user.lastName}`
                          : registration.user?.username || registration.user?.email
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(registration.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      registration.paymentStatus === 'PAID' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {registration.paymentStatus}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No registrations yet</p>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
              <LoadingLink href="/welfare/applications" className="text-blue-600 hover:text-blue-800 text-sm transition-colors">
                View All
              </LoadingLink>
            </div>
          </div>
          <div className="p-6">
            {recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {application.deceasedName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {application.applicationType === 'MEMBER_DEATH' ? 'Member Death' : 'Family Death'} • 
                        ${application.claimAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        Applied by: {application.user?.firstName && application.user?.lastName 
                          ? `${application.user.firstName} ${application.user.lastName}`
                          : application.user?.username || application.user?.email
                        }
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      application.status === 'PENDING' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : application.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {application.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No applications yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Fund Information */}
      {welfareStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fund Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Launch Date</p>
              <p className="font-medium">
                {welfareStats.launchDate 
                  ? new Date(welfareStats.launchDate).toLocaleDateString()
                  : 'Not launched yet'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Waiting Period End</p>
              <p className="font-medium">
                {welfareStats.waitingPeriodEnd 
                  ? new Date(welfareStats.waitingPeriodEnd).toLocaleDateString()
                  : 'Not set'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">
                {new Date(welfareStats.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}