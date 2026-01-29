"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { LoadingLink } from "@/components/ui/LoadingLink";
import toast from "react-hot-toast";
import { SuccessNotification } from "@/components/SuccessNotification";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditWelfareVotingCampaignPage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [campaignId, setCampaignId] = useState<string>("");

  // Campaign details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("ELECTION");
  const [status, setStatus] = useState("UPCOMING");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [votesCount, setVotesCount] = useState(0);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const { id } = await params;
        setCampaignId(id);
        const response = await fetch(`/api/welfare-voting/campaigns/${id}`);
        if (!response.ok) throw new Error("Campaign not found");
        const campaign = await response.json();

        setTitle(campaign.title);
        setDescription(campaign.description);
        setType(campaign.type);
        setStatus(campaign.status);
        setStartDate(new Date(campaign.startDate).toISOString().slice(0, 16));
        setEndDate(new Date(campaign.endDate).toISOString().slice(0, 16));
        setCandidatesCount(campaign._count.candidates);
        setVotesCount(campaign._count.votes);
      } catch (error) {
        console.error("Error fetching campaign:", error);
        toast.error("Failed to load campaign");
        router.push("/welfare-voting");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/welfare-voting/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update welfare voting campaign");
      }

      setShowSuccess(true);
      toast.success("Campaign status updated successfully!");
      setTimeout(() => {
        router.push(`/welfare-voting/${campaignId}`);
      }, 2000);
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update campaign");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LoadingLink href={`/welfare-voting/${campaignId}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </LoadingLink>
        <h1 className="text-2xl font-bold">Edit Welfare Voting Campaign</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Currently, you can only update the campaign status.
            To modify campaign details or candidates, please delete and create a new campaign.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Details (Read-only) */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Campaign Details (Read-only)</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={title}
                  className="w-full p-2 border rounded-md bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Type
                </label>
                <input
                  type="text"
                  value={type}
                  className="w-full p-2 border rounded-md bg-gray-100"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                className="w-full p-2 border rounded-md h-24 bg-gray-100"
                disabled
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  className="w-full p-2 border rounded-md bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  className="w-full p-2 border rounded-md bg-gray-100"
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Candidates
                </label>
                <input
                  type="text"
                  value={candidatesCount}
                  className="w-full p-2 border rounded-md bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Votes
                </label>
                <input
                  type="text"
                  value={votesCount}
                  className="w-full p-2 border rounded-md bg-gray-100"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Editable Status */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Editable Settings</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={saving}
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Change the campaign status to control voting availability.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t">
            <div className="flex gap-4">
              <LoadingLink
                href={`/welfare-voting/${campaignId}`}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-md hover:bg-gray-200 transition text-center"
              >
                Cancel
              </LoadingLink>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Updating Campaign...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Update Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {showSuccess && (
          <SuccessNotification
            message="Welfare voting campaign updated successfully! Redirecting..."
            onClose={() => setShowSuccess(false)}
          />
        )}
      </div>
    </div>
  );
}
