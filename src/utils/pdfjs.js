import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Render every page of a PDF file to image blobs.
 * @param {File} file - PDF file from user input
 * @param {{ format: 'png' | 'jpeg', quality: number, scale: number }} options
 * @returns {Promise<Array<{ pageNumber: number, blob: Blob, previewUrl: string }>>}
 */
export async function convertPdfToImages(file, { format = 'png', quality = 0.92, scale = 2 } = {}) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const results = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport, canvas }).promise;

    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), mimeType, quality);
    });

    results.push({
      pageNumber: pageNum,
      blob,
      previewUrl: URL.createObjectURL(blob),
    });
  }

  return results;
}

/**
 * Extract page image + text content from every page of a PDF.
 * Returns rasterized blob for background + raw text items with PDF-unit positions.
 * @param {File} file
 * @param {{ scale?: number, format?: 'jpeg'|'png', quality?: number }} options
 * @returns {Promise<Array<{
 *   pageNumber: number,
 *   blob: Blob,
 *   previewUrl: string,
 *   pageWidth: number,   // PDF points (1/72 inch)
 *   pageHeight: number,
 *   textItems: Array<{ str: string, x: number, y: number, fontSize: number, fontName: string, width: number }>
 * }>>}
 */
export async function extractPageContent(file, { scale = 2, format = 'jpeg', quality = 0.92 } = {}) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const results = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const naturalViewport = page.getViewport({ scale: 1 });

    // Render to canvas
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport, canvas }).promise;

    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), mimeType, quality);
    });

    // Extract text content
    const textContent = await page.getTextContent();
    const pageW = naturalViewport.width;   // PDF points width
    const pageH = naturalViewport.height;  // PDF points height

    const textItems = textContent.items
      .filter((item) => item.str && item.str.trim().length > 0)
      .map((item) => {
        // transform = [scaleX, skewY, skewX, scaleY, translateX, translateY]
        // PDF origin is bottom-left; translateY is from bottom
        const x = item.transform[4];
        const rawY = item.transform[5];
        const fontSize = Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || 10;
        return {
          str: item.str,
          x,           // PDF points from left
          y: rawY,     // PDF points from bottom
          fontSize,
          fontName: item.fontName || '',
          width: item.width || 0,
        };
      });

    results.push({
      pageNumber: pageNum,
      blob,
      previewUrl: URL.createObjectURL(blob),
      pageWidth: pageW,
      pageHeight: pageH,
      textItems,
    });
  }

  return results;
}

/** Trigger a single-file download in the browser */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Bundle multiple files into a ZIP and download */
export async function downloadAsZip(files, zipName) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  files.forEach(({ blob, filename }) => {
    zip.file(filename, blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, zipName);
}
