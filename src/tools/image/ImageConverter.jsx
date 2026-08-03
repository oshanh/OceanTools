import { useState, useCallback } from 'react';
import {
    Download,
    X,
    RefreshCw,
    AlertTriangle,
    ArrowRight,
    ImageIcon,
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

function convertImage(file, outputFormat) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // Fill with white background in case of transparent PNG/WEBP converted to JPEG
            if (outputFormat === 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            // We don't apply an aggressive quality loss factor here as it's purely a format converter
            // If user wants JPEG/WEBP, we use browser default (usually ~0.92) or 1.0 depending on browser
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Canvas conversion failed.'));
                resolve(blob);
            }, outputFormat, 0.95);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image for conversion.'));
        };

        img.src = objectUrl;
    });
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ImageConverter() {
    const [file, setFile] = useState(null);
    const [objectUrl, setObjectUrl] = useState('');

    // Settings
    const [format, setFormat] = useState('image/png');

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

        // Auto-select a different output format than the input
        if (selected.type === 'image/png') setFormat('image/jpeg');
        else if (selected.type === 'image/jpeg') setFormat('image/png');
        else setFormat('image/png'); // Default fallback for HEIC/TIFF etc

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

    const handleConvert = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError('');

        try {
            const blob = await convertImage(file, format);
            setResultBlob(blob);
        } catch (err) {
            setError(err.message || 'An error occurred during conversion.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadResult = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;

        const extRaw = format.split('/')[1];
        // map 'jpeg' to 'jpg' for common usage
        const ext = extRaw === 'jpeg' ? 'jpg' : extRaw;

        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        a.download = `${baseName}_converted.${ext}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formats = [
        { id: 'image/png', label: 'PNG' },
        { id: 'image/jpeg', label: 'JPG' },
        { id: 'image/webp', label: 'WEBP' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!file ? (
                <FileDropzone
                    accept="image/*"
                    onFiles={handleFiles}
                    label="Drop an image to convert"
                    hint="Supports JPG, PNG, WEBP, and more (Processed safely offline)"
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
                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-semibold text-neon-cyan uppercase border border-neon-cyan/20">
                                    Converted View
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
                                    <div className="flex flex-col items-end gap-1 text-neon-cyan font-bold">
                                        <span>{fmtSize(resultBlob.size)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Controls */}
                    <div className="glass-panel p-6 border border-white/10 flex flex-col">
                        <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                            <RefreshCw size={20} className="text-neon-cyan" />
                            Converter Settings
                        </h2>

                        <div className="space-y-6 flex-1">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Format</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {formats.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => {
                                                setFormat(f.id);
                                                if (resultBlob) setResultBlob(null); // Clear result if user changes mind
                                            }}
                                            className={`py-3 px-2 rounded-lg text-sm font-bold border transition-all ${format === f.id
                                                    ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan shadow-glow-cyan'
                                                    : 'bg-ocean-900 border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed'
                                                }`}
                                            disabled={file.type === f.id}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2 text-center pt-2">
                                    {format === 'image/jpeg' ? 'JPEG: Great for photos, removes transparency.' :
                                        format === 'image/webp' ? 'WEBP: Modern format with excellent compression.' :
                                            'PNG: Lossless format, perfectly preserves transparency.'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-4">

                            <button
                                onClick={handleConvert}
                                disabled={isProcessing || !format || file.type === format}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm
                               neon-btn-cyan text-neon-cyan bg-neon-cyan/10 disabled:opacity-50 transition-all hover:bg-neon-cyan/20"
                            >
                                {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                                Convert to {formats.find(f => f.id === format)?.label || 'Format'}
                            </button>

                            {resultBlob && (
                                <button
                                    onClick={downloadResult}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm
                                   bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all shadow-lg"
                                >
                                    <Download size={18} />
                                    Download Converted File
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
