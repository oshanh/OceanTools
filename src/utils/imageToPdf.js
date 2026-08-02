import { jsPDF } from 'jspdf';

const PAGE_SIZES = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
};

/**
 * Load an image file and return its data URL plus dimensions.
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);

      const format = file.type === 'image/png' ? 'PNG' : 'JPEG';
      const dataUrl = canvas.toDataURL(format === 'PNG' ? 'image/png' : 'image/jpeg', 0.92);

      URL.revokeObjectURL(url);
      resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight, format });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

/**
 * Convert an array of image files into a single PDF blob.
 * @param {File[]} files - Ordered image files
 * @param {{ pageSize: 'a4' | 'letter' | 'fit', orientation: 'portrait' | 'landscape', margin: number }} options
 */
export async function convertImagesToPdf(
  files,
  { pageSize = 'a4', orientation = 'portrait', margin = 10 } = {},
) {
  const pdf = new jsPDF({ orientation, unit: 'mm', format: pageSize === 'fit' ? 'a4' : pageSize });
  let isFirstPage = true;

  for (const file of files) {
    const { dataUrl, width, height, format } = await loadImage(file);

    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const innerWidth = pageWidth - margin * 2;
    const innerHeight = pageHeight - margin * 2;

    // Scale image to fit within page margins while preserving aspect ratio
    const aspect = width / height;
    let drawWidth = innerWidth;
    let drawHeight = drawWidth / aspect;

    if (drawHeight > innerHeight) {
      drawHeight = innerHeight;
      drawWidth = drawHeight * aspect;
    }

    const x = margin + (innerWidth - drawWidth) / 2;
    const y = margin + (innerHeight - drawHeight) / 2;

    pdf.addImage(dataUrl, format, x, y, drawWidth, drawHeight);
  }

  return pdf.output('blob');
}

export { PAGE_SIZES };
