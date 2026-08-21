import { ApiError } from "@/lib/backend/client";

/**
 * Surfaces the real reason an action failed instead of a generic message —
 * network/runtime errors (failed fetch, canvas/PDF generation errors, etc.)
 * are not ApiError instances, so without this they'd all collapse into the
 * same unhelpful fallback text.
 */
export function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return `${fallback}: ${err.message}`;
  return fallback;
}
