export async function renderElementToPdfBlob(element: HTMLElement): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  // JPEG instead of PNG: this is a screenshot of mostly text, and PNG's
  // lossless compression makes that enormous at high resolution — a 4-page
  // agreement was coming out over 40MB as PNG, comfortably clearing the
  // backend's 10MB upload limit and making the blob unreliable to fetch/download.
  const imgData = canvas.toDataURL("image/jpeg", 0.85);
  // Reusing the same alias across addImage calls tells jsPDF to cache the
  // image once instead of re-embedding the full image per page — without it,
  // a multi-page document duplicates the same multi-MB image on every page.
  const imageAlias = "contract-page-image";

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, imageAlias);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, imageAlias);
    heightLeft -= pageHeight;
  }

  return pdf.output("blob");
}
