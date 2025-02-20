import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MemberDetail from "@/components/members/MemberDetail";

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Await the params before using them
  const { id } = await params;

  const member = await prisma.user.findUnique({
    where: { id },
  });

  if (!member) {
    redirect("/members");
  }

  return <MemberDetail member={member} />;
}
