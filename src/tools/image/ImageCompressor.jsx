import { useState, useCallback, useRef, useEffect } from 'react';
import {
    Download,
    X,
    Minimize2,
    RefreshCw,
    AlertTriangle,
    ArrowRight,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function compressImage(file, quality, outputFormat) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // Fill with white background in case of transparent png converted to jpeg
            if (outputFormat === 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Canvas conversion failed.'));
                resolve(blob);
            }, outputFormat, quality / 100);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image for compression.'));
        };

        img.src = objectUrl;
    });
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ImageCompressor() {
    const [file, setFile] = useState(null);
    const [objectUrl, setObjectUrl] = useState('');

    // Settings
    const [quality, setQuality] = useState(70); // 0-100
    const [format, setFormat] = useState('image/webp');

    // Processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultBlob, setResultBlob] = useState(null);
    const [error, setError] = useState('');

    // ---------------------------------------------------------------------------
    // Handlers
    // ---------------------------------------------------------------------------
    const handleFiles = useCallback((files) => {
        if (!files?.length) return;
        const selected = files[0];

        if (!selected.type.startsWith('image/')) {
            setError('Please select a valid image file.');
            return;
        }

        setFile(selected);
        const url = URL.createObjectURL(selected);
        setObjectUrl(url);

        // Default format logic: if it's already jpeg/webp, stick with it, else webp
        if (selected.type === 'image/jpeg') setFormat('image/jpeg');
        else setFormat('image/webp');

        setResultBlob(null);
        setError('');
    }, []);

    const clearFile = (e) => {
        e.stopPropagation();
        setFile(null);
        setObjectUrl('');
        setResultBlob(null);
        setError('');
    };

    const handleCompress = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError('');

        try {
            const blob = await compressImage(file, quality, format);
            setResultBlob(blob);
        } catch (err) {
            setError(err.message || 'An error occurred during compression.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadResult = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        const ext = format === 'image/jpeg' ? '.jpg' : '.webp';
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        a.download = `${baseName}_compressed${ext}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ---------------------------------------------------------------------------
    // Render Helpers
    // ---------------------------------------------------------------------------
    const getSavings = () => {
        if (!file || !resultBlob) return null;
        const diff = file.size - resultBlob.size;
        const percentage = ((diff / file.size) * 100).toFixed(1);

        if (diff <= 0) {
            return { msg: 'No size reduction achieved', positive: false };
        }
        return { msg: `Saved ${fmtSize(diff)} (${percentage}%)`, positive: true };
    };

    const savings = getSavings();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!file ? (
                <FileDropzone
                    accept="image/*"
                    onFiles={handleFiles}
                    label="Drop an image to compress"
                    hint="Supports JPG, PNG, WEBP (Processed locally in your browser)"
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Left Column: Previews */}
                    <div className="glass-panel p-4 flex flex-col items-center justify-center border border-white/10 relative group bg-ocean-950">
                        <button
                            onClick={clearFile}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-md hover:bg-red-500/80 transition-colors z-10"
                            title="Remove image"
                        >
                            <X size={16} />
                        </button>

                        {/* Visual Preview Area */}
                        <div className="w-full h-80 flex flex-col items-center justify-center overflow-hidden rounded checkerboard-bg relative">
                            <img
                                src={resultBlob ? URL.createObjectURL(resultBlob) : objectUrl}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain drop-shadow-lg"
                            />
                            {resultBlob && (
                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-semibold text-neon-emerald uppercase border border-neon-emerald/20">
                                    Compressed View
                                </div>
                            )}
                        </div>

                        {/* Stats Footer */}
                        <div className="w-full mt-4 flex items-center justify-between text-xs font-mono">
                            <div className="flex flex-col gap-1 text-slate-400">
                                <span className="truncate max-w-[200px] font-sans">{file.name}</span>
                                <span className={resultBlob ? 'line-through opacity-70' : ''}>Original: {fmtSize(file.size)}</span>
                            </div>

                            {resultBlob && (
                                <div className="flex items-center gap-3">
                                    <ArrowRight size={14} className="text-slate-500" />
                                    <div className="flex flex-col items-end gap-1 text-neon-emerald font-bold">
                                        <span>{fmtSize(resultBlob.size)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Controls */}
                    <div className="glass-panel p-6 border border-white/10 flex flex-col">
                        <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                            <Minimize2 size={20} className="text-neon-cyan" />
                            Compression Settings
                        </h2>

                        <div className="space-y-6 flex-1">
                            {/* 1. Format Setting */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Output Format</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setFormat('image/webp')}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${format === 'image/webp'
                                                ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan shadow-glow-cyan'
                                                : 'bg-ocean-900 border-white/10 text-slate-400 hover:bg-white/5'
                                            }`}
                                    >
                                        WebP (Best size)
                                    </button>
                                    <button
                                        onClick={() => setFormat('image/jpeg')}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${format === 'image/jpeg'
                                                ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan shadow-glow-cyan'
                                                : 'bg-ocean-900 border-white/10 text-slate-400 hover:bg-white/5'
                                            }`}
                                    >
                                        JPEG (Compatible)
                                    </button>
                                </div>
                            </div>

                            {/* 2. Quality Setting */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quality: {quality}%</label>
                                    <span className="text-xs text-slate-500">
                                        {quality > 80 ? 'High' : quality > 40 ? 'Medium' : 'Low'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={quality}
                                    onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                                    className="w-full accent-neon-cyan h-2 bg-ocean-900 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-4">

                            {savings && (
                                <div className={`p-3 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2
                        ${savings.positive
                                        ? 'bg-neon-emerald/10 border-neon-emerald/20 text-neon-emerald'
                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}
                                >
                                    {savings.positive && <Minimize2 size={16} />}
                                    {savings.msg}
                                </div>
                            )}

                            <button
                                onClick={handleCompress}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm
                               neon-btn-cyan text-neon-cyan bg-neon-cyan/10 disabled:opacity-50 transition-all hover:bg-neon-cyan/20"
                            >
                                {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                Compress Image
                            </button>

                            {resultBlob && (
                                <button
                                    onClick={downloadResult}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm
                                   bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
                                >
                                    <Download size={18} />
                                    Download Compressed
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded flex gap-2 text-sm text-red-500">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
