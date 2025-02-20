import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, description, thumbnail, date, location, capacity, isPaid, price } = await req.json();

    const event = await prisma.event.create({
      data: {
        title,
        description,
        thumbnail,
        date: new Date(date),
        location,
        capacity,
        isPaid,
        price,
        status: "UPCOMING",
        adminId: userId,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("[EVENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const events = await prisma.event.findMany({
      where: { adminId: userId },
      include: {
        attendees: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("[EVENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}