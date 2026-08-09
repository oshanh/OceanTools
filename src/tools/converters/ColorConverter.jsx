import { useState, useEffect } from 'react';
import { Droplets, Copy, Check } from 'lucide-react';

// Math Utilities
function hexToRgb(hex) {
    let raw = hex.replace('#', '');
    if (raw.length === 3) raw = raw.split('').map(c => c + c).join('');
    if (raw.length !== 6) return null;
    const num = parseInt(raw, 16);
    if (isNaN(num)) return null;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase();
}
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) h = s = 0; else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        } h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) r = g = b = l; else {
        let hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}
function rgbToCmyk(r, g, b) {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, Math.min(m, y));
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    c = (c - k) / (1 - k);
    m = (m - k) / (1 - k);
    y = (y - k) / (1 - k);
    return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
}
function cmykToRgb(c, m, y, k) {
    c /= 100; m /= 100; y /= 100; k /= 100;
    let r = 255 * (1 - c) * (1 - k);
    let g = 255 * (1 - m) * (1 - k);
    let b = 255 * (1 - y) * (1 - k);
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}


export default function ColorConverter() {
    const [hex, setHex] = useState('#00E5FF'); // Cyan default

    const [rgb, setRgb] = useState('0, 229, 255');
    const [hsl, setHsl] = useState('186, 100%, 50%');
    const [cmyk, setCmyk] = useState('100%, 10%, 0%, 0%');

    const [copiedIndex, setCopiedIndex] = useState(null);

    // Sync all from RGB
    const syncFromRgbObj = (r, g, b) => {
        setHex(rgbToHex(r, g, b));
        setRgb(`${r}, ${g}, ${b}`);

        let hslo = rgbToHsl(r, g, b);
        setHsl(`${hslo.h}, ${hslo.s}%, ${hslo.l}%`);

        let cmyko = rgbToCmyk(r, g, b);
        setCmyk(`${cmyko.c}%, ${cmyko.m}%, ${cmyko.y}%, ${cmyko.k}%`);
    };

    const handleHex = (val) => {
        setHex(val);
        const o = hexToRgb(val);
        if (o) syncFromRgbObj(o.r, o.g, o.b);
    };

    const handleRgb = (val) => {
        setRgb(val);
        const nums = val.replace(/[^0-9,]/g, '').split(',');
        if (nums.length === 3) {
            let [r, g, b] = nums.map(x => Math.min(255, parseInt(x) || 0));
            syncFromRgbObj(r, g, b);
        }
    };

    const handleHsl = (val) => {
        setHsl(val);
        const nums = val.replace(/[^0-9,]/g, '').split(',');
        if (nums.length === 3) {
            let [h, s, l] = nums.map(x => parseInt(x) || 0);
            h = Math.min(360, h);
            s = Math.min(100, s);
            l = Math.min(100, l);
            const o = hslToRgb(h, s, l);
            syncFromRgbObj(o.r, o.g, o.b);
        }
    };

    const handleCmyk = (val) => {
        setCmyk(val);
        const nums = val.replace(/[^0-9,]/g, '').split(',');
        if (nums.length === 4) {
            let [c, m, y, k] = nums.map(x => Math.min(100, parseInt(x) || 0));
            const o = cmykToRgb(c, m, y, k);
            syncFromRgbObj(o.r, o.g, o.b);
        }
    };

    const handleCopy = async (val, id) => {
        try {
            await navigator.clipboard.writeText(val);
            setCopiedIndex(id);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch { }
    };

    // Make sure background visually works safely. If hex is invalid, fallback to transparent.
    const safeHex = hexToRgb(hex) ? hex : 'transparent';

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            <div className="flex flex-col lg:flex-row gap-6">

                {/* Visualizer Panel */}
                <div className="lg:w-1/3 glass-panel p-4 border border-white/10 flex flex-col items-center justify-center gap-4 relative overflow-hidden checkerboard-bg">
                    <div className="absolute inset-0 transition-colors duration-200" style={{ backgroundColor: safeHex }} />

                    <div className="relative z-10 bg-black/60 backdrop-blur border border-white/10 rounded-2xl p-6 text-center shadow-2xl">
                        <Droplets size={32} className="text-white mx-auto mb-2 opacity-50" />
                        <input
                            type="color"
                            value={hexToRgb(hex) ? (hex.length === 7 ? hex : '#000000') : '#000000'}
                            onChange={(e) => handleHex(e.target.value.toUpperCase())}
                            className="bg-transparent border-none outline-none w-16 h-16 cursor-pointer mb-2"
                        />
                        <div className="font-mono text-2xl font-bold text-white tracking-widest">{hexToRgb(hex) ? hex : 'INVALID'}</div>
                    </div>
                </div>

                {/* Input Panel */}
                <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">

                    <ColorBlock
                        label="HEX"
                        value={hex}
                        onChange={(e) => handleHex(e.target.value)}
                        prefix=""
                        onCopy={() => handleCopy(hex, 'hex')}
                        copied={copiedIndex === 'hex'}
                        valid={!!hexToRgb(hex)}
                    />

                    <ColorBlock
                        label="RGB"
                        value={rgb}
                        onChange={(e) => handleRgb(e.target.value)}
                        prefix="rgb(" suffix=")"
                        onCopy={() => handleCopy(`rgb(${rgb})`, 'rgb')}
                        copied={copiedIndex === 'rgb'}
                        valid={true}
                    />

                    <ColorBlock
                        label="HSL"
                        value={hsl}
                        onChange={(e) => handleHsl(e.target.value)}
                        prefix="hsl(" suffix=")"
                        onCopy={() => handleCopy(`hsl(${hsl})`, 'hsl')}
                        copied={copiedIndex === 'hsl'}
                        valid={true}
                    />

                    <ColorBlock
                        label="CMYK"
                        value={cmyk}
                        onChange={(e) => handleCmyk(e.target.value)}
                        prefix="cmyk(" suffix=")"
                        onCopy={() => handleCopy(`cmyk(${cmyk})`, 'cmyk')}
                        copied={copiedIndex === 'cmyk'}
                        valid={true}
                    />

                </div>
            </div>

        </div>
    );
}

function ColorBlock({ label, value, onChange, prefix, suffix, onCopy, copied, valid }) {
    return (
        <div className={`glass-panel p-4 border transition-colors relative flex flex-col gap-2 ${valid ? 'border-white/10 focus-within:border-neon-cyan/50' : 'border-red-500/50'}`}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                {label}
                <button onClick={onCopy} className="text-slate-500 hover:text-white transition-colors">
                    {copied ? <Check size={14} className="text-neon-emerald" /> : <Copy size={14} />}
                </button>
            </div>
            <div className="flex items-center bg-ocean-950 px-3 py-3 rounded-lg border border-white/5 font-mono text-sm shadow-inner group">
                {prefix && <span className="text-slate-500 font-bold whitespace-nowrap">{prefix}</span>}
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    className="bg-transparent text-slate-200 outline-none w-full border-none text-center tracking-wider"
                    spellCheck={false}
                />
                {suffix && <span className="text-slate-500 font-bold whitespace-nowrap">{suffix}</span>}
            </div>
        </div>
    );
}
