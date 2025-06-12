import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Vote, Users, Calendar, Eye } from "lucide-react";
import { DeleteButton } from "@/components/Delete/DeleteButton";

// Define the props with promises as required by Next.js 14
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function VotingCampaignsPage(props: {
  searchParams: SearchParams
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  // Await the searchParams promise
  const searchParams = await props.searchParams;
  const filter = searchParams.filter as string || 'all';
  
  const campaigns = await prisma.votingCampaign.findMany({
    where: {
      adminId: userId,
      ...(filter !== 'all' ? { status: filter.toUpperCase() } : {}),
    },
    include: {
      candidates: true,
      votes: true,
      _count: {
        select: {
          candidates: true,
          votes: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'bg-blue-100 text-blue-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ELECTION': return '🗳️';
      case 'DECISION': return '🤔';
      case 'POLL': return '📊';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Voting Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage elections, polls, and decision-making campaigns</p>
        </div>
        <Link
          href="/voting/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Vote className="w-4 h-4" />
          Create Campaign
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/voting"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Vote className="w-4 h-4" />
            All Campaigns
          </Link>
          <Link
            href="/voting?filter=upcoming"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Upcoming
          </Link>
          <Link
            href="/voting?filter=active"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Active
          </Link>
          <Link
            href="/voting?filter=completed"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              filter === 'completed'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            Completed
          </Link>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Vote className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Voting Campaigns Yet</h2>
          <p className="text-gray-600 mb-4">
            Create your first campaign to start collecting votes on elections, decisions, or polls.
          </p>
          <Link
            href="/voting/new"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <Vote className="w-4 h-4" />
            Create Your First Campaign →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {campaign.thumbnail ? (
                <div className="relative h-48">
                  <div className="absolute top-2 left-2 z-10 flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                    <span className="bg-white px-2 py-1 rounded-full text-xs font-medium">
                      {getTypeIcon(campaign.type)} {campaign.type}
                    </span>
                  </div>
                  <Image
                    src={campaign.thumbnail}
                    alt={campaign.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">{getTypeIcon(campaign.type)}</div>
                    <div className="flex gap-2 justify-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                      <span className="bg-white px-2 py-1 rounded-full text-xs font-medium">
                        {campaign.type}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 line-clamp-2">{campaign.title}</h3>
                <p className="text-gray-600 line-clamp-3 mb-4">{campaign.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex justify-between">
                    <span>Start Date:</span>
                    <span>{new Date(campaign.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>End Date:</span>
                    <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Candidates:</span>
                    <span className="font-medium">{campaign._count.candidates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Votes:</span>
                    <span className="font-medium text-blue-600">{campaign._count.votes}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Link
                      href={`/voting/${campaign.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </Link>
                    <DeleteButton id={campaign.id} type="voting-campaign" />
                  </div>
                  <Link
                    href={`/voting/${campaign.id}`}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}