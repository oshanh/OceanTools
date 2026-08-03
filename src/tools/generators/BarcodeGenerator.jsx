import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    Check,
    Copy,
    Download,
    ScanBarcode,
    SlidersHorizontal,
    Type,
} from 'lucide-react';
import {
    BARCODE_FORMATS,
    FORMAT_CATEGORIES,
    renderToSvg,
    svgToPngBlob,
    svgToSvgBlob,
} from '../../utils/barcodeGenerator';
import { downloadBlob } from '../../utils/pdfjs';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const inputCls =
    'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg ' +
    'text-slate-200 text-sm placeholder-slate-600 ' +
    'focus:outline-none focus:border-neon-cyan/50 transition-glow';

const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BarcodeGenerator() {
    const [formatId, setFormatId] = useState('CODE128');
    const [value, setValue] = useState('Hello, World!');
    const [validationMsg, setValidMsg] = useState('');

    // Appearance
    const [lineColor, setLineColor] = useState('#ffffff');
    const [bgColor, setBgColor] = useState('#0f172a');
    const [barWidth, setBarWidth] = useState(2);
    const [barHeight, setBarHeight] = useState(100);
    const [displayValue, setDisplayValue] = useState(true);
    const [fontSize, setFontSize] = useState(14);
    const [margin, setMargin] = useState(12);

    const [renderError, setRenderError] = useState(false);
    const [copied, setCopied] = useState(false);

    const svgRef = useRef(null);
    const debounceRef = useRef(null);

    // Current format definition
    const fmt = BARCODE_FORMATS.find((f) => f.id === formatId);

    // -------------------------------------------------------------------------
    // Validate + render (debounced)
    // -------------------------------------------------------------------------
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (!svgRef.current || !value) {
                setValidMsg('');
                setRenderError(false);
                return;
            }

            // Validate
            const result = fmt?.validate(value);
            if (result !== true) {
                setValidMsg(typeof result === 'string' ? result : 'Invalid value for this format.');
                setRenderError(true);
                return;
            }
            setValidMsg('');

            // Render
            const ok = renderToSvg(svgRef.current, formatId, value, {
                lineColor,
                background: bgColor,
                width: barWidth,
                height: barHeight,
                displayValue,
                fontSize,
                margin,
            });
            setRenderError(!ok);
        }, 250);

        return () => clearTimeout(debounceRef.current);
    }, [formatId, value, lineColor, bgColor, barWidth, barHeight, displayValue, fontSize, margin, fmt]);

    // -------------------------------------------------------------------------
    // Format switch — reset value to placeholder
    // -------------------------------------------------------------------------
    const switchFormat = (id) => {
        setFormatId(id);
        const f = BARCODE_FORMATS.find((x) => x.id === id);
        if (f) setValue(f.placeholder);
        setValidMsg('');
        setRenderError(false);
    };

    // -------------------------------------------------------------------------
    // Downloads
    // -------------------------------------------------------------------------
    const handleDownloadPng = useCallback(async () => {
        if (!svgRef.current || renderError) return;
        try {
            const blob = await svgToPngBlob(svgRef.current);
            downloadBlob(blob, `barcode_${formatId.toLowerCase()}.png`);
        } catch { /* silent */ }
    }, [formatId, renderError]);

    const handleDownloadSvg = useCallback(() => {
        if (!svgRef.current || renderError) return;
        const blob = svgToSvgBlob(svgRef.current);
        downloadBlob(blob, `barcode_${formatId.toLowerCase()}.svg`);
    }, [formatId, renderError]);

    const handleCopyValue = useCallback(() => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [value]);

    // -------------------------------------------------------------------------
    // Is the barcode ready to show/export?
    // -------------------------------------------------------------------------
    const isReady = value.length > 0 && !renderError && !validationMsg;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* ================================================================== */}
            {/* Left column — inputs                                                */}
            {/* ================================================================== */}
            <div className="lg:col-span-3 space-y-5">

                {/* ---- Format picker ---- */}
                <div className="glass-panel p-5 space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Barcode Format
                    </h2>

                    {Object.entries(FORMAT_CATEGORIES).map(([cat, formats]) => (
                        <div key={cat}>
                            <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">{cat}</p>
                            <div className="flex flex-wrap gap-2">
                                {formats.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => switchFormat(f.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-glow
                      ${formatId === f.id
                                                ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40'
                                                : 'bg-white/5 text-slate-400 border-white/10 hover:border-neon-cyan/20 hover:text-slate-300'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Format description */}
                    {fmt && (
                        <p className="text-xs text-slate-500 bg-white/5 border border-white/10
                          rounded-lg px-3 py-2 leading-relaxed">
                            <span className="font-semibold text-slate-400">{fmt.label}:</span>{' '}
                            {fmt.description}
                        </p>
                    )}
                </div>

                {/* ---- Value input ---- */}
                <div className="glass-panel p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Type size={14} />
                            Value
                        </h2>
                        <button onClick={handleCopyValue}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-neon-cyan transition-glow">
                            {copied ? <Check size={11} className="text-neon-emerald" /> : <Copy size={11} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <input
                        className={`${inputCls} font-mono ${validationMsg ? 'border-red-500/50' : ''}`}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={fmt?.placeholder ?? ''}
                        spellCheck={false}
                    />

                    {/* Validation message */}
                    {validationMsg ? (
                        <div className="flex items-start gap-2 text-xs text-red-400">
                            <AlertCircle size={12} className="shrink-0 mt-0.5" />
                            {validationMsg}
                        </div>
                    ) : (
                        isReady && (
                            <p className="text-xs text-neon-emerald flex items-center gap-1">
                                <Check size={11} /> Valid {fmt?.label} value
                            </p>
                        )
                    )}
                </div>

                {/* ---- Appearance ---- */}
                <div className="glass-panel p-5 space-y-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <SlidersHorizontal size={14} />
                        Appearance
                    </h2>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Bar Color</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={lineColor}
                                    onChange={(e) => setLineColor(e.target.value)}
                                    className="w-10 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                                <input className={`${inputCls} font-mono`} value={lineColor}
                                    onChange={(e) => setLineColor(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Background</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={bgColor}
                                    onChange={(e) => setBgColor(e.target.value)}
                                    className="w-10 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                                <input className={`${inputCls} font-mono`} value={bgColor}
                                    onChange={(e) => setBgColor(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Bar dimensions */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>
                                Bar Width <span className="text-neon-cyan font-mono">{barWidth}px</span>
                            </label>
                            <input type="range" min="1" max="5" step="0.5" value={barWidth}
                                onChange={(e) => setBarWidth(Number(e.target.value))}
                                className="w-full accent-neon-cyan" />
                        </div>
                        <div>
                            <label className={labelCls}>
                                Bar Height <span className="text-neon-cyan font-mono">{barHeight}px</span>
                            </label>
                            <input type="range" min="30" max="250" step="5" value={barHeight}
                                onChange={(e) => setBarHeight(Number(e.target.value))}
                                className="w-full accent-neon-cyan" />
                        </div>
                    </div>

                    {/* Text / margin */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>
                                Font Size <span className="text-neon-cyan font-mono">{fontSize}px</span>
                            </label>
                            <input type="range" min="8" max="28" step="1" value={fontSize}
                                disabled={!displayValue}
                                onChange={(e) => setFontSize(Number(e.target.value))}
                                className="w-full accent-neon-cyan disabled:opacity-30" />
                        </div>
                        <div>
                            <label className={labelCls}>
                                Margin <span className="text-neon-cyan font-mono">{margin}px</span>
                            </label>
                            <input type="range" min="0" max="40" step="2" value={margin}
                                onChange={(e) => setMargin(Number(e.target.value))}
                                className="w-full accent-neon-cyan" />
                        </div>
                    </div>

                    {/* Show text toggle */}
                    <label className="flex items-center gap-3 cursor-pointer select-none group">
                        <div
                            onClick={() => setDisplayValue((v) => !v)}
                            className={`relative w-10 h-5 rounded-full border transition-all duration-200 cursor-pointer
                ${displayValue
                                    ? 'bg-neon-cyan/20 border-neon-cyan/50'
                                    : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-200
                ${displayValue
                                    ? 'translate-x-5 bg-neon-cyan'
                                    : 'translate-x-0 bg-slate-500'
                                }`} />
                        </div>
                        <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-glow">
                            Show value text below barcode
                        </span>
                    </label>

                    {/* Quick theme presets */}
                    <div>
                        <label className={labelCls}>Quick Themes</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { bars: '#ffffff', bg: '#0f172a', label: 'Ocean' },
                                { bars: '#0f172a', bg: '#ffffff', label: 'Classic' },
                                { bars: '#22d3ee', bg: '#0f172a', label: 'Cyan' },
                                { bars: '#34d399', bg: '#0a1f17', label: 'Emerald' },
                                { bars: '#f59e0b', bg: '#1c1408', label: 'Amber' },
                                { bars: '#f472b6', bg: '#1a0a14', label: 'Pink' },
                            ].map((t) => (
                                <button key={t.label}
                                    onClick={() => { setLineColor(t.bars); setBgColor(t.bg); }}
                                    style={{ background: t.bg, color: t.bars }}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                             border border-white/10 hover:border-neon-cyan/30 transition-glow">
                                    <span className="w-2.5 h-2.5 rounded-sm border border-current"
                                        style={{ background: t.bars }} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ================================================================== */}
            {/* Right column — preview + download                                   */}
            {/* ================================================================== */}
            <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6">
                <div className="glass-panel p-5 space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Preview
                    </h2>

                    {/* SVG preview box */}
                    <div
                        className="rounded-xl overflow-hidden border border-white/10
                        flex items-center justify-center min-h-[160px] p-4 transition-all"
                        style={{ background: bgColor }}
                    >
                        {!isReady && !value ? (
                            <div className="flex flex-col items-center gap-2">
                                <ScanBarcode size={36} className="text-slate-600" />
                                <p className="text-xs text-slate-600">Enter a value to generate</p>
                            </div>
                        ) : renderError || validationMsg ? (
                            <div className="flex flex-col items-center gap-2 py-4">
                                <AlertCircle size={28} className="text-red-500/60" />
                                <p className="text-xs text-red-400/70 text-center max-w-[180px] leading-relaxed">
                                    {validationMsg || 'Cannot render this value for the selected format.'}
                                </p>
                            </div>
                        ) : null}
                        {/* Always render the SVG — JsBarcode draws into it */}
                        <svg
                            ref={svgRef}
                            className={`max-w-full transition-opacity duration-200 ${isReady ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}
                        />
                    </div>

                    {/* Format + value badge */}
                    {isReady && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-neon-cyan/10
                               text-neon-cyan border border-neon-cyan/20 font-mono">
                                {fmt?.label}
                            </span>
                            <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{value}</span>
                        </div>
                    )}

                    {/* Download buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadPng}
                            disabled={!isReady}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5
                         rounded-lg font-medium text-sm border transition-glow
                         bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30
                         hover:bg-neon-cyan/30 hover:shadow-glow-cyan
                         disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Download size={15} />
                            PNG
                        </button>
                        <button
                            onClick={handleDownloadSvg}
                            disabled={!isReady}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5
                         rounded-lg font-medium text-sm border transition-glow
                         bg-neon-emerald/20 text-neon-emerald border-neon-emerald/30
                         hover:bg-neon-emerald/30 hover:shadow-glow-emerald
                         disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Download size={15} />
                            SVG
                        </button>
                    </div>

                    {isReady && (
                        <p className="text-xs text-slate-600 text-center">
                            PNG exports at 3× resolution · SVG is infinitely scalable
                        </p>
                    )}
                </div>

                {/* Tips card */}
                <div className="glass-panel p-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-400">💡 Format tips</p>
                    <ul className="text-xs text-slate-500 space-y-1 leading-relaxed list-disc list-inside">
                        <li><strong>CODE 128</strong> is the safest choice for general text or mixed data.</li>
                        <li><strong>EAN-13 / UPC-A</strong> are used on retail products — digits only.</li>
                        <li><strong>ITF-14</strong> is printed on corrugated boxes for bulk shipments.</li>
                        <li>SVG is best for printing; PNG is best for digital use.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
