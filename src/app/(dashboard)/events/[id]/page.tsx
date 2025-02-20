import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin, Users, AlertTriangle } from "lucide-react";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailPage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;
  
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      attendees: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!event || event.adminId !== userId) {
    redirect("/events");
  }

  const totalRevenue = event.attendees.reduce((sum, attendee) => 
    sum + (attendee.amount || 0), 0
  );
  const paidAttendees = event.attendees.filter(a => a.paid).length;
  const unpaidAttendees = event.attendees.length - paidAttendees;
  const spotsLeft = event.capacity - event.attendees.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Event Details</h1>
        <Link
          href="/events"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Events
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative h-[300px]">
              <Image
                src={event.thumbnail}
                alt={event.title}
                fill
                className="object-cover"
              />
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
                event.status === 'UPCOMING' ? 'bg-blue-500 text-white' :
                event.status === 'ONGOING' ? 'bg-green-500 text-white' :
                event.status === 'COMPLETED' ? 'bg-gray-500 text-white' :
                'bg-red-500 text-white'
              }`}>
                {event.status}
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
              <p className="text-gray-600 whitespace-pre-wrap mb-6">{event.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-600">Date</div>
                    <div>{new Date(event.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-600">Time</div>
                    <div>
                      {new Date(event.date).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-600">Location</div>
                    <div>{event.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-600">Capacity</div>
                    <div>{event.capacity} spots</div>
                  </div>
                </div>
              </div>

              {event.status === 'CANCELLED' && event.cancelReason && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <h3 className="font-medium">Event Cancelled</h3>
                  </div>
                  <p className="text-red-600">{event.cancelReason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Attendees</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    {event.isPaid && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {event.attendees.map((attendee) => (
                    <tr key={attendee.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{attendee.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{attendee.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{attendee.phone || '-'}</td>
                      {event.isPaid && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${attendee.amount?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              attendee.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {attendee.paid ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(attendee.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Event Statistics</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Attendance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{event.attendees.length}</div>
                    <div className="text-sm text-gray-600">Total Registered</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{spotsLeft}</div>
                    <div className="text-sm text-gray-600">Spots Left</div>
                  </div>
                </div>
                {event.capacity > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min((event.attendees.length / event.capacity) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {Math.round((event.attendees.length / event.capacity) * 100)}% capacity filled
                    </p>
                  </div>
                )}
              </div>

              {event.isPaid && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Payment Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{paidAttendees}</div>
                      <div className="text-sm text-gray-600">Paid</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{unpaidAttendees}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Registration Timeline</h3>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const date = new Date();
                    date.setDate(date.getDate() - index);
                    const registrationsOnDay = event.attendees.filter(
                      attendee => 
                        new Date(attendee.createdAt).toDateString() === date.toDateString()
                    ).length;
                    const percentage = (registrationsOnDay / event.attendees.length) * 100 || 0;
                    
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="text-sm text-gray-500 w-20">
                          {date.toLocaleDateString(undefined, { weekday: 'short' })}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-600 w-8">
                          {registrationsOnDay}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}