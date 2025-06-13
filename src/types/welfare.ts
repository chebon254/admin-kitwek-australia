export interface WelfareUser {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  memberNumber: string | null;
  membershipStatus: string;
}

export interface WelfareRegistrationWithUser {
  id: string;
  userId: string;
  registrationFee: number;
  paymentStatus: string;
  registrationDate: Date;
  stripePaymentId: string | null;
  status: string;
  activatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: WelfareUser;
}

export interface WelfareApplicationUser {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  memberNumber: string | null;
}

export interface WelfareBeneficiary {
  id: string;
  applicationId: string;
  fullName: string;
  relationship: string;
  phone: string | null;
  email: string | null;
  idNumber: string | null;
  createdAt: Date;
}

export interface WelfareDocument {
  id: string;
  applicationId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: Date;
}

export interface WelfareApplicationWithDetails {
  id: string;
  userId: string;
  applicationType: string;
  deceasedName: string;
  relationToDeceased: string | null;
  reasonForApplication: string;
  status: string;
  claimAmount: number;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  payoutDate: Date | null;
  reimbursementDue: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: WelfareApplicationUser;
  beneficiaries: WelfareBeneficiary[];
  documents: WelfareDocument[];
}

export interface WelfareReimbursementUser {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  memberNumber: string | null;
}

export interface WelfareReimbursementApplication {
  id: string;
  deceasedName: string;
  applicationType: string;
  claimAmount: number;
}

export interface WelfareReimbursementWithDetails {
  id: string;
  userId: string;
  applicationId: string;
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: WelfareReimbursementUser;
  application: WelfareReimbursementApplication;
}