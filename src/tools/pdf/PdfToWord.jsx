import { useState, useCallback } from 'react';
import {
    Download,
    Loader2,
    FileType,
    Trash2,
    AlertCircle,
    Type,
    FileText,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import { extractPageContent } from '../../utils/pdfjs';

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Group raw PDF text items into paragraph-like arrays.
 * Items whose Y-baselines are within `threshold` PDF-points of each other
 * belong to the same "line"; lines are then sorted left→right, top→bottom.
 */
function groupIntoLines(textItems, threshold = 3) {
    if (!textItems.length) return [];

    // Sort top→bottom (PDF y is bottom-up, so larger y = higher on page)
    const sorted = [...textItems].sort((a, b) => b.y - a.y);

    const lines = [];
    let currentLine = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const item = sorted[i];
        const lineY = currentLine[0].y;

        if (Math.abs(item.y - lineY) <= threshold) {
            currentLine.push(item);
        } else {
            lines.push(currentLine.sort((a, b) => a.x - b.x));
            currentLine = [item];
        }
    }
    lines.push(currentLine.sort((a, b) => a.x - b.x));
    return lines;
}

/**
 * Read a Blob as an ArrayBuffer (needed for docx ImageRun).
 */
function blobToArrayBuffer(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsArrayBuffer(blob);
    });
}

// ─── component ────────────────────────────────────────────────────────────────

