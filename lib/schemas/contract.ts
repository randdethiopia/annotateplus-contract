import * as z from "zod";

export const faydaIdSchema = z
  .string()
  .transform((value) => value.replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{16}$/, "Enter a valid 16-digit Fayda ID"));

export const contractSignatureSchema = z.object({
  faydaId: faydaIdSchema,
  agreed: z.literal(true, "You must agree to the contract before signing"),
});

export type ContractSignatureSchemaType = z.infer<typeof contractSignatureSchema>;
