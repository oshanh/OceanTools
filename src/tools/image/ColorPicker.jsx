import { useState, useRef, useEffect } from 'react';
import { Pipette, X, Copy, Check, Palette, Focus, Sparkles, Download } from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';

function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export default function ColorPicker() {
    const [fileUrl, setFileUrl] = useState(null);
    const canvasRef = useRef(null);
    const imageRef = useRef(null);

    // Hovered and Picked States
    const [hoverColor, setHoverColor] = useState(null);
    const [pickedColors, setPickedColors] = useState([]);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [autoCount, setAutoCount] = useState(24);

    const handleFiles = (files) => {
        if (!files || files.length === 0) return;
        const url = URL.createObjectURL(files[0]);
        setFileUrl(url);

        // Reset states
        setHoverColor(null);
        setPickedColors([]);
    };

    const handleClear = () => {
        if (fileUrl) URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
        setHoverColor(null);
        setPickedColors([]);
    };

    // Paint the canvas once image loads
    useEffect(() => {
        if (!fileUrl || !canvasRef.current || !imageRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const img = imageRef.current;

        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
        };
    }, [fileUrl]);

    // Track mouse correctly via scaled bounding boxes
    const getPixelData = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let x = (e.clientX - rect.left) * scaleX;
        let y = (e.clientY - rect.top) * scaleY;

        // Boundaries safety
        x = Math.max(0, Math.min(x, canvas.width - 1));
        y = Math.max(0, Math.min(y, canvas.height - 1));

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const pixel = ctx.getImageData(x, y, 1, 1).data;

        if (pixel[3] === 0) return null; // Transparent perfectly

        return {
            r: pixel[0],
            g: pixel[1],
            b: pixel[2]
        };
    };

    const handleMouseMove = (e) => {
        const data = getPixelData(e);
        if (data) {
            setHoverColor({
                hex: rgbToHex(data.r, data.g, data.b),
                rgb: `rgb(${data.r}, ${data.g}, ${data.b})`,
                hsl: rgbToHsl(data.r, data.g, data.b)
            });
        }
    };

    const handleClick = (e) => {
        const data = getPixelData(e);
        if (data) {
            const newColor = {
                hex: rgbToHex(data.r, data.g, data.b),
                rgb: `rgb(${data.r}, ${data.g}, ${data.b})`,
                hsl: rgbToHsl(data.r, data.g, data.b),
                id: Date.now()
            };

            setPickedColors(prev => {
                const updated = [newColor, ...prev];
                return updated.slice(0, 8); // Keep last 8 picked colors
            });
        }
    };

    const handleCopy = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(id);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch { }
    };

    const extractAutoColors = () => {
        if (!imageRef.current) return;
        const img = imageRef.current;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Massive downscale to instantly calculate over 20,000 pixels instead of millions
        canvas.width = 150;
        canvas.height = 150;
        ctx.drawImage(img, 0, 0, 150, 150);

        const data = ctx.getImageData(0, 0, 150, 150).data;
        const colorMap = new Map();

        // Bins color matrices mathematically. If requesting tons of colors (e.g. 100), we decrease bin size to find tighter micro-differences.
        const BIN = autoCount > 20 ? 6 : 15;

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 128) continue; // Skip transparency
            let r = Math.round(data[i] / BIN) * BIN;
            let g = Math.round(data[i + 1] / BIN) * BIN;
            let b = Math.round(data[i + 2] / BIN) * BIN;
            r = Math.min(255, r);
            g = Math.min(255, g);
            b = Math.min(255, b);

            const key = `${r},${g},${b}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        const sorted = [...colorMap.entries()].sort((a, b) => b[1] - a[1]);
        const minDist = autoCount > 20 ? 10 : 25;
        const selected = [];

        for (const [rgbKey, count] of sorted) {
            const [r, g, b] = rgbKey.split(',').map(Number);
            let tooClose = false;

            // Check euclidean RGB distance to prevent pulling strictly identical localized shades
            for (const sel of selected) {
                const dist = Math.sqrt(Math.pow(r - sel.r, 2) + Math.pow(g - sel.g, 2) + Math.pow(b - sel.b, 2));
                if (dist < minDist) {
                    tooClose = true;
                    break;
                }
            }
            if (!tooClose) {
                selected.push({ r, g, b });
                if (selected.length >= autoCount) break;
            }
        }

        const newColors = selected.map((s, idx) => ({
            hex: rgbToHex(s.r, s.g, s.b),
            rgb: `rgb(${s.r}, ${s.g}, ${s.b})`,
            hsl: rgbToHsl(s.r, s.g, s.b),
            id: Date.now() + idx
        }));

        setPickedColors(newColors);
    };

    const downloadPalettePng = () => {
        if (pickedColors.length === 0) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const PADDING = 40;
        const SWATCH_SIZE = 120;
        const SPACING = 20;
        const LABEL_HEIGHT = 45;

        // Calculate grid (Prefer horizontal for small, wrap around for massive 100 lists)
        let cols = Math.ceil(Math.sqrt(pickedColors.length));
        if (pickedColors.length <= 8) {
            cols = pickedColors.length;
        } else if (cols > 10) {
            cols = 10;
        }

        const rows = Math.ceil(pickedColors.length / cols);

        canvas.width = PADDING * 2 + cols * SWATCH_SIZE + (cols - 1) * SPACING;
        canvas.height = PADDING * 2 + rows * (SWATCH_SIZE + LABEL_HEIGHT) + (rows - 1) * SPACING;

        // Fill canvas with deep ocean dark theme background
        ctx.fillStyle = '#0f172a'; // slate-950
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Write header
        ctx.fillStyle = '#94a3b8'; // slate-400
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Color Palette (${pickedColors.length} Colors) // OceanTools`, PADDING, PADDING - 15);

        pickedColors.forEach((color, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const x = PADDING + col * (SWATCH_SIZE + SPACING);
            const y = PADDING + row * (SWATCH_SIZE + LABEL_HEIGHT + SPACING);

            // Draw Swatch
            ctx.fillStyle = color.hex;
            ctx.fillRect(x, y, SWATCH_SIZE, SWATCH_SIZE);

            // Minimalist inside-border glow
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#ffffff20';
            ctx.strokeRect(x, y, SWATCH_SIZE, SWATCH_SIZE);

            // Draw text mappings
            ctx.fillStyle = '#f8fafc'; // slate-50
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(color.hex, x + (SWATCH_SIZE / 2), y + SWATCH_SIZE + 22);

            ctx.fillStyle = '#64748b'; // slate-500
            ctx.font = '11px monospace';
            ctx.fillText(color.rgb, x + (SWATCH_SIZE / 2), y + SWATCH_SIZE + 38);
        });

        const link = document.createElement('a');
        link.download = `OceanTools-Palette-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-neon-cyan/20 rounded-xl border border-neon-cyan/30 text-neon-cyan shadow-glow-cyan">
                        <Pipette size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-100 text-lg">Image Color Picker</h2>
                        <p className="text-slate-400 text-xs">Extract beautiful palettes perfectly from your photos.</p>
                    </div>
                </div>
            </div>

            {!fileUrl ? (
                <FileDropzone
                    accept="image/*"
                    onFiles={handleFiles}
                    label="Drop an Image Here"
                    hint="We process images entirely locally inside your browser."
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Col: Canvas Image Workspace */}
                    <div className="lg:col-span-8 glass-panel p-4 border border-white/10 flex flex-col items-center gap-4 relative overflow-hidden group">

                        <div className="w-full flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Focus size={16} className="text-neon-cyan" /> Select Region
                            </div>
                            <button
                                onClick={handleClear}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded transition-colors flex items-center gap-2 text-xs font-bold"
                            >
                                <X size={14} /> Clear Image
                            </button>
                        </div>

                        {/* Hidden image element strictly for triggering onload and canvas syncing */}
                        <img ref={imageRef} src={fileUrl} alt="source" className="hidden" />

                        <div className="w-full h-auto bg-ocean-950 rounded-lg overflow-hidden checkerboard-bg relative cursor-crosshair shadow-lg border border-white/5 flex items-center justify-center">
                            <canvas
                                ref={canvasRef}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={() => setHoverColor(null)}
                                onClick={handleClick}
                                className="max-w-full max-h-[600px] object-contain drop-shadow-lg transition-transform"
                            />
                        </div>

                        <p className="text-xs text-slate-500 italic">Click anywhere on the image above to statically latch a color.</p>
                    </div>

                    {/* Right Col: Analyzers */}
                    <div className="lg:col-span-4 flex flex-col gap-6">

                        {/* Active Reticle */}
                        <div className="glass-panel p-5 border border-white/10 rounded-2xl flex flex-col gap-4 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-300">
                                <Focus size={16} className="text-neon-emerald" />
                                Active Hover
                            </div>

                            <div className="w-full h-24 rounded-lg shadow-inner border border-white/10 flex items-center justify-center checkerboard-bg relative overflow-hidden transition-all duration-75">
                                {hoverColor ? (
                                    <div className="absolute inset-0" style={{ backgroundColor: hoverColor.hex }} />
                                ) : (
                                    <span className="text-slate-600 font-bold text-xs relative z-10 p-2 bg-ocean-950/80 rounded backdrop-blur">
                                        NO SIGNAL
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 font-mono text-sm">
                                <div className="flex justify-between items-center bg-ocean-900/60 p-2 text-slate-400 rounded">
                                    <span>HEX:</span> <span className="font-bold text-white tracking-widest">{hoverColor ? hoverColor.hex : '---'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-ocean-900/60 p-2 text-slate-400 rounded">
                                    <span>RGB:</span> <span className="font-bold text-white tracking-widest">{hoverColor ? hoverColor.rgb : '---'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-ocean-900/60 p-2 text-slate-400 rounded">
                                    <span>HSL:</span> <span className="font-bold text-white tracking-widest">{hoverColor ? hoverColor.hsl : '---'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Picked Colors History */}
                        <div className="glass-panel p-5 border border-white/10 flex flex-col gap-4">
                            <div className="flex items-center justify-between text-sm font-bold uppercase tracking-widest text-slate-300">
                                <div className="flex items-center gap-2">
                                    <Palette size={16} className="text-fuchsia-400" />
                                    Palette History
                                </div>
                                {pickedColors.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={downloadPalettePng}
                                            className="bg-neon-emerald/10 text-neon-emerald hover:bg-neon-emerald/20 px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold transition-all shadow-glow-emerald"
                                        >
                                            <Download size={12} /> PNG
                                        </button>
                                        <button
                                            onClick={() => setPickedColors([])}
                                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2 py-1 rounded font-bold text-[10px] transition-colors"
                                        >
                                            CLEAR
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 min-h-[250px] max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                {pickedColors.length === 0 ? (
                                    <div className="flex flex-col h-full items-center justify-center text-slate-500 italic text-sm mt-12 mx-4 text-center">
                                        Click the image to begin saving colors into your temporary palette.
                                    </div>
                                ) : pickedColors.length <= 8 ? (
                                    pickedColors.map(c => (
                                        <div key={c.id} className="flex items-stretch bg-ocean-900/60 border border-white/5 rounded-lg overflow-hidden group">

                                            {/* Color View */}
                                            <div className="w-12 border-r border-white/5 relative">
                                                <div className="absolute inset-0" style={{ backgroundColor: c.hex }} />
                                            </div>

                                            {/* Data View */}
                                            <div className="flex-1 p-2 flex flex-col gap-1 text-[11px] font-mono text-slate-300 relative">
                                                <span>{c.hex}</span>
                                                <span className="opacity-70">{c.rgb}</span>

                                                {/* Hover Copy Button */}
                                                <button
                                                    onClick={() => handleCopy(c.hex, c.id)}
                                                    className="absolute inset-y-0 right-0 bg-ocean-900/90 backdrop-blur w-12 flex items-center justify-center border-l border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:text-neon-cyan hover:bg-ocean-800"
                                                >
                                                    {copiedIndex === c.id ? <Check size={16} className="text-neon-emerald" /> : <Copy size={16} />}
                                                </button>
                                            </div>

                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {pickedColors.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => handleCopy(c.hex, c.id)}
                                                className="w-8 h-8 rounded-md relative group shadow-lg transition-transform hover:scale-110 hover:z-10 focus:outline-none"
                                            >
                                                <div className="absolute inset-0 rounded-md border border-white/10" style={{ backgroundColor: c.hex }} />
                                                {copiedIndex === c.id && (
                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-md flex items-center justify-center pointer-events-none">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                )}
                                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 font-mono tracking-widest hidden sm:block">
                                                    {c.hex}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Auto-Detect Dominant Colors</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number" min="1" max="100"
                                        value={autoCount}
                                        onChange={(e) => setAutoCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                                        className="w-16 bg-ocean-950 border border-white/10 rounded-lg px-2 text-center text-sm font-bold text-white focus:outline-none focus:border-neon-cyan/50"
                                    />
                                    <button
                                        onClick={extractAutoColors}
                                        className="flex-1 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={14} /> Extract Palette
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            )}
        </div>
    );
}
