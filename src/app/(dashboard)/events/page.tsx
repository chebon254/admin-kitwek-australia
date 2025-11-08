import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoadingLink } from "@/components/ui/LoadingLink";
import { EventsList } from "@/components/events/EventsList";

export default async function EventsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const events = await prisma.event.findMany({
    where: { adminId: userId },
    include: {
      _count: {
        select: { attendees: true }
      },
      attendees: {
        select: {
          paid: true,
          amount: true
        }
      }
    },
    orderBy: { date: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Events Management</h1>
        <LoadingLink
          href="/events/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md inline-flex items-center gap-2"
        >
          <span>Create New Event</span>
        </LoadingLink>
      </div>

      <EventsList events={events} />
    </div>
  );
}
