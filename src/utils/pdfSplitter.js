import { PDFDocument } from 'pdf-lib';

/**
 * Load a PDF File into a PDFDocument.
 * @param {File} file
 * @returns {Promise<PDFDocument>}
 */
async function loadPdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    try {
        return await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    } catch {
        throw new Error(
            `"${file.name}" could not be read. It may be password-protected or corrupted.`,
        );
    }
}

/**
 * Extract a subset of pages from a source PDFDocument into a new Blob.
 * @param {PDFDocument} sourcePdf
 * @param {number[]} pageIndices  0-based indices
 * @returns {Promise<Blob>}
 */
async function extractPages(sourcePdf, pageIndices) {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(sourcePdf, pageIndices);
    copied.forEach((page) => out.addPage(page));
    const bytes = await out.save();
    return new Blob([bytes], { type: 'application/pdf' });
}

// ---------------------------------------------------------------------------
// Public split functions
// ---------------------------------------------------------------------------

/**
 * Split every page into its own PDF.
 * @param {File} file
 * @returns {Promise<Array<{ label: string; blob: Blob }>>}
 */
export async function splitAllPages(file) {
    const srcPdf = await loadPdf(file);
    const total = srcPdf.getPageCount();
    const baseName = file.name.replace(/\.pdf$/i, '');
    const results = [];

    for (let i = 0; i < total; i++) {
        const blob = await extractPages(srcPdf, [i]);
        results.push({ label: `${baseName}_page_${i + 1}.pdf`, blob });
    }

    return results;
}

/**
 * Parse a range string like "1-3, 5, 7-10" into 0-based page index arrays.
 * Pages are 1-based in the input string.
 * @param {string} rangeStr
 * @param {number} totalPages  Max valid page number
 * @returns {{ indices: number[]; label: string }[]}  One per range token
 */
export function parseRanges(rangeStr, totalPages) {
    const tokens = rangeStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

    return tokens.map((token) => {
        const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
        const singleMatch = token.match(/^(\d+)$/);

        let from, to;

        if (rangeMatch) {
            from = parseInt(rangeMatch[1], 10);
            to = parseInt(rangeMatch[2], 10);
        } else if (singleMatch) {
            from = to = parseInt(singleMatch[1], 10);
        } else {
            throw new Error(`"${token}" is not a valid page range. Use formats like: 1-3, 5, 7-10`);
        }

        if (from < 1 || to < 1) throw new Error(`Page numbers must be ≥ 1 (got "${token}").`);
        if (from > totalPages || to > totalPages)
            throw new Error(`Page ${Math.max(from, to)} exceeds the document's ${totalPages} pages.`);
        if (from > to) throw new Error(`Range "${token}" is invalid — start must be ≤ end.`);

        const indices = [];
        for (let i = from; i <= to; i++) indices.push(i - 1);

        const label = from === to ? `pages_${from}` : `pages_${from}-${to}`;
        return { indices, label };
    });
}

/**
 * Split a PDF by custom page ranges.
 * @param {File} file
 * @param {string} rangeStr  Comma-separated ranges, 1-based (e.g. "1-3, 5, 7-9")
 * @returns {Promise<Array<{ label: string; blob: Blob }>>}
 */
export async function splitByRanges(file, rangeStr) {
    const srcPdf = await loadPdf(file);
    const totalPages = srcPdf.getPageCount();
    const baseName = file.name.replace(/\.pdf$/i, '');
    const ranges = parseRanges(rangeStr, totalPages);
    const results = [];

    for (const { indices, label } of ranges) {
        const blob = await extractPages(srcPdf, indices);
        results.push({ label: `${baseName}_${label}.pdf`, blob });
    }

    return results;
}

/**
 * Split a PDF into consecutive chunks of `chunkSize` pages.
 * @param {File} file
 * @param {number} chunkSize
 * @returns {Promise<Array<{ label: string; blob: Blob }>>}
 */
export async function splitByChunks(file, chunkSize) {
    if (chunkSize < 1) throw new Error('Chunk size must be at least 1 page.');
    const srcPdf = await loadPdf(file);
    const total = srcPdf.getPageCount();
    const baseName = file.name.replace(/\.pdf$/i, '');
    const results = [];

    for (let start = 0; start < total; start += chunkSize) {
        const end = Math.min(start + chunkSize, total);
        const indices = Array.from({ length: end - start }, (_, k) => start + k);
        const blob = await extractPages(srcPdf, indices);
        const fromPage = start + 1;
        const toPage = end;
        const label =
            fromPage === toPage
                ? `${baseName}_page_${fromPage}.pdf`
                : `${baseName}_pages_${fromPage}-${toPage}.pdf`;
        results.push({ label, blob });
    }

    return results;
}

/**
 * Get the page count of a PDF file without fully parsing all resources.
 * @param {File} file
 * @returns {Promise<number|null>}
 */
export async function getPdfPageCount(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        return pdf.getPageCount();
    } catch {
        return null;
    }
}
