"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Upload, Save, Trash2 } from "lucide-react";
import { LoadingLink } from "@/components/ui/LoadingLink";
import Image from "next/image";
import toast from "react-hot-toast";
import { uploadFile } from "@/lib/uploadFile";
import { SuccessNotification } from "@/components/SuccessNotification";

interface Candidate {
  id: string;
  name: string;
  description: string;
  position: string;
  manifesto: string;
  image: string | null;
  imageFile?: File;
  imagePreview?: string;
  isNew?: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditVotingCampaignPage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [campaignId, setCampaignId] = useState<string>("");

  // Campaign details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("ELECTION");
  const [status, setStatus] = useState("UPCOMING");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [currentThumbnail, setCurrentThumbnail] = useState("");

  // Candidates
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [deletedCandidateIds, setDeletedCandidateIds] = useState<string[]>([]);

  // New candidate form
  const [newCandidate, setNewCandidate] = useState<Candidate>({
    id: "",
    name: "",
    description: "",
    position: "",
    manifesto: "",
    image: null,
    imagePreview: "",
    isNew: true,
  });

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const { id } = await params;
        setCampaignId(id);
        const response = await fetch(`/api/voting/campaigns/${id}`);
        if (!response.ok) throw new Error("Campaign not found");
        const campaign = await response.json();

