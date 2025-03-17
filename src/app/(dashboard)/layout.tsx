import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/DashboardNav";

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
      <DashboardNav 
        user={{
          name: adminUser.name,
          profileImage: adminUser.profileImage,
        }}
        unreadNotifications={adminUser.notifications.length}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">{children}</div>
      </main>
    </div>
  );
}