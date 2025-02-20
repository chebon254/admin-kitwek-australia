import { auth } from '@clerk/nextjs/server';
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.update({
      where: { id: context.params.id },
      data: {
        revokeStatus: false,
        revokeReason: null,
      },
    });

    return Response.json(user);
  } catch (error) {
    console.error("[MEMBER_APPROVE]", error);
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}