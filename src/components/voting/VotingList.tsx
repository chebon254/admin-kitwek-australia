"use client";

import Image from "next/image";
import { Vote } from "lucide-react";
import { DeleteButton } from "@/components/Delete/DeleteButton";
import { LoadingLink } from "@/components/ui/LoadingLink";

interface VotingCampaign {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  status: string;
  type: string;
  startDate: Date;
  endDate: Date;
  _count: {
    candidates: number;
    votes: number;
  };
}

interface VotingListProps {
  campaigns: VotingCampaign[];
}

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

export function VotingList({ campaigns }: VotingListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <Vote className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Voting Campaigns Yet</h2>
        <p className="text-gray-600 mb-4">
          Create your first campaign to start collecting votes on elections, decisions, or polls.
        </p>
        <LoadingLink
          href="/voting/new"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          <Vote className="w-4 h-4" />
          Create Your First Campaign →
        </LoadingLink>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <div key={campaign.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-200">
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
              <div className="flex gap-2 items-center">
                <LoadingLink
                  href={`/voting/${campaign.id}/edit`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  Edit
                </LoadingLink>
                <DeleteButton id={campaign.id} type="voting-campaign" />
              </div>
              <LoadingLink
                href={`/voting/${campaign.id}`}
                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                View Details
              </LoadingLink>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
