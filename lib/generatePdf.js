export async function generatePdf(employeeName, payMonth) {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const el = document.getElementById("slip-preview");
  if (!el) throw new Error("Slip preview element not found");

  const canvas = await html2canvas(el, {
    scale: 6,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const ratio = canvas.width / canvas.height;
  const imgW = pdfW - 16;
  const imgH = imgW / ratio;

  pdf.addImage(imgData, "PNG", 8, 8, imgW, Math.min(imgH, pdfH - 16));

  const name = (employeeName || "Employee").replace(/\s+/g, "_");
  const month = payMonth || "Slip";
  pdf.save(`Salary_Slip_${name}_${month}.pdf`);
}
