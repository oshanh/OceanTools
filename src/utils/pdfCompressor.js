import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { jsPDF } from 'jspdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Preset compression profiles.
 * scale   = render resolution multiplier (lower = smaller canvas = smaller output)
 * quality = JPEG encoding quality 0-1 (lower = more compression)
 */
export const COMPRESSION_PRESETS = {
    low: {
        label: 'Low Compression',
        sublabel: 'Best quality, modest savings',
        scale: 2.0,
        quality: 0.85,
        color: 'emerald',
    },
    medium: {
        label: 'Medium Compression',
        sublabel: 'Good quality, significant savings',
        scale: 1.5,
        quality: 0.70,
        color: 'cyan',
    },
    high: {
        label: 'High Compression',
        sublabel: 'Acceptable quality, large savings',
        scale: 1.2,
        quality: 0.50,
        color: 'amber',
    },
    maximum: {
        label: 'Maximum Compression',
        sublabel: 'Smallest size, reduced quality',
        scale: 0.9,
        quality: 0.30,
        color: 'red',
    },
};

/**
 * Compress a PDF file by rendering each page to a JPEG canvas and repacking.
 *
 * @param {File} file          Original PDF file
 * @param {object} options
 * @param {number} options.scale    Render scale (resolution multiplier)
 * @param {number} options.quality  JPEG quality 0–1
 * @param {(page: number, total: number) => void} [options.onProgress]
 * @returns {Promise<Blob>}    Compressed PDF blob
 */
export async function compressPdf(file, { scale = 1.5, quality = 0.70, onProgress } = {}) {
    const arrayBuffer = await file.arrayBuffer();

    let pdfDoc;
    try {
        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    } catch {
        throw new Error(
            `"${file.name}" could not be read. It may be password-protected or corrupted.`,
        );
    }

    const numPages = pdfDoc.numPages;

    // We'll build the jsPDF doc page by page.
    let jsPdfDoc = null;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');

        // Fill white background (JPEG has no transparency)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Encode to JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Page dimensions in mm (at 72 dpi base)
        const pxToMm = (px) => (px / 96) * 25.4;
        const widthMm = pxToMm(canvas.width / scale);
        const heightMm = pxToMm(canvas.height / scale);

        if (!jsPdfDoc) {
            jsPdfDoc = new jsPDF({
                orientation: widthMm > heightMm ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [widthMm, heightMm],
                compress: true,
            });
        } else {
            jsPdfDoc.addPage([widthMm, heightMm], widthMm > heightMm ? 'landscape' : 'portrait');
        }

        jsPdfDoc.addImage(dataUrl, 'JPEG', 0, 0, widthMm, heightMm, undefined, 'FAST');

        // Cleanup canvas
        canvas.width = 0;
        canvas.height = 0;

        if (onProgress) onProgress(pageNum, numPages);
    }

    if (!jsPdfDoc) throw new Error('The PDF appears to have no pages.');

    return jsPdfDoc.output('blob');
}

/** Format bytes into a human-readable string */
export function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Calculate reduction percentage */
export function reductionPct(original, compressed) {
    if (!original) return 0;
    return Math.max(0, Math.round(((original - compressed) / original) * 100));
}
