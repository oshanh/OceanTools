import { PDFDocument } from 'pdf-lib';

/**
 * Merge multiple PDF files into a single PDF document — fully client-side.
 * Uses pdf-lib to copy pages verbatim so text, fonts, and vectors are preserved.
 *
 * @param {File[]} files - Ordered PDF files to merge
 * @returns {Promise<Blob>} - The merged PDF as a Blob
 */
export async function mergePdfs(files) {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let sourcePdf;
        try {
            sourcePdf = await PDFDocument.load(arrayBuffer, {
                // Ignore minor cross-reference errors that some generators produce
                ignoreEncryption: true,
            });
        } catch (err) {
            throw new Error(
                `"${file.name}" could not be read. It may be password-protected or corrupted.`,
            );
        }

        const pageIndices = sourcePdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    return new Blob([mergedBytes], { type: 'application/pdf' });
}

/**
 * Get page count of a PDF file without fully loading all resources.
 * @param {File} file
 * @returns {Promise<number>}
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
