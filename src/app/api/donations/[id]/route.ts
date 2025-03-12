import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const donation = await prisma.donation.findUnique({
      where: { id: params.id },
    });

    if (!donation || donation.adminId !== userId) {
      return new NextResponse("Not found", { status: 404 });
    }

    return NextResponse.json(donation);
  } catch (error) {
    console.error("[DONATION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const donation = await prisma.donation.findUnique({
      where: { id: params.id },
    });

    if (!donation || donation.adminId !== userId) {
      return new NextResponse("Not found", { status: 404 });
    }

    const { name, description, thumbnail, goal, endDate } = await request.json();

    const updatedDonation = await prisma.donation.update({
      where: { id: params.id },
      data: {
        name,
        description,
        thumbnail,
        goal: goal || null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(updatedDonation);
  } catch (error) {
    console.error("[DONATION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const donation = await prisma.donation.findUnique({
      where: { id: params.id },
    });

    if (!donation || donation.adminId !== userId) {
      return new NextResponse("Not found", { status: 404 });
    }

    await prisma.donation.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DONATION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}