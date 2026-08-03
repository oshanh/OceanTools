import { useCallback, useRef, useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Download,
    FileDown,
    FileText,
    Loader2,
    SlidersHorizontal,
    Trash2,
    TrendingDown,
    Zap,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import {
    compressPdf,
    COMPRESSION_PRESETS,
    formatBytes,
    reductionPct,
} from '../../utils/pdfCompressor';
import { downloadBlob } from '../../utils/pdfjs';

// ---------------------------------------------------------------------------
// Colour helpers (maps preset colour name → Tailwind-like class fragments)
// ---------------------------------------------------------------------------
const COLOUR_MAP = {
    emerald: {
        badge: 'bg-neon-emerald/10 text-neon-emerald border-neon-emerald/30',
        active: 'bg-neon-emerald/10 border-neon-emerald/40 shadow-glow-emerald',
        dot: 'bg-neon-emerald',
        bar: 'from-neon-emerald to-neon-cyan',
        btn: 'bg-neon-emerald/20 text-neon-emerald border-neon-emerald/30 hover:bg-neon-emerald/30 hover:shadow-glow-emerald',
        text: 'text-neon-emerald',
    },
    cyan: {
        badge: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
        active: 'bg-neon-cyan/10 border-neon-cyan/40 shadow-glow-cyan',
        dot: 'bg-neon-cyan',
        bar: 'from-neon-cyan to-neon-emerald',
        btn: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30 hover:bg-neon-cyan/30 hover:shadow-glow-cyan',
        text: 'text-neon-cyan',
    },
    amber: {
        badge: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
        active: 'bg-amber-400/10 border-amber-400/40',
        dot: 'bg-amber-400',
        bar: 'from-amber-400 to-orange-400',
        btn: 'bg-amber-400/20 text-amber-400 border-amber-400/30 hover:bg-amber-400/30',
        text: 'text-amber-400',
    },
    red: {
        badge: 'bg-red-400/10 text-red-400 border-red-400/30',
        active: 'bg-red-400/10 border-red-400/40',
        dot: 'bg-red-400',
        bar: 'from-red-400 to-orange-400',
        btn: 'bg-red-400/20 text-red-400 border-red-400/30 hover:bg-red-400/30',
        text: 'text-red-400',
    },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PdfCompressor() {
    const [pdfFile, setPdfFile] = useState(null);
    const [preset, setPreset] = useState('medium');
    const [customMode, setCustomMode] = useState(false);
    const [customQuality, setCustomQuality] = useState(0.65);
    const [customScale, setCustomScale] = useState(1.4);

    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [result, setResult] = useState(null); // { blob, originalSize, compressedSize }
    const [error, setError] = useState(null);

    const abortRef = useRef(false);

    // -------------------------------------------------------------------------
    const reset = useCallback(() => {
        setPdfFile(null);
        setResult(null);
        setError(null);
        setProgress({ current: 0, total: 0 });
    }, []);

    const handleFile = useCallback((files) => {
        setPdfFile(files[0]);
        setResult(null);
        setError(null);
        setProgress({ current: 0, total: 0 });
    }, []);

    // -------------------------------------------------------------------------
    const handleCompress = async () => {
        if (!pdfFile) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setProgress({ current: 0, total: 0 });
        abortRef.current = false;

        const options = customMode
            ? { scale: customScale, quality: customQuality }
            : { scale: COMPRESSION_PRESETS[preset].scale, quality: COMPRESSION_PRESETS[preset].quality };

        try {
            const blob = await compressPdf(pdfFile, {
                ...options,
                onProgress: (current, total) => setProgress({ current, total }),
            });

            setResult({
                blob,
                originalSize: pdfFile.size,
                compressedSize: blob.size,
            });
        } catch (err) {
            setError(err.message || 'Compression failed. The file may be corrupted or encrypted.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        const baseName = pdfFile.name.replace(/\.pdf$/i, '');
        downloadBlob(result.blob, `${baseName}_compressed.pdf`);
    };

    // -------------------------------------------------------------------------
    // Derived state
    const activePreset = COMPRESSION_PRESETS[preset];
    const colours = COLOUR_MAP[customMode ? 'cyan' : activePreset.color];
    const reduction = result ? reductionPct(result.originalSize, result.compressedSize) : 0;
    const progressPct =
        progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* ------------------------------------------------------------------ */}
            {/* Upload                                                               */}
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
                            Original size: <span className="text-slate-300">{formatBytes(pdfFile.size)}</span>
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
            {/* Settings panel                                                       */}
            {/* ------------------------------------------------------------------ */}
            {pdfFile && (
                <div className="glass-panel p-6 space-y-6">
                    {/* Section header + custom toggle */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                            Compression Level
                        </h2>
                        <button
                            onClick={() => { setCustomMode((m) => !m); setResult(null); }}
                            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-glow
                ${customMode
                                    ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30'
                                    : 'bg-white/5 text-slate-400 border-white/10 hover:border-neon-cyan/20'
                                }`}
                        >
                            <SlidersHorizontal size={12} />
                            Custom
                        </button>
                    </div>

                    {/* Preset cards */}
                    {!customMode && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {Object.entries(COMPRESSION_PRESETS).map(([key, p]) => {
                                const c = COLOUR_MAP[p.color];
                                const isActive = preset === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => { setPreset(key); setResult(null); }}
                                        className={`flex flex-col gap-2 p-4 rounded-xl border text-left transition-glow
                      ${isActive
                                                ? `${c.active}`
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        {/* Dot indicator */}
                                        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                                        <div>
                                            <p className={`text-xs font-semibold ${isActive ? c.text : 'text-slate-300'}`}>
                                                {p.label}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{p.sublabel}</p>
                                        </div>
                                        <div className={`text-xs font-mono px-1.5 py-0.5 rounded border self-start ${c.badge}`}>
                                            {Math.round(p.quality * 100)}% Q
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Custom sliders */}
                    {customMode && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm text-slate-400">
                                    JPEG Quality
                                    <span className="ml-2 font-mono text-neon-cyan">{Math.round(customQuality * 100)}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.10"
                                    max="0.95"
                                    step="0.05"
                                    value={customQuality}
                                    onChange={(e) => setCustomQuality(Number(e.target.value))}
                                    className="w-full accent-neon-cyan"
                                />
                                <div className="flex justify-between text-xs text-slate-600">
                                    <span>Smallest</span>
                                    <span>Best quality</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm text-slate-400">
                                    Render Scale
                                    <span className="ml-2 font-mono text-neon-cyan">{customScale.toFixed(1)}×</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.5"
                                    step="0.1"
                                    value={customScale}
                                    onChange={(e) => setCustomScale(Number(e.target.value))}
                                    className="w-full accent-neon-cyan"
                                />
                                <div className="flex justify-between text-xs text-slate-600">
                                    <span>Low res</span>
                                    <span>High res</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info note */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                        <Zap size={14} className="text-slate-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Compression re-renders each page as a JPEG image. Text remains readable but becomes
                            rasterized. Best suited for reducing the size of scanned or image-heavy PDFs.
                        </p>
                    </div>

                    {/* Progress bar */}
                    {loading && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>
                                    Processing page {progress.current} of {progress.total}…
                                </span>
                                <span>{progressPct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${colours.bar} transition-all duration-300`}
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        onClick={handleCompress}
                        disabled={loading}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium border
                        transition-glow disabled:opacity-50 disabled:cursor-not-allowed ${colours.btn}`}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Compressing…
                            </>
                        ) : (
                            <>
                                <FileDown size={18} />
                                Compress PDF
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* Error                                                                */}
            {/* ------------------------------------------------------------------ */}
            {error && (
                <div className="glass-panel p-4 flex items-start gap-3 border border-red-500/30 bg-red-500/5">
                    <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* Result card                                                          */}
            {/* ------------------------------------------------------------------ */}
            {result && !loading && (
                <div className="glass-panel p-6 space-y-5 border border-neon-emerald/20 bg-neon-emerald/5">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-neon-emerald" />
                        <h2 className="text-sm font-semibold text-neon-emerald">Compression complete</h2>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-xs text-slate-500 mb-1">Original</p>
                            <p className="text-lg font-bold text-slate-200 font-mono">
                                {formatBytes(result.originalSize)}
                            </p>
                        </div>

                        <div className="text-center p-3 rounded-lg bg-neon-emerald/10 border border-neon-emerald/20">
                            <p className="text-xs text-neon-emerald mb-1 flex items-center justify-center gap-1">
                                <TrendingDown size={10} /> Reduced by
                            </p>
                            <p className="text-2xl font-bold text-neon-emerald font-mono">
                                {reduction}%
                            </p>
                        </div>

                        <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-xs text-slate-500 mb-1">Compressed</p>
                            <p className="text-lg font-bold text-slate-200 font-mono">
                                {formatBytes(result.compressedSize)}
                            </p>
                        </div>
                    </div>

                    {/* Size bar visualisation */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Size comparison</span>
                            <span>{formatBytes(result.originalSize - result.compressedSize)} saved</span>
                        </div>
                        <div className="h-3 rounded-full bg-white/10 overflow-hidden relative">
                            {/* original bar (full width reference) */}
                            <div className="absolute inset-0 rounded-full bg-white/10" />
                            {/* compressed bar */}
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-emerald transition-all duration-700"
                                style={{ width: `${100 - reduction}%` }}
                            />
                        </div>
                    </div>

                    {/* Download button */}
                    <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                       bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/30
                       hover:bg-neon-emerald/30 hover:shadow-glow-emerald transition-glow"
                    >
                        <Download size={18} />
                        Download Compressed PDF
                    </button>
                </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* Empty state                                                          */}
            {/* ------------------------------------------------------------------ */}
            {!pdfFile && !error && (
                <div className="glass-panel p-8 text-center space-y-2">
                    <FileDown size={28} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400 font-medium">No PDF loaded yet</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Upload a PDF above, choose a compression level, and download the smaller output file.
                    </p>
                </div>
            )}
        </div>
    );
}
