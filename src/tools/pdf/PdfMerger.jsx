import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Download,
    FileText,
    GripVertical,
    Loader2,
    Files,
    Trash2,
    X,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import { mergePdfs, getPdfPageCount } from '../../utils/pdfMerger';
import { downloadBlob } from '../../utils/pdfjs';

/**
 * PDF Merger — combines multiple PDF files into one download-ready PDF.
 * All processing happens client-side; files never leave the browser.
 */
export default function PdfMerger() {
    const [pdfs, setPdfs] = useState([]);
    const [outputName, setOutputName] = useState('merged');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);
    const [dragIndex, setDragIndex] = useState(null);
    const dragOverIndex = useRef(null);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => pdfs.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    }, [pdfs]);

    // Add new PDF files; resolve page counts asynchronously
    const addFiles = useCallback(async (files) => {
        setError(null);
        setDone(false);

        const newEntries = files.map((file) => ({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            size: file.size,
            pages: null, // resolved below
        }));

        setPdfs((prev) => [...prev, ...newEntries]);

        // Resolve page counts in background
        const withCounts = await Promise.all(
            newEntries.map(async (entry) => ({
                id: entry.id,
                pages: await getPdfPageCount(entry.file),
            })),
        );

        setPdfs((prev) =>
            prev.map((p) => {
                const counted = withCounts.find((c) => c.id === p.id);
                return counted ? { ...p, pages: counted.pages } : p;
            }),
        );
    }, []);

    const removeFile = useCallback((id) => {
        setPdfs((prev) => prev.filter((p) => p.id !== id));
        setDone(false);
        setError(null);
    }, []);

    const clearAll = useCallback(() => {
        setPdfs([]);
        setDone(false);
        setError(null);
        setProgress(0);
    }, []);

    const moveFile = useCallback((fromIndex, toIndex) => {
        setPdfs((prev) => {
            const updated = [...prev];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            return updated;
        });
    }, []);

    // Drag-to-reorder handlers
    const handleDragStart = (index) => {
        setDragIndex(index);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        dragOverIndex.current = index;
        if (dragIndex === null || dragIndex === index) return;
        moveFile(dragIndex, index);
        setDragIndex(index);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        dragOverIndex.current = null;
    };

    const handleMerge = async () => {
        if (pdfs.length < 2) {
            setError('Please add at least 2 PDF files to merge.');
            return;
        }

        setLoading(true);
        setError(null);
        setDone(false);
        setProgress(0);

        try {
            // Simulate progress ticks while the merge runs
            const progressInterval = setInterval(() => {
                setProgress((p) => Math.min(p + 8, 88));
            }, 150);

            const blob = await mergePdfs(pdfs.map((p) => p.file));
            clearInterval(progressInterval);
            setProgress(100);

            const filename = outputName.trim() || 'merged';
            downloadBlob(blob, `${filename}.pdf`);
            setDone(true);
        } catch (err) {
            setError(err.message || 'Failed to merge PDFs. One or more files may be corrupted or encrypted.');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = pdfs.reduce((sum, p) => sum + (p.pages ?? 0), 0);
    const totalSize = pdfs.reduce((sum, p) => sum + p.size, 0);

    return (
        <div className="space-y-6">
            {/* Drop zone */}
            <FileDropzone
                accept=".pdf,application/pdf"
                multiple
                onFiles={addFiles}
                label="Drop PDF files here or click to browse"
                hint="Add multiple PDFs · Drag to reorder · Processed entirely in your browser"
            />

            {/* File list */}
            {pdfs.length > 0 && (
                <div className="glass-panel p-6 space-y-4">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                                {pdfs.length} file{pdfs.length !== 1 ? 's' : ''}
                            </h2>
                            {totalPages > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                                    {totalPages} pages total
                                </span>
                            )}
                            <span className="text-xs text-slate-500">
                                {(totalSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>
                        <button
                            onClick={clearAll}
                            className="text-xs text-slate-500 hover:text-red-400 transition-glow flex items-center gap-1"
                        >
                            <Trash2 size={12} />
                            Clear all
                        </button>
                    </div>

                    {/* Sortable list */}
                    <div className="space-y-2">
                        {pdfs.map((pdf, index) => (
                            <div
                                key={pdf.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-glow
                  ${dragIndex === index
                                        ? 'bg-neon-cyan/10 border-neon-cyan/30 scale-[1.01]'
                                        : 'bg-white/5 border-white/10 hover:border-neon-cyan/20'
                                    } cursor-grab active:cursor-grabbing`}
                            >
                                {/* Drag handle */}
                                <GripVertical size={16} className="text-slate-600 shrink-0" />

                                {/* Index badge */}
                                <span className="w-6 h-6 flex items-center justify-center rounded-full
                                 bg-ocean-800 text-xs text-slate-400 font-mono shrink-0">
                                    {index + 1}
                                </span>

                                {/* PDF icon */}
                                <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan shrink-0">
                                    <FileText size={16} />
                                </div>

                                {/* File info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-200 truncate font-medium">{pdf.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {(pdf.size / 1024 / 1024).toFixed(2)} MB
                                        {pdf.pages != null
                                            ? ` · ${pdf.pages} page${pdf.pages !== 1 ? 's' : ''}`
                                            : ' · counting pages…'}
                                    </p>
                                </div>

                                {/* Move arrows (keyboard-friendly alternative to drag) */}
                                <div className="flex flex-col gap-0.5 shrink-0">
                                    <button
                                        onClick={() => index > 0 && moveFile(index, index - 1)}
                                        disabled={index === 0}
                                        className="p-0.5 rounded text-slate-500 hover:text-neon-cyan disabled:opacity-25
                               disabled:cursor-not-allowed transition-glow"
                                        aria-label="Move up"
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                    <button
                                        onClick={() => index < pdfs.length - 1 && moveFile(index, index + 1)}
                                        disabled={index === pdfs.length - 1}
                                        className="p-0.5 rounded text-slate-500 hover:text-neon-cyan disabled:opacity-25
                               disabled:cursor-not-allowed transition-glow"
                                        aria-label="Move down"
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                </div>

                                {/* Remove */}
                                <button
                                    onClick={() => removeFile(pdf.id)}
                                    className="p-1.5 rounded-md text-slate-500 hover:text-red-400
                             hover:bg-red-400/10 transition-glow shrink-0"
                                    aria-label={`Remove ${pdf.name}`}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Options + Merge button */}
            {pdfs.length > 0 && (
                <div className="glass-panel p-6 space-y-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Output Settings
                    </h2>

                    {/* Output filename */}
                    <div>
                        <label htmlFor="output-name" className="block text-sm text-slate-400 mb-2">
                            Output filename
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                id="output-name"
                                type="text"
                                value={outputName}
                                onChange={(e) => setOutputName(e.target.value)}
                                placeholder="merged"
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                           text-slate-200 text-sm placeholder-slate-600
                           focus:outline-none focus:border-neon-cyan/50 transition-glow"
                            />
                            <span className="text-sm text-slate-500">.pdf</span>
                        </div>
                    </div>

                    {/* Progress bar (visible while loading) */}
                    {loading && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Merging {pdfs.length} files…</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-emerald
                             transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Merge CTA */}
                    <button
                        onClick={handleMerge}
                        disabled={loading || pdfs.length < 2}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                       bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30
                       hover:bg-neon-cyan/30 hover:shadow-glow-cyan transition-glow
                       disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Merging…
                            </>
                        ) : (
                            <>
                                <Files size={18} />
                                Merge &amp; Download PDF
                            </>
                        )}
                    </button>

                    {pdfs.length === 1 && (
                        <p className="text-xs text-slate-500">
                            Add at least one more PDF to enable merging.
                        </p>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="glass-panel p-4 flex items-start gap-3 border border-red-500/30 bg-red-500/5">
                    <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

            {/* Success */}
            {done && !loading && (
                <div className="glass-panel p-4 flex items-center gap-3 border border-neon-emerald/30 bg-neon-emerald/5">
                    <CheckCircle2 size={20} className="text-neon-emerald shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-neon-emerald">PDF merged successfully!</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Your download should have started. Run again to produce another merge.
                        </p>
                    </div>
                    <Download size={16} className="text-neon-emerald ml-auto shrink-0" />
                </div>
            )}

            {/* Empty state */}
            {pdfs.length === 0 && !error && (
                <div className="glass-panel p-8 text-center space-y-2">
                    <Files size={28} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400 font-medium">No PDFs added yet</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Upload two or more PDF files above. Drag the cards to set the page order before merging.
                    </p>
                </div>
            )}
        </div>
    );
}