        setTitle(campaign.title);
        setDescription(campaign.description);
        setType(campaign.type);
        setStatus(campaign.status);
        setStartDate(new Date(campaign.startDate).toISOString().slice(0, 16));
        setEndDate(new Date(campaign.endDate).toISOString().slice(0, 16));
        setCurrentThumbnail(campaign.thumbnail || "");
        setThumbnailPreview(campaign.thumbnail || "");
        setCandidates(campaign.candidates || []);
      } catch (error) {
        console.error("Error fetching campaign:", error);
        toast.error("Failed to load campaign");
        router.push("/voting");
      }
    };

    fetchCampaign();
  }, [params, router]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCandidateImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCandidate(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addCandidate = () => {
    if (!newCandidate.name.trim()) {
      toast.error("Candidate name is required");
      return;
    }

    const candidate: Candidate = {
      ...newCandidate,
      id: `new_${Date.now()}`,
      isNew: true,
    };

    setCandidates(prev => [...prev, candidate]);
    setNewCandidate({
      id: "",
      name: "",
      description: "",
      position: "",
      manifesto: "",
      image: null,
      imagePreview: "",
      isNew: true,
    });
    setShowCandidateForm(false);
    toast.success("Candidate added successfully");
  };

  const removeCandidate = (id: string) => {
    const candidate = candidates.find(c => c.id === id);
    if (candidate && !candidate.isNew) {
      // Mark existing candidate for deletion
      setDeletedCandidateIds(prev => [...prev, id]);
    }
    setCandidates(prev => prev.filter(c => c.id !== id));
    toast.success("Candidate removed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeCandidates = candidates.filter(c => !deletedCandidateIds.includes(c.id));
    
    if (activeCandidates.length < 2) {
      toast.error("Please have at least 2 candidates");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      setLoading(true);

      // Upload campaign thumbnail if changed
      let thumbnailUrl = currentThumbnail;
      if (thumbnail) {
        thumbnailUrl = await uploadFile(thumbnail, "voting-campaigns");
      }

      // Process candidates: upload new images and prepare data
      const candidateData = await Promise.all(
        activeCandidates.map(async (candidate) => {
          let imageUrl = candidate.image;
          
          if (candidate.imageFile) {
            imageUrl = await uploadFile(candidate.imageFile, "voting-candidates");
          }

          return {
            id: candidate.isNew ? undefined : candidate.id,
            name: candidate.name,
            description: candidate.description || null,
            position: candidate.position || null,
            manifesto: candidate.manifesto || null,
            image: imageUrl || null,
          };
        })
      );

      const response = await fetch(`/api/voting/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          status,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          thumbnail: thumbnailUrl || null,
          candidates: candidateData,
          deletedCandidateIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update voting campaign");
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/voting/${campaignId}`);
      }, 5000);
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LoadingLink href={`/voting/${campaignId}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </LoadingLink>
        <h1 className="text-2xl font-bold">Edit Voting Campaign</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Campaign Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                >
                  <option value="ELECTION">Election (People voting for leaders)</option>
                  <option value="DECISION">Decision (Vote on specific actions)</option>
                  <option value="POLL">Poll (General opinion gathering)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Thumbnail
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="w-full mb-4"
                disabled={loading}
              />
              {thumbnailPreview && (
                <div className="relative h-32 w-48 rounded-lg overflow-hidden">
                  <Image
                    src={thumbnailPreview}
                    alt="Campaign thumbnail"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Candidates Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-semibold">
                Candidates/Options ({candidates.filter(c => !deletedCandidateIds.includes(c.id)).length})
              </h2>
              <button
                type="button"
                onClick={() => setShowCandidateForm(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition"
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                Add {type === 'DECISION' ? 'Option' : 'Candidate'}
              </button>
            </div>

            {/* Current Candidates */}
            {candidates.filter(c => !deletedCandidateIds.includes(c.id)).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidates
                  .filter(c => !deletedCandidateIds.includes(c.id))
                  .map((candidate) => (
                  <div key={candidate.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{candidate.name}</h3>
                      <button
                        type="button"
                        onClick={() => removeCandidate(candidate.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {(candidate.image || candidate.imagePreview) && (
                      <div className="relative h-16 w-16 rounded-md overflow-hidden mb-2">
                        <Image
                          src={candidate.imagePreview || candidate.image!}
                          alt={candidate.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    {candidate.position && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Position:</strong> {candidate.position}
                      </p>
                    )}
                    {candidate.description && (
                      <p className="text-sm text-gray-600">
                        {candidate.description}
                      </p>
                    )}
                    {candidate.isNew && (
                      <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mt-2">
                        New
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Candidate Form */}
            {showCandidateForm && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium mb-4">
                  Add New {type === 'DECISION' ? 'Option' : 'Candidate'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newCandidate.name}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={type === 'DECISION' ? 'Option name' : 'Candidate name'}
                      disabled={loading}
                    />
                  </div>

                  {type === 'ELECTION' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <input
                        type="text"
                        value={newCandidate.position}
                        onChange={(e) => setNewCandidate(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., President, Secretary, etc."
                        disabled={loading}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newCandidate.description}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-2 border rounded-md h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={type === 'DECISION' ? 'Describe this option' : 'Brief description of the candidate'}
                      disabled={loading}
                    />
                  </div>

                  {type === 'ELECTION' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Manifesto/Platform
                      </label>
                      <textarea
                        value={newCandidate.manifesto}
                        onChange={(e) => setNewCandidate(prev => ({ ...prev, manifesto: e.target.value }))}
                        className="w-full p-2 border rounded-md h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="What are their goals and plans?"
                        disabled={loading}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Photo (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCandidateImageChange}
                      className="w-full"
                      disabled={loading}
                    />
                    {newCandidate.imagePreview && (
                      <div className="relative h-20 w-20 rounded-md overflow-hidden mt-2">
                        <Image
                          src={newCandidate.imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addCandidate}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center gap-2"
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4" />
                      Add {type === 'DECISION' ? 'Option' : 'Candidate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCandidateForm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {candidates.filter(c => !deletedCandidateIds.includes(c.id)).length < 2 && (
              <div className="text-center py-8 text-gray-500">
                <p>Keep at least 2 {type === 'DECISION' ? 'options' : 'candidates'} for the campaign</p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t">
            <div className="flex gap-4">
              <LoadingLink
                href={`/voting/${campaignId}`}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-md hover:bg-gray-200 transition text-center"
              >
                Cancel
              </LoadingLink>
              <button
                type="submit"
                disabled={loading || candidates.filter(c => !deletedCandidateIds.includes(c.id)).length < 2}
                className="flex-1 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <Upload className="h-5 w-5 mr-2 animate-spin" />
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
            message="Voting campaign updated successfully! Redirecting..."
            onClose={() => setShowSuccess(false)}
          />
        )}
      </div>
    </div>
  );
}