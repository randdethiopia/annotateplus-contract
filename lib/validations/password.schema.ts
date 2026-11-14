import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_BYTES = 72;

const utf8 = new TextEncoder();

export function utf8ByteLength(value: string): number {
  return utf8.encode(value).length;
}

const newPasswordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .refine(
    (value) => utf8ByteLength(value) <= PASSWORD_MAX_BYTES,
    `Keep it within ${PASSWORD_MAX_BYTES} bytes. Accented and non-Latin characters use 2 to 4 bytes each.`
  );

export const activateAccountSchema = z
  .object({
    password: newPasswordField,
    confirmPassword: z.string().min(1, "Re-enter your password to confirm it"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1, "Re-enter your new password to confirm it"),
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current one",
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
