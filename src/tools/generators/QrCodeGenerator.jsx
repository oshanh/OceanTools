import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Download,
    Globe,
    Mail,
    MessageSquare,
    Phone,
    QrCode,
    SlidersHorizontal,
    User,
    Wifi,
    Type,
    Copy,
    Check,
} from 'lucide-react';
import {
    renderToCanvas,
    toPngDataUrl,
    toSvgString,
    buildTextContent,
    buildWifiContent,
    buildVCardContent,
    buildEmailContent,
    buildPhoneContent,
    buildSmsContent,
    ERROR_CORRECTION_LEVELS,
} from '../../utils/qrGenerator';

// ---------------------------------------------------------------------------
// Content types
// ---------------------------------------------------------------------------
const CONTENT_TYPES = [
    { id: 'url', label: 'URL', Icon: Globe },
    { id: 'text', label: 'Text', Icon: Type },
    { id: 'wifi', label: 'Wi-Fi', Icon: Wifi },
    { id: 'vcard', label: 'Contact', Icon: User },
    { id: 'email', label: 'Email', Icon: Mail },
    { id: 'phone', label: 'Phone', Icon: Phone },
    { id: 'sms', label: 'SMS', Icon: MessageSquare },
];

// ---------------------------------------------------------------------------
// Default field state per type
// ---------------------------------------------------------------------------
const DEFAULTS = {
    url: { url: 'https://' },
    text: { text: '' },
    wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
    vcard: { firstName: '', lastName: '', org: '', phone: '', email: '', url: '', address: '' },
    email: { to: '', subject: '', body: '' },
    phone: { phone: '' },
    sms: { phone: '', message: '' },
};

// ---------------------------------------------------------------------------
// Build QR content from current type + fields
// ---------------------------------------------------------------------------
function buildContent(type, fields) {
    switch (type) {
        case 'url': return buildTextContent(fields.url ?? '');
        case 'text': return buildTextContent(fields.text ?? '');
        case 'wifi': return buildWifiContent(fields);
        case 'vcard': return buildVCardContent(fields);
        case 'email': return buildEmailContent(fields);
        case 'phone': return buildPhoneContent(fields.phone ?? '');
        case 'sms': return buildSmsContent(fields);
        default: return '';
    }
}

// ---------------------------------------------------------------------------
// Shared input styles
// ---------------------------------------------------------------------------
const inputCls =
    'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg ' +
    'text-slate-200 text-sm placeholder-slate-600 ' +
    'focus:outline-none focus:border-neon-cyan/50 transition-glow';

