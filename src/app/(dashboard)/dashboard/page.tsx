import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Users,
  FileText,
  Calendar,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Clock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [
    blogsCount,
    eventsCount,
    forumsCount,
    donationsCount,
    activeUsers,
    inactiveUsers,
    recentUsers,
    recentDonations,
    upcomingEvents,
    totalDonated,
    activeEvents
  ] = await Promise.all([
    prisma.blog.count({ where: { adminId: userId } }),
    prisma.event.count({ where: { adminId: userId } }),
    prisma.forum.count({ where: { adminId: userId } }),
    prisma.donation.count({ where: { adminId: userId } }),
    prisma.user.count({ where: { membershipStatus: 'ACTIVE' } }),
    prisma.user.count({ where: { membershipStatus: 'INACTIVE' } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImage: true,
        createdAt: true,
        membershipStatus: true
      }
    }),
    prisma.donation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        donors: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.event.findMany({
      take: 5,
      where: {
        date: {
          gte: new Date(),
        },
        status: "UPCOMING",
      },
      orderBy: { date: "asc" },
      include: {
        _count: {
          select: { attendees: true },
        },
      },
    }),
    prisma.donor.aggregate({
      _sum: {
        amount: true,
      },
    }),
    prisma.event.count({
      where: {
        status: "ONGOING",
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Members</p>
              <div className="mt-2">
                <p className="text-lg font-semibold text-green-600">
                  {activeUsers} Active
                </p>
                <p className="text-lg font-semibold text-red-600">
                  {inactiveUsers} Inactive
                </p>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{eventsCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-blue-500 font-medium">
                {activeEvents} Active Events
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Donations
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalDonated._sum.amount?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">
                {donationsCount} Campaigns
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-2xl font-bold text-gray-900">
                {blogsCount + forumsCount}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <MessageSquare className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-blue-500 font-medium">
                {forumsCount} Active Forums
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Recent Members</h2>
          </div>
          <div className="divide-y">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {user.profileImage ? (
                        <Image
                          src={user.profileImage}
                          alt={`${user.firstName} ${user.lastName}`}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                        user.membershipStatus === "ACTIVE"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <Link
              href="/members"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All Members →
            </Link>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
          </div>
          <div className="divide-y">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{event.title}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {event._count.attendees} / {event.capacity} Attendees
                  </span>
                  <Link
                    href={`/events/${event.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(
                        (event._count.attendees / event.capacity) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <Link
              href="/events"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All Events →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Donations */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Donations</h2>
        </div>
        <div className="divide-y">
          {recentDonations.map((donation) => (
            <div key={donation.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium">{donation.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Latest donor: {donation.donors[0]?.name || "No donors yet"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    ${donation.donors[0]?.amount.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(donation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {donation.goal && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          (donation.donors.reduce(
                            (sum, donor) => sum + donor.amount,
                            0
                          ) /
                            donation.goal) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-sm text-gray-500">
                    <span>
                      $
                      {donation.donors
                        .reduce((sum, donor) => sum + donor.amount, 0)
                        .toFixed(2)}
                    </span>
                    <span>Goal: ${donation.goal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <Link
            href="/donations"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All Donations →
          </Link>
        </div>
      </div>
    </div>
  );
}