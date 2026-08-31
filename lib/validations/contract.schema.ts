import { z } from "zod";
import { BANK_VALUES, OTHER_BANK } from "@/lib/banks";
import { DEFAULT_TEMPLATE_ID } from "@/lib/contract-templates";

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Issuance is now two fields: the pre-vaulted template supplies the rate and
 * clauses, and the backend assigns the contract number. `contractNumber`,
 * `ratePerTaskEtb` and `contractPdf` are retained as optional only so callers
 * built against the old shape still type-check — nothing reads them.
 */
export const createContractSchema = z.object({
  templateId: z.string().default(DEFAULT_TEMPLATE_ID),
  phone: z
    .string()
    .trim()
    .min(9, "Please enter a valid Ethiopian mobile number (e.g. 0911234567 or +251911234567)")
    .regex(/^(\+251|0)?(9|7)\d{8}$/, "Must be a valid Ethio Telecom or Safaricom mobile number"),
  contractNumber: z.string().optional(),
  ratePerTaskEtb: z.number().optional(),
  contractPdf: z.any().optional(),
});

/**
 * `templateId` has a `.default()`, so the schema's input and output differ:
 * the form may omit it, the parsed payload always carries it. `useForm` needs
 * both — the field values it holds, and the values the resolver hands back.
 */
export type CreateContractFormValues = z.input<typeof createContractSchema>;
export type CreateContractInput = z.output<typeof createContractSchema>;

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

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Backstop for a Fayda ID photo. The pixel-dimension check is async and runs at
 * pick time in `<IdPhotoField>` so the candidate gets instant feedback; these
 * sync rules guard the submit path regardless.
 */
const idPhotoSchema = z
  .instanceof(File, { message: "Please attach a photo of your Fayda ID" })
  .refine((f) => ACCEPTED_IMAGE_TYPES.includes(f.type), "Photo must be a JPEG, PNG, or WebP image")
  .refine((f) => f.size <= MAX_IMAGE_BYTES, "Photo must be 10MB or smaller");

/**
 * Ge'ez OR Latin. A Ge'ez-only rule would hard-block any candidate whose phone
 * has no Amharic keyboard — from a contract they are entitled to. HR compares the
 * name against the Fayda ID during review and has NAME_MISMATCH for the rest.
 */
const AMHARIC_NAME_PATTERN = /^[ሀ-፿\sa-zA-Z.'-]+$/;
const LATIN_NAME_PATTERN = /^[a-zA-Z\s.'-]+$/;

export const workerSubmitSchema = z
  .object({
    fullNameEnglish: z
      .string()
      .trim()
      .min(3, "Please enter your full English name (as on your ID)")
      .regex(LATIN_NAME_PATTERN, "English name must use Latin letters only"),
    fullNameAmharic: z
      .string()
      .trim()
      .min(3, "እባክዎን ሙሉ ስምዎን ያስገቡ · Please enter your full name")
      .regex(AMHARIC_NAME_PATTERN, "የስም ፊደላት ብቻ ይጠቀሙ · Letters only"),
    residenceLocation: z
      .string()
      .trim()
      .min(5, "Please enter your full address (city, sub-city, woreda)"),
    bankName: z.enum(BANK_VALUES, { error: "Please select your payout bank" }),
    /** Only meaningful when bankName is OTHER; enforced by the superRefine below. */
    bankNameOther: z.string().trim().optional(),
    bankAccountHolderName: z.string().trim().min(3, "Account holder name is required"),
    bankAccountNumber: z
      .string()
      .trim()
      .regex(/^[0-9]+$/, "Account number must contain digits only")
      .min(8, "Account number must be at least 8 digits")
      .max(20, "Account number is too long"),
    faydaFront: idPhotoSchema,
    faydaBack: idPhotoSchema,
    agreedToTerms: z
      .boolean()
      .refine((v) => v === true, "You must agree to the contract terms to proceed"),
  })
  .superRefine((values, ctx) => {
    if (values.bankName === OTHER_BANK && !values.bankNameOther?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["bankNameOther"],
        message: "Please type your bank's name",
      });
    }
  });

export type WorkerSubmitInput = z.infer<typeof workerSubmitSchema>;
