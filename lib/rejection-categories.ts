import type { RejectionCategory } from "@/types/backend";

export const REJECTION_CATEGORY_LABELS: Record<RejectionCategory, string> = {
  NAME_MISMATCH: "Name does not match the ID",
  BLURRY_ID: "ID photo is blurry or unreadable",
  EXPIRED_ID: "ID document has expired",
  MISSING_BACK_IMAGE: "Back of the ID is missing or wrong",
  INVALID_BANK_INFO: "Bank details are invalid",
  OTHER: "Other",
};

export const REJECTION_CATEGORY_SHORT_LABELS: Record<RejectionCategory, string> = {
  NAME_MISMATCH: "NAME MISMATCH",
  BLURRY_ID: "BLURRY ID",
  EXPIRED_ID: "EXPIRED ID",
  MISSING_BACK_IMAGE: "MISSING BACK IMAGE",
  INVALID_BANK_INFO: "INVALID BANK INFO",
  OTHER: "OTHER",
};

export const REJECTION_CATEGORY_OPTIONS: { value: RejectionCategory; label: string }[] = (
  Object.entries(REJECTION_CATEGORY_LABELS) as [RejectionCategory, string][]
).map(([value, label]) => ({ value, label }));
