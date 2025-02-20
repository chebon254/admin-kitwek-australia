import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Users, DollarSign, Clock } from "lucide-react";

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
        <Link
          href="/events/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create New Event
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const totalRevenue = event.attendees.reduce((sum, attendee) => 
            sum + (attendee.amount || 0), 0
          );
          const paidAttendees = event.attendees.filter(a => a.paid).length;
          const now = new Date();
          const eventDate = new Date(event.date);
          const isUpcoming = eventDate > now;
          const isPast = eventDate < now;

          return (
            <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={event.thumbnail}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-sm font-medium ${
                  event.status === 'UPCOMING' ? 'bg-blue-500 text-white' :
                  event.status === 'ONGOING' ? 'bg-green-500 text-white' :
                  event.status === 'COMPLETED' ? 'bg-gray-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  {event.status}
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
                <p className="text-gray-600 line-clamp-2 mb-4">{event.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                    <div className="text-sm font-medium text-gray-600">Attendees</div>
                    <div className="text-lg font-semibold">
                      {event._count.attendees}/{event.capacity}
                    </div>
                  </div>
                  {event.isPaid && (
                    <>
                      <div className="text-center">
                        <DollarSign className="h-5 w-5 mx-auto text-green-600 mb-1" />
                        <div className="text-sm font-medium text-gray-600">Revenue</div>
                        <div className="text-lg font-semibold">${totalRevenue}</div>
                      </div>
                      <div className="text-center">
                        <Users className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                        <div className="text-sm font-medium text-gray-600">Paid</div>
                        <div className="text-lg font-semibold">{paidAttendees}</div>
                      </div>
                    </>
                  )}
                </div>

                {event.capacity > 0 && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min((event._count.attendees / event.capacity) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {event._count.attendees} of {event.capacity} spots filled
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${
                    event.status === 'CANCELLED' ? 'text-red-600' :
                    event.status === 'COMPLETED' ? 'text-gray-600' :
                    'text-green-600'
                  }`}>
                    {event.status}
                  </span>
                  <Link
                    href={`/events/${event.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}