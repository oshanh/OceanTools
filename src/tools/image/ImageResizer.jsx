import { useState, useCallback } from 'react';
import {
    UploadCloud,
    Image as ImageIcon,
    Download,
    X,
    Lock,
    Unlock,
    Maximize2,
    RefreshCw,
    AlertTriangle,
} from 'lucide-react';
import { resizeImage, getImageDimensions } from '../../utils/imageResizer';
import FileDropzone from '../../components/tools/FileDropzone';

export default function ImageResizer() {
    const [file, setFile] = useState(null);
    const [objectUrl, setObjectUrl] = useState('');

    // Dimensions state
    const [originalDims, setOriginalDims] = useState({ width: 0, height: 0 });
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');

    // Settings
    const [maintainRatio, setMaintainRatio] = useState(true);
    const [ratio, setRatio] = useState(1);
    const [lastEdited, setLastEdited] = useState('width'); // 'width' | 'height'

    // Processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultBlob, setResultBlob] = useState(null);
    const [resultDims, setResultDims] = useState(null);
    const [error, setError] = useState('');

    // ---------------------------------------------------------------------------
    // File Handling
    // ---------------------------------------------------------------------------
    const handleFiles = useCallback(async (files) => {
        if (!files?.length) return;
        const selected = files[0];

        // Quick MIME type check in case OS drag/drop ignores the 'accept' filter
        if (!selected.type.startsWith('image/')) {
            setError('Please drop a valid image file.');
            return;
        }

        setFile(selected);
        const url = URL.createObjectURL(selected);
        setObjectUrl(url);

        // Reset previous outputs
        setResultBlob(null);
        setResultDims(null);
        setError('');

        try {
            const dims = await getImageDimensions(selected);
            setOriginalDims(dims);

            const newRatio = dims.width / dims.height;
            setRatio(newRatio);

            setWidth(dims.width);
            setHeight(dims.height);
            setLastEdited('width');
        } catch (err) {
            setError('Could not read image dimensions. File may be corrupted.');
        }
    }, []);

    const clearFile = (e) => {
        e.stopPropagation();
        setFile(null);
        setObjectUrl('');
        setResultBlob(null);
        setWidth('');
        setHeight('');
        setError('');
    };

    // ---------------------------------------------------------------------------
    // Dimension Linkage Logic
    // ---------------------------------------------------------------------------
    const handleWidthChange = (val) => {
        setWidth(val);
        setLastEdited('width');
        if (maintainRatio && ratio > 0 && val !== '') {
            const w = parseInt(val, 10);
            if (!isNaN(w)) setHeight(Math.round(w / ratio));
        }
    };

    const handleHeightChange = (val) => {
        setHeight(val);
        setLastEdited('height');
        if (maintainRatio && ratio > 0 && val !== '') {
            const h = parseInt(val, 10);
            if (!isNaN(h)) setWidth(Math.round(h * ratio));
        }
    };

    const toggleRatioLock = () => {
        const nextState = !maintainRatio;
        setMaintainRatio(nextState);
        if (nextState && width && height) {
            // Re-apply ratio based on the most recently edited field
            if (lastEdited === 'width') {
                const w = parseInt(width, 10);
                if (!isNaN(w)) setHeight(Math.round(w / ratio));
            } else {
                const h = parseInt(height, 10);
                if (!isNaN(h)) setWidth(Math.round(h * ratio));
            }
        }
    };

    // ---------------------------------------------------------------------------
    // Processing
    // ---------------------------------------------------------------------------
    const handleResize = async () => {
        if (!file) return;

        const parsedW = parseInt(width, 10);
        const parsedH = parseInt(height, 10);

        if (isNaN(parsedW) || isNaN(parsedH) || parsedW <= 0 || parsedH <= 0) {
            setError('Dimensions must be valid positive numbers.');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const res = await resizeImage(file, {
                width: parsedW,
                height: parsedH,
                maintainAspectRatio: maintainRatio,
                isWidthPriority: lastEdited === 'width'
            });

            setResultBlob(res.blob);
            setResultDims(res.resultDimensions);

            // Update UI in case ratio auto-adjusted the other axis slightly (rounding)
            setWidth(res.resultDimensions.width);
            setHeight(res.resultDimensions.height);

        } catch (err) {
            setError(err.message || 'An error occurred while resizing.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadResult = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resized_${file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const fmtSize = (bytes) => (bytes / 1024).toFixed(1) + ' KB';

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------
    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {!file ? (
                <FileDropzone
                    accept="image/png, image/jpeg, image/webp"
                    onFiles={handleFiles}
                    label="Drop an image here or click to browse"
                    hint="Supports JPG, PNG, WEBP (Processed locally)"
                />
            ) : (
                // Main Resizer Interface
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Left Column: Image Preview */}
                    <div className="glass-panel p-4 flex flex-col items-center justify-center border border-white/10 relative group bg-ocean-950">
                        <button
                            onClick={clearFile}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-md hover:bg-red-500/80 transition-colors z-10"
                            title="Remove image"
                        >
                            <X size={16} />
                        </button>

                        <div className="w-full h-64 md:h-80 flex items-center justify-center overflow-hidden rounded checkerboard-bg">
                            <img
                                src={resultBlob ? URL.createObjectURL(resultBlob) : objectUrl}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain drop-shadow-lg"
                            />
                        </div>

                        <div className="w-full mt-4 flex items-center justify-between text-xs text-slate-400">
                            <span className="truncate flex-1 pr-4">{file.name}</span>
                            <span className="font-mono whitespace-nowrap">
                                {resultBlob ? fmtSize(resultBlob.size) : fmtSize(file.size)}
                            </span>
                        </div>
                    </div>

                    {/* Right Column: Controls */}
                    <div className="glass-panel p-6 border border-white/10 flex flex-col">
                        <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                            <Maximize2 size={20} className="text-neon-cyan" />
                            Resize Settings
                        </h2>

                        {/* Original Info */}
                        <div className="mb-6 bg-white/5 rounded-lg p-3 border border-white/5 flex justify-between items-center text-sm">
                            <span className="text-slate-400">Original Dimensions</span>
                            <span className="font-mono text-neon-emerald">{originalDims.width} × {originalDims.height} px</span>
                        </div>

                        {/* Inputs Box */}
                        <div className="flex items-center gap-4 relative isolate">

                            {/* Width */}
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Width (px)</label>
                                <input
                                    type="number"
                                    value={width}
                                    onChange={(e) => handleWidthChange(e.target.value)}
                                    className="w-full bg-ocean-900 border border-white/10 rounded-lg px-4 py-3 font-mono text-slate-200 focus:outline-none focus:border-neon-cyan/50 focus:shadow-glow-cyan transition-glow"
                                />
                            </div>

                            {/* Link Toggle button in the middle */}
                            <div className="flex flex-col justify-end mt-4 z-10">
                                <button
                                    onClick={toggleRatioLock}
                                    className={`p-2 rounded-full border transition-all ${maintainRatio ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-ocean-900 border-white/20 text-slate-500 hover:text-slate-300'}`}
                                    title={maintainRatio ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
                                >
                                    {maintainRatio ? <Lock size={16} /> : <Unlock size={16} />}
                                </button>
                                {/* Visual linking lines (purely aesthetic behind the button) */}
                                {maintainRatio && (
                                    <div className="absolute top-1/2 left-0 right-0 h-10 border-x-2 border-t-2 border-neon-cyan/20 rounded-t-xl -z-10 mt-1 pointer-events-none" />
                                )}
                            </div>

                            {/* Height */}
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Height (px)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => handleHeightChange(e.target.value)}
                                    className="w-full bg-ocean-900 border border-white/10 rounded-lg px-4 py-3 font-mono text-slate-200 focus:outline-none focus:border-neon-cyan/50 focus:shadow-glow-cyan transition-glow"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-4">
                            <button
                                onClick={handleResize}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm
                               neon-btn-cyan text-neon-cyan bg-neon-cyan/10 disabled:opacity-50 transition-all"
                            >
                                {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Maximize2 size={18} />}
                                Apply Resize
                            </button>

                            {resultBlob && (
                                <button
                                    onClick={downloadResult}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm
                                   bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/30 hover:bg-neon-emerald/30 hover:shadow-glow-emerald transition-all"
                                >
                                    <Download size={18} />
                                    Download Resized Image ({fmtSize(resultBlob.size)})
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded flex gap-2 text-sm text-red-400">
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
