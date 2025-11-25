// src/utils/exportToPdf.ts
// Utilidad para exportar un nodo del DOM a PDF usando html2canvas + jsPDF

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf"; // 👈 IMPORT NOMBRADO (importante en Vite)

export async function exportElementToPdf(
  element: HTMLElement,
  filename = "bloom-skin-report.pdf"
): Promise<void> {
  const { scrollWidth, scrollHeight } = element;

  // Capturamos el nodo con buena resolución respetando dimensiones completas
  const canvas = await html2canvas(element, {
    scale: 2, // más resolución para que no se vea pixelado
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
    width: scrollWidth,
    height: scrollHeight,
    windowWidth: scrollWidth,
    windowHeight: scrollHeight,
    backgroundColor: "#F5F5F5", // fondo Bloom de la pantalla
  });

  const imgData = canvas.toDataURL("image/png");

  // Creamos PDF A4 en mm
  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Ajustamos la imagen al ancho del PDF manteniendo proporción
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Página 1
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  // Páginas adicionales si el contenido es más largo
  while (heightLeft > 0) {
    position -= pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save(filename);
}
