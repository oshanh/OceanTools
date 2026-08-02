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
