import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

const MAX_PDF_BYTES = 10 * 1024 * 1024;

export const createContractSchema = z
  .object({
    contractPdf: z.instanceof(File, { message: "Please attach a contract agreement PDF" }),
    contractNumber: z.string().trim().min(3, "Contract number is required"),
    phone: z.string().trim().min(9, "Please enter a valid phone number (+251... or 09...)"),
    ratePerTaskEtb: z
      .number({ error: "Rate must be a number" })
      .positive("Rate must be greater than 0"),
    expiresInHours: z.number().int().positive().optional(),
  })
  .refine((f) => f.contractPdf.size <= MAX_PDF_BYTES, "PDF must be under 10MB")
  .refine(
    (f) =>
      f.contractPdf.type === "application/pdf" ||
      f.contractPdf.name.toLowerCase().endsWith(".pdf"),
    "File must be a PDF"
  );

export type CreateContractFormInput = z.infer<typeof createContractSchema>;

export const rejectContractSchema = z.object({
  rejectionCategory: z.enum([
    "NAME_MISMATCH",
    "BLURRY_ID",
    "EXPIRED_ID",
    "MISSING_BACK_IMAGE",
    "INVALID_BANK_INFO",
    "OTHER",
  ]),
  rejectionReasonEnglish: z
    .string()
    .trim()
    .min(3, "English reason must be at least 3 characters"),
  rejectionReasonAmharic: z.string().trim().optional(),
});

export type RejectContractInput = z.infer<typeof rejectContractSchema>;
