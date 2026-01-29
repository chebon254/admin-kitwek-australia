import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Vote, ArrowLeft } from "lucide-react";
import { LoadingLink } from "@/components/ui/LoadingLink";
import { WelfareVotingList } from "@/components/welfare-voting/WelfareVotingList";
import { WelfareVotingFilters } from "@/components/welfare-voting/WelfareVotingFilters";

// Define the props with promises as required by Next.js 14
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function WelfareVotingCampaignsPage(props: {
  searchParams: SearchParams
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Await the searchParams promise
  const searchParams = await props.searchParams;
  const filter = searchParams.filter as string || 'all';

  const campaigns = await prisma.welfareVotingCampaign.findMany({
    where: {
      ...(filter !== 'all' ? { status: filter.toUpperCase() } : {}),
    },
    include: {
      candidates: {
        include: {
          _count: {
            select: { votes: true },
          },
        },
      },
      _count: {
        select: {
          candidates: true,
          votes: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <LoadingLink
          href="/welfare"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Welfare Dashboard
        </LoadingLink>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Welfare Voting Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage welfare elections, polls, and decision-making campaigns</p>
        </div>
        <LoadingLink
          href="/welfare-voting/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md inline-flex items-center gap-2"
        >
          <Vote className="w-4 h-4" />
          <span>Create Campaign</span>
        </LoadingLink>
      </div>

      <WelfareVotingFilters currentFilter={filter} />

      <WelfareVotingList campaigns={campaigns} />
    </div>
  );
}