export default function PdfToWord() {
    const [pdfFile, setPdfFile] = useState(null);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState(null);
    const [scale, setScale] = useState(2);
    const [progress, setProgress] = useState('');
    const [mode, setMode] = useState('hybrid'); // 'hybrid' | 'text' | 'image'

    const handleFiles = useCallback(async (files) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file.type !== 'application/pdf') {
            setError('Please select a valid PDF file.');
            return;
        }

        setPdfFile(file);
        setError(null);
        setLoading(true);
        setPages([]);
        setProgress('Extracting text & rendering pages…');

        try {
            const extracted = await extractPageContent(file, {
                format: 'jpeg',
                quality: 0.9,
                scale,
            });
            setPages(extracted);
            setProgress('');
        } catch (err) {
            setError('Failed to process PDF. The file may be corrupted or password-protected.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [scale]);

    const handleClear = () => {
        pages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        setPdfFile(null);
        setPages([]);
        setError(null);
        setProgress('');
    };

    const handleExport = async () => {
        if (pages.length === 0) return;
        setExporting(true);
        setProgress('Building Word document…');

        try {
            const {
                Document,
                Packer,
                Paragraph,
                TextRun,
                ImageRun,
                PageBreak,
                AlignmentType,
            } = await import('docx');

            const docChildren = [];

            for (let i = 0; i < pages.length; i++) {
                setProgress(`Building page ${i + 1} of ${pages.length}…`);
                const page = pages[i];
                const { pageWidth, pageHeight, textItems, blob } = page;

                // ── Text section ───────────────────────────────────────────────
                if (mode === 'text' || mode === 'hybrid') {
                    const lines = groupIntoLines(textItems);

                    if (lines.length === 0) {
                        docChildren.push(new Paragraph({ text: '' }));
                    } else {
                        for (const line of lines) {
                            const combinedText = line.map((t) => t.str).join(' ');
                            // Derive a rough font size in half-points (docx uses half-points)
                            const avgFontSizePt = line.reduce((s, t) => s + t.fontSize, 0) / line.length;
                            // PDF points → docx half-points (×2), clamped to sensible range
                            const fontSizeHp = Math.max(16, Math.min(144, Math.round(avgFontSizePt * 2)));

                            docChildren.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: combinedText,
                                            size: fontSizeHp,
                                        }),
                                    ],
                                })
                            );
                        }
                    }
                }

                // ── Image section ──────────────────────────────────────────────
                if (mode === 'image' || mode === 'hybrid') {
                    const imgBuf = await blobToArrayBuffer(blob);

                    // Fit within 6-inch content width; transformation takes pixels (docx × 9525 → EMU)
                    const MAX_W_PX = 576; // 6 inches × 96 DPI
                    const ratio = pageWidth / pageHeight;
                    const imgWPx = MAX_W_PX;
                    const imgHPx = Math.round(MAX_W_PX / ratio);

                    docChildren.push(
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: imgBuf,
                                    type: 'jpg',
                                    transformation: {
                                        width: imgWPx,
                                        height: imgHPx,
                                    },
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                        })
                    );
                }

                // ── Page break between pages (not after last) ──────────────────
                if (i < pages.length - 1) {
                    docChildren.push(
                        new Paragraph({
                            children: [new PageBreak()],
                        })
                    );
                }
            }

            setProgress('Packaging .docx file…');

            const doc = new Document({
                sections: [
                    {
                        children: docChildren,
                    },
                ],
            });

            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = pdfFile.name.replace(/\.pdf$/i, '') + '.docx';
            a.click();
            URL.revokeObjectURL(url);
            setProgress('');
        } catch (err) {
            setError('Failed to generate Word document.');
            console.error(err);
        } finally {
            setExporting(false);
        }
    };

    const totalTextItems = pages.reduce((sum, p) => sum + (p.textItems?.length ?? 0), 0);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {!pdfFile ? (
                <>
                    {/* Config + dropzone */}
                    <div className="glass-panel p-5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <FileType size={24} className="text-neon-cyan" />
                            <div>
                                <h2 className="font-bold text-slate-100">PDF to Word</h2>
                                <p className="text-xs text-slate-400">
                                    Extract editable text — your files never leave this device.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Output mode */}
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                    Output:
                                </label>
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value)}
                                    className="bg-ocean-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50 themed-select"
                                >
                                    <option value="hybrid">Text + Image (Hybrid)</option>
                                    <option value="text">Text Only (Editable)</option>
                                    <option value="image">Image Only (Visual)</option>
                                </select>
                            </div>

                            {/* Resolution */}
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                    Resolution:
                                </label>
                                <select
                                    value={scale}
                                    onChange={(e) => setScale(Number(e.target.value))}
                                    className="bg-ocean-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50 themed-select"
                                >
                                    <option value={1}>Standard (1×)</option>
                                    <option value={2}>High (2×)</option>
                                    <option value={3}>Ultra (3×)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <FileDropzone
                        accept="application/pdf"
                        onFiles={handleFiles}
                        label="Drop Your PDF Here"
                        hint="Text is extracted for editing — processed entirely in your browser."
                    />
                </>
            ) : (
                <div className="space-y-6">

                    {/* Top Bar */}
                    <div className="glass-panel p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <FileText size={20} className="text-neon-cyan shrink-0" />
                            <div className="truncate">
                                <div className="font-bold text-slate-200 truncate">{pdfFile.name}</div>
                                <div className="text-xs text-slate-400 flex flex-wrap gap-2">
                                    <span>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
                                    {totalTextItems > 0 && (
                                        <span className="inline-flex items-center gap-1 text-neon-cyan">
                                            <Type size={11} />
                                            {totalTextItems} text element{totalTextItems !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    <span className="text-slate-500 capitalize">· {mode} mode</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold transition-colors"
                            >
                                <Trash2 size={16} /> Clear
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={exporting || loading || pages.length === 0}
                                className="flex items-center gap-2 px-6 py-2 bg-neon-emerald/10 hover:bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/30 rounded-lg text-sm font-bold transition-colors shadow-glow-emerald disabled:opacity-50"
                            >
                                {exporting
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : <Download size={16} />}
                                {exporting ? 'Exporting…' : 'Download .docx'}
                            </button>
                        </div>
                    </div>

                    {/* Info badge */}
                    {!loading && totalTextItems > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 glass-panel border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan text-xs font-semibold rounded-lg">
                            <Type size={14} />
                            Text paragraphs will be editable in Word.
                            {mode === 'hybrid' && ' The page image is embedded below each text section for visual reference.'}
                            {mode === 'text' && ' Text-only — no images embedded.'}
                            {mode === 'image' && ' Image-only — not editable; exact visual replica.'}
                        </div>
                    )}

                    {/* Progress */}
                    {(loading || progress) && (
                        <div className="flex items-center justify-center gap-3 p-4 glass-panel border border-neon-cyan/20 bg-neon-cyan/5">
                            <Loader2 size={18} className="text-neon-cyan animate-spin" />
                            <span className="text-sm font-semibold text-neon-cyan">
                                {progress || 'Processing…'}
                            </span>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 glass-panel border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-semibold">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    {/* Page thumbnails */}
                    {pages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {pages.map((page) => (
                                <div
                                    key={page.pageNumber}
                                    className="glass-panel border border-white/5 overflow-hidden flex flex-col relative"
                                >
                                    {/* Slide number badge */}
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur rounded text-[10px] font-bold text-slate-300 pointer-events-none z-10 border border-white/10">
                                        Page {page.pageNumber}
                                    </div>

                                    {/* Text count badge */}
                                    {page.textItems?.length > 0 && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-neon-cyan/10 backdrop-blur rounded text-[10px] font-bold text-neon-cyan pointer-events-none z-10 border border-neon-cyan/20 flex items-center gap-1">
                                            <Type size={9} /> {page.textItems.length}
                                        </div>
                                    )}

                                    <div className="h-40 bg-ocean-950 flex items-center justify-center p-2 overflow-hidden">
                                        <img
                                            src={page.previewUrl}
                                            alt={`Page ${page.pageNumber}`}
                                            className="max-h-full max-w-full object-contain rounded shadow-lg"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
