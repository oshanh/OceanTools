import { useCallback, useEffect, useState } from 'react';
import {
    AlertCircle,
    Archive,
    CheckCircle2,
    ChevronRight,
    Download,
    FileText,
    Loader2,
    Scissors,
    Trash2,
    LayoutGrid,
    Rows3,
    SplitSquareVertical,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import {
    splitAllPages,
    splitByRanges,
    splitByChunks,
    getPdfPageCount,
} from '../../utils/pdfSplitter';
import { downloadBlob, downloadAsZip } from '../../utils/pdfjs';

// ---------------------------------------------------------------------------
// Mode config
// ---------------------------------------------------------------------------
const MODES = [
    {
        id: 'all',
        label: 'Extract All Pages',
        description: 'Save every page as a separate PDF',
        Icon: LayoutGrid,
    },
    {
        id: 'ranges',
        label: 'Custom Ranges',
        description: 'Specify page ranges, e.g. 1-3, 5, 7-9',
        Icon: SplitSquareVertical,
    },
    {
        id: 'chunks',
        label: 'Fixed Chunks',
        description: 'Split into groups of N pages each',
        Icon: Rows3,
    },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PdfSplitter() {
    const [pdfFile, setPdfFile] = useState(null);
    const [pageCount, setPageCount] = useState(null);

    const [mode, setMode] = useState('all');
    const [rangeStr, setRangeStr] = useState('');
    const [chunkSize, setChunkSize] = useState(1);

    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]); // { label, blob }[]
    const [error, setError] = useState(null);

    // Resolve page count when a file is added
    useEffect(() => {
        if (!pdfFile) return;
        setPageCount(null);
        getPdfPageCount(pdfFile).then(setPageCount);
    }, [pdfFile]);

    const reset = useCallback(() => {
        setPdfFile(null);
        setPageCount(null);
        setResults([]);
        setError(null);
        setProgress(0);
        setRangeStr('');
        setChunkSize(1);
    }, []);

    const handleFile = useCallback((files) => {
        setPdfFile(files[0]);
        setResults([]);
        setError(null);
        setProgress(0);
    }, []);

    // ---------------------------------------------------------------------------
    // Split action
    // ---------------------------------------------------------------------------
    const handleSplit = async () => {
        if (!pdfFile) return;
        setLoading(true);
        setError(null);
        setResults([]);
        setProgress(0);

        const progressInterval = setInterval(() => {
            setProgress((p) => Math.min(p + 6, 88));
        }, 120);

        try {
            let output = [];
            if (mode === 'all') {
                output = await splitAllPages(pdfFile);
            } else if (mode === 'ranges') {
                if (!rangeStr.trim()) throw new Error('Please enter at least one page range.');
                output = await splitByRanges(pdfFile, rangeStr);
            } else {
                output = await splitByChunks(pdfFile, chunkSize);
            }

            clearInterval(progressInterval);
            setProgress(100);
            setResults(output);
        } catch (err) {
            clearInterval(progressInterval);
            setError(err.message || 'Failed to split the PDF. The file may be corrupted or encrypted.');
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------------------------
    // Download helpers
    // ---------------------------------------------------------------------------
    const handleDownloadAll = async () => {
        if (results.length === 1) {
            downloadBlob(results[0].blob, results[0].label);
            return;
        }
        await downloadAsZip(
            results.map((r) => ({ blob: r.blob, filename: r.label })),
            `${pdfFile.name.replace(/\.pdf$/i, '')}_split.zip`,
        );
    };

    // Derived
    const baseName = pdfFile?.name.replace(/\.pdf$/i, '') ?? 'document';
    const canSplit = pdfFile && !loading;

    return (
        <div className="space-y-6">
            {/* ------------------------------------------------------------------ */}
            {/* Upload                                                              */}
            {/* ------------------------------------------------------------------ */}
            {!pdfFile ? (
                <FileDropzone
                    accept=".pdf,application/pdf"
                    onFiles={handleFile}
                    label="Drop a PDF file here or click to browse"
                    hint="Supports standard PDF files · Processed entirely in your browser"
                />
            ) : (
                <div className="glass-panel p-4 flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-neon-cyan/10 text-neon-cyan shrink-0">
                        <FileText size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-medium truncate">{pdfFile.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                            {pageCount != null
                                ? ` · ${pageCount} page${pageCount !== 1 ? 's' : ''}`
                                : ' · counting pages…'}
                        </p>
                    </div>
                    <button
                        onClick={reset}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400
                       hover:bg-red-400/10 transition-glow shrink-0"
                        aria-label="Remove file"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* Mode selector + options                                             */}
            {/* ------------------------------------------------------------------ */}
            {pdfFile && (
                <div className="glass-panel p-6 space-y-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Split Mode
                    </h2>

                    {/* Mode cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {MODES.map(({ id, label, description, Icon }) => (
                            <button
                                key={id}
                                onClick={() => { setMode(id); setError(null); setResults([]); }}
                                className={`flex flex-col gap-2 p-4 rounded-xl border text-left transition-glow
                  ${mode === id
                                        ? 'bg-neon-cyan/10 border-neon-cyan/40 shadow-glow-cyan'
                                        : 'bg-white/5 border-white/10 hover:border-neon-cyan/20'
                                    }`}
                            >
                                <div className={`${mode === id ? 'text-neon-cyan' : 'text-slate-500'} transition-glow`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${mode === id ? 'text-slate-100' : 'text-slate-300'}`}>
                                        {label}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
                                </div>
                                {mode === id && (
                                    <ChevronRight size={14} className="text-neon-cyan self-end mt-auto" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Mode-specific inputs */}
                    {mode === 'ranges' && (
                        <div className="space-y-2">
                            <label htmlFor="range-input" className="block text-sm text-slate-400">
                                Page ranges
                                {pageCount && (
                                    <span className="ml-2 text-xs text-slate-600">
                                        (document has {pageCount} pages)
                                    </span>
                                )}
                            </label>
                            <input
                                id="range-input"
                                type="text"
                                value={rangeStr}
                                onChange={(e) => setRangeStr(e.target.value)}
                                placeholder="e.g. 1-3, 5, 7-9"
                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg
                           text-slate-200 text-sm placeholder-slate-600
                           focus:outline-none focus:border-neon-cyan/50 transition-glow font-mono"
                            />
                            <p className="text-xs text-slate-600">
                                Each comma-separated token creates a separate PDF file. Mixed ranges like{' '}
                                <code className="text-slate-500">1-3, 5, 7-9</code> are all valid.
                            </p>
                        </div>
                    )}

                    {mode === 'chunks' && (
                        <div className="space-y-2">
                            <label htmlFor="chunk-size" className="block text-sm text-slate-400">
                                Pages per chunk
                                {pageCount && (
                                    <span className="ml-2 text-xs text-slate-600">
                                        → {Math.ceil((pageCount ?? 0) / chunkSize)} file
                                        {Math.ceil((pageCount ?? 0) / chunkSize) !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    id="chunk-size"
                                    type="range"
                                    min="1"
                                    max={Math.max(pageCount ?? 20, 1)}
                                    step="1"
                                    value={chunkSize}
                                    onChange={(e) => setChunkSize(Number(e.target.value))}
                                    className="flex-1 accent-neon-cyan"
                                />
                                <span className="w-12 text-center text-sm font-mono text-slate-200 bg-white/5
                                 border border-white/10 rounded-lg py-1">
                                    {chunkSize}
                                </span>
                            </div>
                        </div>
                    )}

                    {mode === 'all' && pageCount != null && (
                        <p className="text-xs text-slate-500">
                            This will produce <span className="text-slate-300 font-medium">{pageCount}</span>{' '}
                            separate PDF files — one per page.
                        </p>
                    )}

                    {/* Progress bar */}
                    {loading && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Splitting PDF…</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-emerald
                             transition-all duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        onClick={handleSplit}
                        disabled={!canSplit}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                       bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30
                       hover:bg-neon-cyan/30 hover:shadow-glow-cyan transition-glow
                       disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Splitting…
                            </>
                        ) : (
                            <>
                                <Scissors size={18} />
                                Split PDF
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* Error                                                               */}
            {/* ------------------------------------------------------------------ */}
            {error && (
                <div className="glass-panel p-4 flex items-start gap-3 border border-red-500/30 bg-red-500/5">
                    <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* Results                                                             */}
            {/* ------------------------------------------------------------------ */}
            {results.length > 0 && (
                <div className="glass-panel p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-neon-emerald" />
                            <h2 className="text-sm font-semibold text-slate-200">
                                {results.length} file{results.length !== 1 ? 's' : ''} created
                            </h2>
                        </div>
                        <button
                            onClick={handleDownloadAll}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                         bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/30
                         hover:bg-neon-emerald/30 hover:shadow-glow-emerald transition-glow"
                        >
                            <Archive size={15} />
                            {results.length === 1 ? 'Download PDF' : 'Download All (ZIP)'}
                        </button>
                    </div>

                    {/* File list */}
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                        {results.map((result, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                           bg-white/5 border border-white/10 hover:border-neon-emerald/20 transition-glow"
                            >
                                <div className="p-1.5 rounded-md bg-neon-emerald/10 text-neon-emerald shrink-0">
                                    <FileText size={14} />
                                </div>
                                <p className="flex-1 text-sm text-slate-300 truncate font-mono">{result.label}</p>
                                <span className="text-xs text-slate-600 shrink-0">
                                    {(result.blob.size / 1024).toFixed(1)} KB
                                </span>
                                <button
                                    onClick={() => downloadBlob(result.blob, result.label)}
                                    className="p-1.5 rounded-md text-slate-500 hover:text-neon-emerald
                             hover:bg-neon-emerald/10 transition-glow shrink-0"
                                    aria-label={`Download ${result.label}`}
                                >
                                    <Download size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* Empty state                                                         */}
            {/* ------------------------------------------------------------------ */}
            {!pdfFile && !error && (
                <div className="glass-panel p-8 text-center space-y-2">
                    <Scissors size={28} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400 font-medium">No PDF loaded yet</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Upload a PDF above, choose how to split it, and download the resulting files.
                    </p>
                </div>
            )}
        </div>
    );
}
