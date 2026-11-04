import { z } from "zod";

export const singleTransferSchema = z.object({
  contractId: z.string().trim().min(1, "Select a signed contract to pay"),
  amount: z
    .number({ error: "Enter the amount to disburse" })
    .positive("Amount must be greater than zero")
    .max(1_000_000, "Amount exceeds the single-transfer ceiling"),
  paymentReason: z
    .string()
    .trim()
    .min(3, "Describe what this payment is for")
    .max(140, "Keep the reason under 140 characters"),
});

export type SingleTransferInput = z.infer<typeof singleTransferSchema>;
