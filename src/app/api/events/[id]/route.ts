import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: (await params).id },
    });

    if (!event || event.adminId !== userId) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("[EVENT_GET]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: (await params).id },
    });

    if (!event || event.adminId !== userId) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    const { title, description, thumbnail, date, location, capacity, isPaid, price, status, visibility } = await request.json();

    const updatedEvent = await prisma.event.update({
      where: { id: (await params).id },
      data: {
        title,
        description,
        thumbnail,
        date: new Date(date),
        location,
        capacity,
        isPaid,
        price,
        status,
        visibility: visibility || "PUBLIC",
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("[EVENT_PATCH]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string } >}
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const eventId = (await params).id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.adminId !== userId) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    // Delete event and related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete all attendees for tickets of this event
      const tickets = await tx.ticket.findMany({
        where: { eventId: eventId },
        select: { id: true },
      });

      const ticketIds = tickets.map(t => t.id);

      if (ticketIds.length > 0) {
        await tx.eventAttendee.deleteMany({
          where: { ticketId: { in: ticketIds } },
        });
      }

      // Delete all tickets for this event
      await tx.ticket.deleteMany({
        where: { eventId: eventId },
      });

      // Delete the event
      await tx.event.delete({
        where: { id: eventId },
      });
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: "DELETE_EVENT",
        details: `Deleted event: ${event.title}`,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[EVENT_DELETE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete event" },
      { status: 500 }
    );
  }
}
