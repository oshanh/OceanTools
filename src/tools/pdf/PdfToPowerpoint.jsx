import { useState, useCallback } from 'react';
import {
    Download,
    Loader2,
    Presentation,
    Trash2,
    AlertCircle,
    Type,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import { extractPageContent } from '../../utils/pdfjs';

// PDF points → inches  (1 inch = 72 PDF points)
const PT_TO_IN = 1 / 72;

export default function PdfToPowerpoint() {
    const [pdfFile, setPdfFile] = useState(null);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState(null);
    const [scale, setScale] = useState(2);
    const [progress, setProgress] = useState('');

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
        setProgress('Rendering PDF pages & extracting content...');

        try {
            const extracted = await extractPageContent(file, {
                format: 'jpeg',
                quality: 0.92,
                scale,
            });
            setPages(extracted);
            setProgress('');
        } catch (err) {
            setError('Failed to render PDF. The file may be corrupted or password-protected.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [scale]);

    const handleClear = () => {
        pages.forEach(p => URL.revokeObjectURL(p.previewUrl));
        setPdfFile(null);
        setPages([]);
        setError(null);
        setProgress('');
    };

    const handleExport = async () => {
        if (pages.length === 0) return;
        setExporting(true);
        setProgress('Building editable PowerPoint slides...');

        try {
            const PptxGenJS = (await import('pptxgenjs')).default;
            const pptx = new PptxGenJS();

            for (let i = 0; i < pages.length; i++) {
                setProgress(`Processing slide ${i + 1} of ${pages.length}...`);

                const page = pages[i];
                const { pageWidth, pageHeight, textItems, blob } = page;

                // Slide dimensions in inches match the PDF page aspect ratio
                const slideW = pageWidth * PT_TO_IN;
                const slideH = pageHeight * PT_TO_IN;

                pptx.defineLayout({
                    name: `PDF_PAGE_${i}`,
                    width: slideW,
                    height: slideH,
                });
                pptx.layout = `PDF_PAGE_${i}`;

                const slide = pptx.addSlide();

                // ── Background layer: full rasterized page ──────────────────
                // Preserves visual appearance of shapes, graphics, images.
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });

                slide.addImage({
                    data: base64,
                    x: 0,
                    y: 0,
                    w: slideW,
                    h: slideH,
                });

                // ── Text layer: transparent boxes placed over the background ─
                // PDF y-axis is bottom-up; PPTX is top-down — flip it.
                for (const item of textItems) {
                    const fontSizeIn = item.fontSize * PT_TO_IN;
                    const widthIn = (item.width > 0 ? item.width : item.fontSize * 0.6 * (item.str.length || 1)) * PT_TO_IN;

                    // Position: convert from PDF bottom-left origin to PPTX top-left
                    const xIn = item.x * PT_TO_IN;
                    // y in PDF is baseline from bottom; shift up by fontSize for top of glyph
                    const yIn = (pageHeight - item.y - item.fontSize) * PT_TO_IN;

                    // Clamp to slide bounds
                    if (xIn < 0 || xIn >= slideW || yIn < 0 || yIn >= slideH) continue;

                    const clampedW = Math.min(widthIn, slideW - xIn);
                    const clampedH = Math.min(fontSizeIn * 1.2, slideH - yIn);
                    if (clampedW <= 0 || clampedH <= 0) continue;

                    slide.addText(item.str, {
                        x: xIn,
                        y: yIn,
                        w: clampedW,
                        h: clampedH,
                        // font size: PDF points × 0.75 converts to pptx "points" (pt→CSS pt)
                        fontSize: Math.max(6, Math.round(item.fontSize * 0.75)),
                        // transparency 100 = fully see-through; text is editable but invisible in view mode
                        color: '000000',
                        transparency: 100,
                        fontFace: 'Calibri',
                        wrap: false,
                        valign: 'top',
                    });
                }
            }

            setProgress('Compressing & downloading...');
            await pptx.writeFile({ fileName: pdfFile.name.replace(/\.pdf$/i, '') + '.pptx' });
            setProgress('');

        } catch (err) {
            setError('Failed to generate PowerPoint file.');
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
                    {/* Config before upload */}
                    <div className="glass-panel p-5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <Presentation size={24} className="text-neon-cyan" />
                            <div>
                                <h2 className="font-bold text-slate-100">PDF to PowerPoint</h2>
                                <p className="text-xs text-slate-400">Editable text + image-fidelity backgrounds per slide.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Resolution:</label>
                            <select
                                value={scale}
                                onChange={(e) => setScale(Number(e.target.value))}
                                className="bg-ocean-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50 themed-select"
                            >
                                <option value={1}>Standard (1x)</option>
                                <option value={2}>High (2x)</option>
                                <option value={3}>Ultra (3x)</option>
                            </select>
                        </div>
                    </div>

                    <FileDropzone
                        accept="application/pdf"
                        onFiles={handleFiles}
                        label="Drop Your PDF Here"
                        hint="Text is extracted for editing — your files never leave this device."
                    />
                </>
            ) : (
                <div className="space-y-6">

                    {/* Top Bar */}
                    <div className="glass-panel p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <Presentation size={20} className="text-neon-cyan shrink-0" />
                            <div className="truncate">
                                <div className="font-bold text-slate-200 truncate">{pdfFile.name}</div>
                                <div className="text-xs text-slate-400">
                                    {pages.length} slide{pages.length !== 1 ? 's' : ''}
                                    {totalTextItems > 0 && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-neon-cyan">
                                            <Type size={11} />
                                            {totalTextItems} editable text element{totalTextItems !== 1 ? 's' : ''}
                                        </span>
                                    )}
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
                                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                {exporting ? 'Exporting...' : 'Download .pptx'}
                            </button>
                        </div>
                    </div>

                    {/* Editable content badge */}
                    {!loading && totalTextItems > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 glass-panel border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan text-xs font-semibold rounded-lg">
                            <Type size={14} />
                            Text will be selectable &amp; editable in PowerPoint. Visual layout is preserved as a background image per slide.
                        </div>
                    )}

                    {/* Progress / Error */}
                    {(loading || progress) && (
                        <div className="flex items-center justify-center gap-3 p-4 glass-panel border border-neon-cyan/20 bg-neon-cyan/5">
                            <Loader2 size={18} className="text-neon-cyan animate-spin" />
                            <span className="text-sm font-semibold text-neon-cyan">{progress || 'Processing...'}</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-3 p-4 glass-panel border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-semibold">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    {/* Pages Preview Grid */}
                    {pages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {pages.map((page) => (
                                <div key={page.pageNumber} className="glass-panel border border-white/5 overflow-hidden flex flex-col group relative">
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur rounded text-[10px] font-bold text-slate-300 pointer-events-none z-10 border border-white/10">
                                        Slide {page.pageNumber}
                                    </div>
                                    {page.textItems?.length > 0 && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-neon-cyan/10 backdrop-blur rounded text-[10px] font-bold text-neon-cyan pointer-events-none z-10 border border-neon-cyan/20 flex items-center gap-1">
                                            <Type size={9} /> {page.textItems.length}
                                        </div>
                                    )}
                                    <div className="h-40 bg-ocean-950 flex items-center justify-center p-2 relative overflow-hidden">
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
