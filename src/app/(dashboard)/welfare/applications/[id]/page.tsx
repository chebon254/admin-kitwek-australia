import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  User,
  DollarSign,
  Phone,
  Mail,
  Download,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { WelfareApplicationActions } from "@/components/welfare/WelfareApplicationActions";
import { DocumentImagePreview } from "@/components/welfare/DocumentImagePreview";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function WelfareApplicationDetailPage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;

  const application = await prisma.welfareApplication.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          memberNumber: true,
          phone: true,
          membershipStatus: true,
        },
      },
      beneficiaries: true,
      documents: true,
    },
  });

  if (!application) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
      PAID: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return (
      badges[status as keyof typeof badges] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-5 w-5" />;
      case "APPROVED":
        return <CheckCircle className="h-5 w-5" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5" />;
      case "PAID":
        return <DollarSign className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return "🖼️";
    }
    if (["pdf"].includes(extension || "")) {
      return "📄";
    }
    return "📎";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/welfare/applications"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Application Review</h1>
            <p className="text-gray-600 mt-1">
              Application for {application.deceasedName}
            </p>
          </div>
        </div>
        <div
          className={`inline-flex items-center gap-2 px-3 py-2 border rounded-full ${getStatusBadge(
            application.status
          )}`}
        >
          {getStatusIcon(application.status)}
          <span className="font-medium">{application.status}</span>
        </div>
      </div>

      {/* Application Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Application Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Application Type
                </label>
                <div className="mt-1">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      application.applicationType === "MEMBER_DEATH"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {application.applicationType === "MEMBER_DEATH"
                      ? "Member Death"
                      : "Family Death"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Deceased Person
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {application.deceasedName}
                </p>
              </div>

              {application.relationToDeceased && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Relationship to Deceased
                  </label>
                  <p className="mt-1 text-gray-900 capitalize">
                    {application.relationToDeceased}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Reason for Application
                </label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                  {application.reasonForApplication}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Application Date
                  </label>
                  <p className="mt-1 text-gray-900">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Claim Amount
                  </label>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    ${application.claimAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {application.approvedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Approved Date
                  </label>
                  <p className="mt-1 text-gray-900">
                    {new Date(application.approvedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {application.rejectedAt && application.rejectionReason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Rejection Date
                  </label>
                  <p className="mt-1 text-gray-900">
                    {new Date(application.rejectedAt).toLocaleDateString()}
                  </p>
                  <label className="text-sm font-medium text-gray-500 mt-3 block">
                    Rejection Reason
                  </label>
                  <p className="mt-1 text-red-600">
                    {application.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">
              Applicant Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {application.user?.firstName && application.user?.lastName
                      ? `${application.user.firstName} ${application.user.lastName}`
                      : application.user?.username || "N/A"}
                  </p>
                  {application.user?.memberNumber && (
                    <p className="text-sm text-gray-500">
                      Member: {application.user.memberNumber}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <p className="text-gray-900">{application.user?.email}</p>
              </div>

              {application.user?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <p className="text-gray-900">{application.user.phone}</p>
                </div>
              )}

              <div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    application.user?.membershipStatus === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {application.user?.membershipStatus || "Unknown"} Member
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beneficiaries */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Beneficiaries ({application.beneficiaries.length})
          </h3>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Pre-saved Family
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {application.beneficiaries.map((beneficiary, index) => (
            <div key={beneficiary.id} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Beneficiary {index + 1}
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Full Name
                  </label>
                  <p className="text-gray-900">{beneficiary.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Relationship
                  </label>
                  <p className="text-gray-900">{beneficiary.relationship}</p>
                </div>
                {beneficiary.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Phone
                    </label>
                    <p className="text-gray-900">{beneficiary.phone}</p>
                  </div>
                )}
                {beneficiary.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Email
                    </label>
                    <p className="text-gray-900">{beneficiary.email}</p>
                  </div>
                )}
                {beneficiary.idNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      ID Number
                    </label>
                    <p className="text-gray-900">{beneficiary.idNumber}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supporting Documents */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Supporting Documents ({application.documents.length})
        </h3>
        {application.documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {application.documents.map((document) => {
              const isImageFile = [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp",
              ].includes(
                document.fileName.split(".").pop()?.toLowerCase() || ""
              );

              return (
                <div
                  key={document.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getFileIcon(document.fileName)}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm break-words">
                          {document.fileName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {document.fileType.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">
                      Uploaded:{" "}
                      {new Date(document.uploadedAt).toLocaleDateString()}
                    </p>

                    <div className="flex gap-2">
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>

                      {document.fileName.toLowerCase().includes(".pdf") && (
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition"
                        >
                          <FileText className="h-4 w-4" />
                          View
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Image preview for image files */}
                  {isImageFile && (
                    <DocumentImagePreview
                      src={document.fileUrl}
                      alt={document.fileName}
                      fileName={document.fileName}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No documents uploaded
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Application Actions</h3>
        <WelfareApplicationActions application={application} />
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Application Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Application Submitted</p>
              <p className="text-sm text-gray-500">
                {new Date(application.createdAt).toLocaleDateString()} at{" "}
                {new Date(application.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {application.approvedAt && (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Application Approved
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(application.approvedAt).toLocaleDateString()} at{" "}
                  {new Date(application.approvedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}

          {application.rejectedAt && (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Application Rejected
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(application.rejectedAt).toLocaleDateString()} at{" "}
                  {new Date(application.rejectedAt).toLocaleTimeString()}
                </p>
                {application.rejectionReason && (
                  <p className="text-sm text-red-600 mt-1">
                    Reason: {application.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          )}

          {application.payoutDate && (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Payment Processed</p>
                <p className="text-sm text-gray-500">
                  {new Date(application.payoutDate).toLocaleDateString()} at{" "}
                  {new Date(application.payoutDate).toLocaleTimeString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Amount: ${application.claimAmount.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