const labelCls = 'block text-xs text-slate-400 mb-1.5 font-medium';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function QrCodeGenerator() {
    const [type, setType] = useState('url');
    const [fields, setFields] = useState(DEFAULTS['url']);

    // QR appearance
    const [fgColor, setFgColor] = useState('#ffffff');
    const [bgColor, setBgColor] = useState('#0f172a');
    const [size, setSize] = useState(300);
    const [ecLevel, setEcLevel] = useState('M');
    const [margin, setMargin] = useState(2);

    const [copied, setCopied] = useState(false);

    const canvasRef = useRef(null);
    // Debounce timer
    const debounceRef = useRef(null);

    // -------------------------------------------------------------------------
    // Derived content string
    const content = buildContent(type, fields);

    // -------------------------------------------------------------------------
    // Re-render QR whenever inputs change (debounced 200 ms)
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (canvasRef.current) {
                renderToCanvas(canvasRef.current, content, { fgColor, bgColor, size, ecLevel, margin });
            }
        }, 200);
        return () => clearTimeout(debounceRef.current);
    }, [content, fgColor, bgColor, size, ecLevel, margin]);

    // -------------------------------------------------------------------------
    // Type switch
    const switchType = (newType) => {
        setType(newType);
        setFields(DEFAULTS[newType]);
    };

    const setField = (key, value) =>
        setFields((prev) => ({ ...prev, [key]: value }));

    // -------------------------------------------------------------------------
    // Downloads
    const downloadPng = useCallback(async () => {
        if (!content) return;
        const dataUrl = await toPngDataUrl(content, { fgColor, bgColor, size: 1024, ecLevel, margin });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'qrcode.png';
        a.click();
    }, [content, fgColor, bgColor, ecLevel, margin]);

    const downloadSvg = useCallback(async () => {
        if (!content) return;
        const svg = await toSvgString(content, { fgColor, bgColor, size: 512, ecLevel, margin });
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qrcode.svg';
        a.click();
        URL.revokeObjectURL(url);
    }, [content, fgColor, bgColor, ecLevel, margin]);

    const copyContent = useCallback(() => {
        if (!content) return;
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [content]);

    // -------------------------------------------------------------------------
    // Field forms per type
    const renderFields = () => {
        switch (type) {
            case 'url':
                return (
                    <div>
                        <label className={labelCls}>URL</label>
                        <input className={inputCls} type="url" placeholder="https://example.com"
                            value={fields.url ?? ''} onChange={(e) => setField('url', e.target.value)} />
                    </div>
                );

            case 'text':
                return (
                    <div>
                        <label className={labelCls}>Text</label>
                        <textarea className={`${inputCls} resize-none`} rows={4}
                            placeholder="Enter any text…"
                            value={fields.text ?? ''} onChange={(e) => setField('text', e.target.value)} />
                    </div>
                );

            case 'wifi':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className={labelCls}>Network Name (SSID)</label>
                            <input className={inputCls} placeholder="MyNetwork"
                                value={fields.ssid ?? ''} onChange={(e) => setField('ssid', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Security</label>
                                <select className={`themed-select ${inputCls}`}
                                    value={fields.encryption ?? 'WPA'} onChange={(e) => setField('encryption', e.target.value)}>
                                    <option value="WPA">WPA/WPA2</option>
                                    <option value="WEP">WEP</option>
                                    <option value="none">None (open)</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Password</label>
                                <input className={inputCls} type="password" placeholder="••••••••"
                                    disabled={fields.encryption === 'none'}
                                    value={fields.password ?? ''} onChange={(e) => setField('password', e.target.value)} />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" className="accent-neon-cyan w-4 h-4"
                                checked={fields.hidden ?? false}
                                onChange={(e) => setField('hidden', e.target.checked)} />
                            <span className="text-sm text-slate-400">Hidden network</span>
                        </label>
                    </div>
                );

            case 'vcard':
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>First name</label>
                                <input className={inputCls} placeholder="Jane"
                                    value={fields.firstName ?? ''} onChange={(e) => setField('firstName', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelCls}>Last name</label>
                                <input className={inputCls} placeholder="Doe"
                                    value={fields.lastName ?? ''} onChange={(e) => setField('lastName', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Organisation</label>
                            <input className={inputCls} placeholder="Acme Corp"
                                value={fields.org ?? ''} onChange={(e) => setField('org', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Phone</label>
                                <input className={inputCls} type="tel" placeholder="+1 555 0100"
                                    value={fields.phone ?? ''} onChange={(e) => setField('phone', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelCls}>Email</label>
                                <input className={inputCls} type="email" placeholder="jane@example.com"
                                    value={fields.email ?? ''} onChange={(e) => setField('email', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Website</label>
                            <input className={inputCls} placeholder="https://example.com"
                                value={fields.url ?? ''} onChange={(e) => setField('url', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Address</label>
                            <input className={inputCls} placeholder="123 Main St, City, Country"
                                value={fields.address ?? ''} onChange={(e) => setField('address', e.target.value)} />
                        </div>
                    </div>
                );

            case 'email':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className={labelCls}>To</label>
                            <input className={inputCls} type="email" placeholder="recipient@example.com"
                                value={fields.to ?? ''} onChange={(e) => setField('to', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Subject</label>
                            <input className={inputCls} placeholder="Hello!"
                                value={fields.subject ?? ''} onChange={(e) => setField('subject', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Body</label>
                            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Message…"
                                value={fields.body ?? ''} onChange={(e) => setField('body', e.target.value)} />
                        </div>
                    </div>
                );

            case 'phone':
                return (
                    <div>
                        <label className={labelCls}>Phone number</label>
                        <input className={inputCls} type="tel" placeholder="+1 555 0100"
                            value={fields.phone ?? ''} onChange={(e) => setField('phone', e.target.value)} />
                    </div>
                );

            case 'sms':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className={labelCls}>Phone number</label>
                            <input className={inputCls} type="tel" placeholder="+1 555 0100"
                                value={fields.phone ?? ''} onChange={(e) => setField('phone', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Message (optional)</label>
                            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Pre-filled message…"
                                value={fields.message ?? ''} onChange={(e) => setField('message', e.target.value)} />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const hasContent = content.length > 0 && content !== 'https://' && content !== 'tel:' && content !== 'sms:' && content !== 'mailto:';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* ------------------------------------------------------------------ */}
            {/* Left panel — inputs                                                 */}
            {/* ------------------------------------------------------------------ */}
            <div className="lg:col-span-3 space-y-5">

                {/* Content type tabs */}
                <div className="glass-panel p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                        Content Type
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {CONTENT_TYPES.map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => switchType(id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-glow
                  ${type === id
                                        ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40'
                                        : 'bg-white/5 text-slate-400 border-white/10 hover:border-neon-cyan/20 hover:text-slate-300'
                                    }`}
                            >
                                <Icon size={13} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content fields */}
                <div className="glass-panel p-5 space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Content
                    </h2>
                    {renderFields()}

                    {/* Encoded content preview */}
                    {hasContent && (
                        <div className="mt-2">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-slate-500">Encoded value</span>
                                <button onClick={copyContent}
                                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-neon-cyan transition-glow">
                                    {copied ? <Check size={11} className="text-neon-emerald" /> : <Copy size={11} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <pre className="text-xs text-slate-500 bg-white/5 border border-white/10 rounded-lg
                              p-2.5 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed max-h-28">
                                {content}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Appearance settings */}
                <div className="glass-panel p-5 space-y-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <SlidersHorizontal size={14} />
                        Appearance
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Foreground */}
                        <div>
                            <label className={labelCls}>QR Color</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={fgColor}
                                    onChange={(e) => setFgColor(e.target.value)}
                                    className="w-10 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                                <input className={`${inputCls} font-mono`} value={fgColor}
                                    onChange={(e) => setFgColor(e.target.value)} placeholder="#ffffff" />
                            </div>
                        </div>

                        {/* Background */}
                        <div>
                            <label className={labelCls}>Background</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={bgColor}
                                    onChange={(e) => setBgColor(e.target.value)}
                                    className="w-10 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                                <input className={`${inputCls} font-mono`} value={bgColor}
                                    onChange={(e) => setBgColor(e.target.value)} placeholder="#0f172a" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Size */}
                        <div>
                            <label className={labelCls}>
                                Preview Size <span className="text-neon-cyan font-mono">{size}px</span>
                            </label>
                            <input type="range" min="150" max="400" step="10" value={size}
                                onChange={(e) => setSize(Number(e.target.value))}
                                className="w-full accent-neon-cyan" />
                        </div>

                        {/* Margin */}
                        <div>
                            <label className={labelCls}>
                                Quiet Zone <span className="text-neon-cyan font-mono">{margin}</span>
                            </label>
                            <input type="range" min="0" max="6" step="1" value={margin}
                                onChange={(e) => setMargin(Number(e.target.value))}
                                className="w-full accent-neon-cyan" />
                        </div>
                    </div>

                    {/* Error correction */}
                    <div>
                        <label className={labelCls}>Error Correction Level</label>
                        <div className="grid grid-cols-4 gap-2">
                            {ERROR_CORRECTION_LEVELS.map(({ value, label }) => (
                                <button key={value} onClick={() => setEcLevel(value)}
                                    className={`py-2 rounded-lg text-xs font-mono font-bold border transition-glow
                    ${ecLevel === value
                                            ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40'
                                            : 'bg-white/5 text-slate-400 border-white/10 hover:border-neon-cyan/20'
                                        }`}
                                    title={ERROR_CORRECTION_LEVELS.find(l => l.value === value)?.desc}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5">
                            {ERROR_CORRECTION_LEVELS.find(l => l.value === ecLevel)?.desc}
                        </p>
                    </div>

                    {/* Quick colour presets */}
                    <div>
                        <label className={labelCls}>Quick Themes</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { fg: '#ffffff', bg: '#0f172a', label: 'Ocean' },
                                { fg: '#0f172a', bg: '#ffffff', label: 'Classic' },
                                { fg: '#22d3ee', bg: '#0f172a', label: 'Cyan' },
                                { fg: '#34d399', bg: '#0f172a', label: 'Emerald' },
                                { fg: '#f59e0b', bg: '#1c1917', label: 'Amber' },
                                { fg: '#f472b6', bg: '#1a0e1f', label: 'Pink' },
                            ].map((theme) => (
                                <button key={theme.label}
                                    onClick={() => { setFgColor(theme.fg); setBgColor(theme.bg); }}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                             border border-white/10 hover:border-neon-cyan/30 transition-glow"
                                    style={{ background: theme.bg, color: theme.fg }}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full border border-current"
                                        style={{ background: theme.fg }} />
                                    {theme.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Right panel — preview + download                                    */}
            {/* ------------------------------------------------------------------ */}
            <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6">
                {/* Canvas preview */}
                <div className="glass-panel p-5 flex flex-col items-center gap-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 self-start">
                        Preview
                    </h2>

                    <div className="relative flex items-center justify-center rounded-xl overflow-hidden
                          border border-white/10 w-full aspect-square"
                        style={{ background: bgColor, maxWidth: `${size}px`, margin: '0 auto' }}>
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                        />

                        {!hasContent && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <QrCode size={40} className="text-slate-600" />
                                <p className="text-xs text-slate-600">Fill in the form to generate</p>
                            </div>
                        )}
                    </div>

                    {/* Download buttons */}
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={downloadPng}
                            disabled={!hasContent}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                         font-medium text-sm border transition-glow
                         bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30
                         hover:bg-neon-cyan/30 hover:shadow-glow-cyan
                         disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Download size={15} />
                            PNG
                        </button>
                        <button
                            onClick={downloadSvg}
                            disabled={!hasContent}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                         font-medium text-sm border transition-glow
                         bg-neon-emerald/20 text-neon-emerald border-neon-emerald/30
                         hover:bg-neon-emerald/30 hover:shadow-glow-emerald
                         disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Download size={15} />
                            SVG
                        </button>
                    </div>

                    {/* Size info */}
                    {hasContent && (
                        <p className="text-xs text-slate-600 text-center">
                            PNG exports at 1024 × 1024 px · SVG is infinitely scalable
                        </p>
                    )}
                </div>

                {/* Tip card */}
                <div className="glass-panel p-4 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-400">💡 Tips</p>
                    <ul className="text-xs text-slate-500 space-y-1 leading-relaxed list-disc list-inside">
                        <li>Use <strong>H</strong> error correction if the QR will be printed small or partially obscured.</li>
                        <li>High-contrast colours (dark on white or white on dark) scan most reliably.</li>
                        <li>SVG is best for printing; PNG is best for sharing digitally.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
