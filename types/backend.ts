// ============================================================
// Shared
// ============================================================

export type ContractStatus =
  | "DRAFT"
  | "INVITED"
  | "VIEWED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RESUBMISSION_REQUIRED"
  | "SIGNED"
  | "PDF_GENERATION_FAILED"
  | "EXPIRED"
  | "CANCELLED";

export type UserRole = "HR_REVIEWER" | "FINANCE" | "ADMIN";

export type RejectionCategory =
  | "NAME_MISMATCH"
  | "BLURRY_ID"
  | "EXPIRED_ID"
  | "MISSING_BACK_IMAGE"
  | "INVALID_BANK_INFO"
  | "OTHER";

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  requestId: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================================
// Upload (presigned S3)
// ============================================================

export interface PresignedUploadResponseData {
  uploadUrl: string;
  key: string;
  filename: string;
  contentType: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresIn: number;
}

// ============================================================
// Auth
// ============================================================

export interface StaffUserDto {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponseData {
  token: string;
  user: StaffUserDto;
}

// ============================================================
// Worker portal
// ============================================================

export interface WorkerSubmittedData {
  fullNameEnglish: string;
  fullNameAmharic?: string;
  residenceLocation: string;
  bankName: string;
  bankAccountHolderName: string;
  bankAccountNumber: string;
}

export interface WorkerRejectionFeedback {
  category: RejectionCategory;
  reasonEnglish: string;
  reasonAmharic?: string;
}

export interface WorkerContractViewDto {
  contractNumber: string;
  status: ContractStatus;
  roleTitle: string;
  ratePerTaskEtb: number;
  agreementDate: string;
  expiresAt: string;
  documentUrl: string;
  currentAttemptNumber: number;
  maxAttempts: number;
  rejectionFeedback?: WorkerRejectionFeedback;
  submittedData?: WorkerSubmittedData;
}

/** Form-layer payload — files are uploaded to S3 before the JSON submit call. */
export interface WorkerSubmitPayload {
  fullNameEnglish: string;
  fullNameAmharic?: string;
  residenceLocation: string;
  bankName: string;
  bankAccountHolderName: string;
  bankAccountNumber: string;
  faydaFront: File;
  faydaBack: File;
}

export interface WorkerSubmitRequestBody {
  fullNameEnglish: string;
  fullNameAmharic?: string;
  residenceLocation: string;
  bankName: string;
  bankAccountHolderName: string;
  bankAccountNumber: string;
  faydaFrontUrl: string;
  faydaBackUrl: string;
}

export interface WorkerSubmitResponseData {
  status: "PENDING_REVIEW";
  attemptNumber: number;
}

// ============================================================
// HR reviewer
// ============================================================

export interface ContractListItemDto {
  contractId: string;
  contractNumber: string;
  status: ContractStatus;
  candidateName?: string;
  /** Mirrors FinanceContractListItemDto.workerNameAmharic. Rendered when present. */
  candidateNameAmharic?: string;
  phone: string;
  currentAttemptNumber: number;
  bankAccountMasked?: string;
  bankName?: string;
  bankAccountHolderName?: string;
  submittedAt?: string;
  createdAt: string;
  /**
   * Reminder SMS bookkeeping. Absent until the backend ships the reminder
   * endpoints — read through `getReminderState`, which treats absence as
   * "never reminded" rather than blocking the action.
   */
  reminderCount?: number;
  lastReminderSentAt?: string;
  nextReminderAt?: string;
  /**
   * Signing-link expiry. Same graceful absence as the reminder fields — read
   * through `isRenewable`, which treats absence as "not expired" so a missing
   * timestamp can never offer a live-SMS action it cannot justify.
   */
  expiresAt?: string;
}

export interface AttemptSummaryDto {
  attemptId: string;
  attemptNumber: number;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  submittedData: {
    fullNameEnglish: string;
    fullNameAmharic?: string;
    residenceLocation: string;
    bankName: string;
    bankAccountHolderName: string;
    bankAccountNumber: string;
  };
  faydaFrontSha256: string;
  faydaBackSha256: string;
  reviewerId?: string;
  reviewedAt?: string;
  rejectionCategory?: RejectionCategory;
  rejectionReasonEnglish?: string;
  rejectionReasonAmharic?: string;
  createdAt: string;
}

export interface ContractDossierWorkerProfile {
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  bankName?: string;
}

export interface ContractDossierContract {
  workerProfile?: ContractDossierWorkerProfile;
}

export interface ContractDossierDto {
  contractId: string;
  contractNumber: string;
  status: ContractStatus;
  roleTitle: string;
  ratePerTaskEtb: number;
  agreementDate: string;
  phone: string;
  currentAttemptNumber: number;
  maxAttempts: number;
  remainingAttempts: number;
  attempts: AttemptSummaryDto[];
  idCardUrls: { front: string; back: string };
  contract?: ContractDossierContract;
  submittedData?: Pick<
    WorkerSubmittedData,
    "bankName" | "bankAccountHolderName" | "bankAccountNumber"
  >;
  bankName?: string;
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  approvedBy?: string;
  approvedAt?: string;
  /**
   * Identity as captured at invitation, before any submission exists.
   *
   * The list endpoint already returns the first two on ContractListItemDto; the
   * dossier endpoint does not yet send any of them, which is why an unsubmitted
   * dossier can only identify a candidate by phone number. Optional so the
   * pre-submission cards render the rows they have and grow the rest the moment
   * the backend catches up — the same contract as `expiresAt`.
   */
  candidateName?: string;
  candidateNameAmharic?: string;
  residence?: string;
  /** Agreement template revision, e.g. "RD_EOC_HR_007_REV1". */
  templateId?: string;
  /** See the note on ContractListItemDto — same fields, same graceful absence. */
  reminderCount?: number;
  lastReminderSentAt?: string;
  nextReminderAt?: string;
  expiresAt?: string;
}

export interface ApproveResponseData {
  status: ContractStatus;
  attemptNumber: number;
  documentHash?: string;
  snapshotHash?: string;
  sealingError?: string;
}

export interface RejectPayload {
  rejectionCategory: RejectionCategory;
  rejectionReasonEnglish: string;
  rejectionReasonAmharic?: string;
}

export interface RejectResponseData {
  status: "RESUBMISSION_REQUIRED" | "REJECTED";
  rejectionCategory: RejectionCategory;
  attemptNumber: number;
  remainingAttempts: number;
}

export interface RetrySealingResponseData {
  status: ContractStatus;
  documentHash?: string;
  snapshotHash?: string;
  pdfStorageKey?: string;
  error?: string;
}

// ============================================================
// Finance
// ============================================================

export interface CreateContractRequestBody {
  phone: string;
  /** Id of a pre-vaulted agreement template; supplies the rate and clauses. */
  templateId: string;
}

/** AfroMessage dispatch outcome for the invitation SMS. */
export type SmsDispatchStatus = "SENT" | "QUEUED" | "FAILED";

export interface CreateContractResponseData {
  contractId: string;
  /** Assigned by the backend at issuance — never supplied by the client. */
  contractNumber: string;
  status: "INVITED";
  workerAccessToken: string;
  inviteLink: string;
  expiresAt: string;
  /**
   * Absent on backends that dispatch the SMS out of band, so the UI must fall
   * back to neutral copy rather than claiming a delivery it cannot confirm.
   */
  smsStatus?: SmsDispatchStatus;
  smsSentAt?: string;
}

export interface FinanceContractListItemDto {
  contractId: string;
  contractNumber: string;
  status: ContractStatus;
  workerName?: string;
  workerNameAmharic?: string;
  phone: string;
  bankName?: string;
  bankAccountMasked?: string;
  ratePerTaskEtb: number;
  agreementDate: string;
  signedAt?: string;
  documentHash?: string;
  hasSealedDocument: boolean;
  /**
   * Worker signing URL. Only returned at creation today, so the finance grid's
   * Copy Link action renders when the list endpoint starts sending it and is
   * absent until then.
   */
  inviteLink?: string;
  /** See the note on ContractListItemDto — same fields, same graceful absence. */
  reminderCount?: number;
  lastReminderSentAt?: string;
  nextReminderAt?: string;
  expiresAt?: string;
}

export interface FinanceDocumentResponseData {
  documentUrl: string;
  expiresIn: number;
}

export interface FinanceSummary {
  reminderEligible: number;
}

export interface BulkRemindParams {
  contractIds?: string[];
  allEligible?: boolean;
  limit?: number;
}

export interface BulkRemindResult {
  totalTargeted: number;
  processedCount: number;
  skippedCount: number;
  failures: number;
}

/**
 * Outcome of an SMS nudge to a candidate who was invited but has not submitted.
 * Shared by the reviewer and finance remind endpoints — the cooldown in
 * `nextReminderAt` is server-authoritative and the client never recomputes it.
 */
export interface RemindContractResponse {
  contractId: string;
  reminderCount: number;
  lastReminderSentAt: string;
  nextReminderAt: string;
  /** Absent on backends that dispatch out of band, like CreateContractResponseData. */
  smsStatus?: SmsDispatchStatus;
}

/**
 * Outcome of re-issuing a lapsed signing link. The endpoint grants a fresh
 * 30-day token, moves EXPIRED back to INVITED (or leaves an in-progress status
 * alone), resets the reminder counter, and dispatches one SMS.
 *
 * `success` from the task spec is deliberately absent: `api<T>()` returns
 * `response.data.data`, so the envelope's flag never reaches a call site.
 */
export interface RenewContractResponse {
  contractId: string;
  /** The status held before renewal — usually EXPIRED. */
  previousStatus: ContractStatus;
  status: ContractStatus;
  expiresAt: string;
  reminderCount: number;
  nextReminderAt: string;
  /** Absent on backends that dispatch out of band, like RemindContractResponse. */
  smsStatus?: SmsDispatchStatus;
}
