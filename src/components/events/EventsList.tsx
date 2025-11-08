"use client";

import Image from "next/image";
import { Calendar, Users, DollarSign, Clock, Pencil } from "lucide-react";
import { DeleteButton } from "@/components/Delete/DeleteButton";
import { LoadingLink } from "@/components/ui/LoadingLink";

interface Event {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  date: Date;
  location: string;
  capacity: number;
  isPaid: boolean;
  price?: number | null;
  status: string;
  _count: {
    attendees: number;
  };
  attendees: Array<{
    paid: boolean;
    amount: number | null;
  }>;
}

interface EventsListProps {
  events: Event[];
}

export function EventsList({ events }: EventsListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h2>
        <p className="text-gray-600 mb-4">Start by creating your first event.</p>
        <LoadingLink
          href="/events/new"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          Create an Event →
        </LoadingLink>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => {
        const totalRevenue = event.attendees.reduce((sum, attendee) =>
          sum + (attendee.amount || 0), 0
        );
        const paidAttendees = event.attendees.filter(a => a.paid).length;

        return (
          <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-200">
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
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
              <p className="text-gray-600 line-clamp-2 mb-4">{event.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {event.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {paidAttendees} / {event.capacity} attendees
                </div>
                {event.isPaid && (
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Revenue: ${totalRevenue.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-2 items-center">
                  <LoadingLink
                    href={`/events/${event.id}/edit`}
                    className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-colors"
                    showLoader={false}
                  >
                    <Pencil className="h-5 w-5" />
                  </LoadingLink>
                  <DeleteButton id={event.id} type="event" />
                </div>
                <LoadingLink
                  href={`/events/${event.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View Details
                </LoadingLink>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
