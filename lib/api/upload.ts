import { api } from "@/lib/api/client";
import type { PresignedUploadResponseData } from "@/types/backend";

export async function getPresignedUpload(
  token: string,
  filename: string,
  contentType: string
): Promise<PresignedUploadResponseData> {
  return api<PresignedUploadResponseData>("/upload/presigned", {
    method: "POST",
    token,
    body: { filename, contentType },
  });
}

export async function uploadFileToPresignedUrl(
  presigned: PresignedUploadResponseData,
  file: Blob
): Promise<void> {
  const response = await fetch(presigned.uploadUrl, {
    method: presigned.method,
    headers: presigned.headers,
    body: file,
  });
  if (!response.ok) {
    throw new Error(`File upload failed (${response.status})`);
  }
}

/** Presign, PUT to S3, return the storage key for JSON API payloads. */
export async function uploadViaPresign(token: string, file: File): Promise<string> {
  const presigned = await getPresignedUpload(token, file.name, file.type);
  await uploadFileToPresignedUrl(presigned, file);
  return presigned.key;
}
