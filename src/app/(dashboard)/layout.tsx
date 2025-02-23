import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import UserDropdown from "@/components/Navbar/UserDropdown";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { id: userId },
    include: {
      notifications: {
        where: { read: false },
        select: { id: true },
      },
    },
  });

  if (!adminUser?.name || !adminUser?.profileImage) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300"
                >
                  Dashboard
                </Link>
                <Link
                  href="/members"
                  className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300"
                >
                  Members
                </Link>
                <Link
                  href="/blogs"
                  className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300"
                >
                  News
                </Link>
                <Link
                  href="/events"
                  className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300"
                >
                  Events
                </Link>
                <Link
                  href="/donations"
                  className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300"
                >
                  Donations
                </Link>
                <Link
                  href="/forums"
                  className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300"
                >
                  Forums
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <UserDropdown
                user={{
                  name: adminUser.name,
                  profileImage: adminUser.profileImage,
                }}
                unreadNotifications={adminUser.notifications.length}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">{children}</div>
      </main>
    </div>
  );
}
