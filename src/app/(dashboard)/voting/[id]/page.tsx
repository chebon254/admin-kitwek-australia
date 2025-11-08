"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { LoadingLink } from "@/components/ui/LoadingLink";
import { ArrowLeft, Users, Calendar, Trophy, Vote, Edit, Eye, Clock, Share2, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Candidate {
  id: string;
  name: string;
  description: string | null;
  position: string | null;
  manifesto: string | null;
  image: string | null;
  _count: {
    votes: number;
  };
}

interface VoteRecord {
  id: string;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  candidate: {
    name: string;
  };
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  thumbnail: string | null;
  adminId: string;
  candidates: Candidate[];
  votes: VoteRecord[];
  _count: {
    votes: number;
    candidates: number;
  };
}

export default function VotingCampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const campaignId = params.id as string;

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/voting/campaigns/${campaignId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Campaign not found");
          }
          throw new Error("Failed to fetch campaign");
        }
        
        const data = await response.json();
        setCampaign(data);
      } catch (error) {
        console.error("Error fetching campaign:", error);
        setError(error instanceof Error ? error.message : "Failed to load campaign");
        toast.error(error instanceof Error ? error.message : "Failed to load campaign");
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

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

  const getVotePercentage = (votes: number, totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const copyVotingLink = async () => {
    const publicVoteUrl = `${window.location.origin}/vote/${campaignId}`;
    try {
      await navigator.clipboard.writeText(publicVoteUrl);
      toast.success("Voting link copied to clipboard!");
    } catch (error) {
      console.error("Error updating forum:", error);
      toast.error("Failed to copy link");
    }
  };

  const openVotingPreview = () => {
    const publicVoteUrl = `${window.location.origin}/vote/${campaignId}`;
    window.open(publicVoteUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">{error || 'Campaign not found'}</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please try again or go back to the campaign list.
        </p>
        <div className="mt-6">
          <LoadingLink
            href="/voting"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Campaigns
          </LoadingLink>
        </div>
      </div>
    );
  }

  const totalVotes = campaign._count.votes;
  const winner = campaign.candidates[0]; // First candidate (highest votes due to ordering)
  const isCompleted = campaign.status === 'COMPLETED';
  const isActive = campaign.status === 'ACTIVE';
  const publicVoteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/vote/${campaign.id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LoadingLink href="/voting" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </LoadingLink>
        <h1 className="text-2xl font-bold">Campaign Details</h1>
      </div>

      {/* Campaign Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {campaign.thumbnail ? (
          <div className="relative h-64 w-full">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
              <span className="bg-white px-3 py-1 rounded-full text-sm font-medium">
                {getTypeIcon(campaign.type)} {campaign.type}
              </span>
            </div>
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <LoadingLink
                href={`/voting/${campaign.id}/edit`}
                className="bg-white text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit
              </LoadingLink>
              <button
                onClick={copyVotingLink}
                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition flex items-center gap-1"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
            <Image
              src={campaign.thumbnail}
              alt={campaign.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <LoadingLink
                href={`/voting/${campaign.id}/edit`}
                className="bg-white text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit
              </LoadingLink>
              <button
                onClick={copyVotingLink}
                className="bg-white text-blue-600 px-3 py-1 rounded-md hover:bg-gray-100 transition flex items-center gap-1"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
            <div className="text-center text-white">
              <div className="text-4xl mb-2">{getTypeIcon(campaign.type)}</div>
              <div className="flex gap-2 justify-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
                <span className="bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                  {campaign.type}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{campaign.title}</h2>
              <p className="text-gray-600 text-lg mb-4">{campaign.description}</p>
              
              {/* Public Voting Link */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <h3 className="font-medium text-blue-900 mb-1">Public Voting Link</h3>
                    <p className="text-blue-700 text-sm break-all">{publicVoteUrl}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyVotingLink}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition text-sm"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={openVotingPreview}
                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition text-sm flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Start Date</div>
              <div className="font-semibold">{new Date(campaign.startDate).toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">{new Date(campaign.startDate).toLocaleTimeString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Clock className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <div className="text-sm text-gray-600">End Date</div>
              <div className="font-semibold">{new Date(campaign.endDate).toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">{new Date(campaign.endDate).toLocaleTimeString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Candidates</div>
              <div className="text-2xl font-bold">{campaign._count.candidates}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Vote className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Total Votes</div>
              <div className="text-2xl font-bold text-purple-600">{totalVotes}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Announcement (if completed) */}
      {isCompleted && totalVotes > 0 && winner && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 mr-2" />
            <h2 className="text-2xl font-bold">
              {campaign.type === 'ELECTION' ? 'Election Winner' : 
               campaign.type === 'DECISION' ? 'Winning Option' : 'Top Choice'}
            </h2>
          </div>
          <div className="text-center">
            {winner.image && (
              <div className="relative h-20 w-20 rounded-full overflow-hidden mx-auto mb-4">
                <Image
                  src={winner.image}
                  alt={winner.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <h3 className="text-3xl font-bold mb-2">{winner.name}</h3>
            {winner.position && (
              <p className="text-xl mb-2">{winner.position}</p>
            )}
            <p className="text-lg">
              {winner._count.votes} votes ({getVotePercentage(winner._count.votes, totalVotes)}%)
            </p>
          </div>
        </div>
      )}

      {/* Results/Candidates */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">
          {isCompleted ? 'Final Results' : isActive ? 'Current Results' : 'Candidates/Options'}
        </h3>
        
        <div className="space-y-4">
          {campaign.candidates.map((candidate, index) => {
            const voteCount = candidate._count.votes;
            const percentage = getVotePercentage(voteCount, totalVotes);
            const isWinner = isCompleted && index === 0 && voteCount > 0;
            
            return (
              <div 
                key={candidate.id} 
                className={`border rounded-lg p-4 ${isWinner ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}
              >
                <div className="flex items-start gap-4">
                  {candidate.image && (
                    <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={candidate.image}
                        alt={candidate.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold">{candidate.name}</h4>
                        {isWinner && <Trophy className="h-5 w-5 text-yellow-500" />}
                        {index === 0 && !isCompleted && totalVotes > 0 && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Leading
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{voteCount} votes</div>
                        {totalVotes > 0 && (
                          <div className="text-sm text-gray-600">{percentage}%</div>
                        )}
                      </div>
                    </div>
                    
                    {candidate.position && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Position:</strong> {candidate.position}
                      </p>
                    )}
                    
                    {candidate.description && (
                      <p className="text-gray-700 mb-2">{candidate.description}</p>
                    )}
                    
                    {candidate.manifesto && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Platform/Manifesto:</p>
                        <p className="text-sm text-gray-600">{candidate.manifesto}</p>
                      </div>
                    )}
                    
                    {/* Vote Progress Bar */}
                    {totalVotes > 0 && (
                      <div className="mt-3">
                        <div className="bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${
                              isWinner ? 'bg-yellow-400' : 'bg-blue-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vote History (if there are votes) */}
      {campaign.votes.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">Recent Votes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voted For
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaign.votes.slice(0, 10).map((vote) => (
                  <tr key={vote.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {vote.user.firstName} {vote.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{vote.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vote.candidate.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(vote.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(vote.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campaign.votes.length > 10 && (
              <div className="text-center py-4 text-gray-500">
                ... and {campaign.votes.length - 10} more votes
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Votes Yet */}
      {campaign.votes.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Vote className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Votes Yet</h3>
          <p className="text-gray-600 mb-4">
            {campaign.status === 'UPCOMING' 
              ? 'Voting will begin when the campaign starts.'
              : campaign.status === 'ACTIVE'
              ? 'Share the public voting link to start collecting votes!'
              : 'This campaign has ended without any votes.'}
          </p>
          {(campaign.status === 'ACTIVE' || campaign.status === 'UPCOMING') && (
            <button
              onClick={copyVotingLink}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Copy Voting Link
            </button>
          )}
        </div>
      )}
    </div>
  );
}