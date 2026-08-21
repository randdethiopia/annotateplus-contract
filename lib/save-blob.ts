export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoking immediately after click() can cut off the browser's own download
  // read of the blob in some browsers, which then falls back to unexpected
  // handling (e.g. handing off to an external viewer) instead of just saving
  // the file. Defer the revoke so the download has already started.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
