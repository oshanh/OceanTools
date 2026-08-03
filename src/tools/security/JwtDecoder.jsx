import { useState, useMemo } from 'react';
import { Lock, Copy, Check, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';

function decodeJwtPart(part) {
    try {
        if (!part) return null;
        let base64Url = part;
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Pad length with '='
        while (base64.length % 4 !== 0) {
            base64 += '=';
        }
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export default function JwtDecoder() {
    const [token, setToken] = useState('');
    const [copied, setCopied] = useState(false);

    const decoded = useMemo(() => {
        if (!token) return { header: null, payload: null, signature: null, validStructure: false };
        const parts = token.trim().split('.');

        if (parts.length === 3) {
            return {
                header: decodeJwtPart(parts[0]),
                payload: decodeJwtPart(parts[1]),
                signature: parts[2],
                validStructure: true,
                rawHeader: parts[0],
                rawPayload: parts[1]
            };
        }
        return { header: null, payload: null, signature: null, validStructure: false };
    }, [token]);

    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            <div className="glass-panel p-5 border border-white/10 relative">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Lock size={16} className="text-neon-cyan" />
                        JSON Web Token
                    </h2>
                    <button onClick={() => setToken('')} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Clear token">
                        <Trash2 size={16} />
                    </button>
                </div>

                <textarea
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste JWT here (e.g. eyJhbGciOiJIUzI1...)"
                    className={`w-full min-h-[120px] p-4 rounded-xl bg-ocean-900/40 border 
                               ${(token && !decoded.validStructure) ? 'border-red-500/50 focus:border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/5 focus:border-neon-cyan/50'} 
                               text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all resize-y font-mono break-all`}
                    spellCheck={false}
                />

                {token && !decoded.validStructure && (
                    <div className="mt-3 flex items-center gap-2 text-red-400 text-sm font-semibold">
                        <AlertTriangle size={16} /> Token lacks the standard 3-part header.payload.signature structure.
                    </div>
                )}
            </div>

            {token && decoded.validStructure && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Visual Color Mapping side */}
                    <div className="lg:col-span-5 glass-panel p-5 border border-white/10 flex flex-col gap-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Structure Inspector</h3>

                        <div className="w-full bg-ocean-950 p-4 rounded border border-white/5 font-mono text-sm break-all leading-relaxed relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
                            <span className="text-red-400 relative z-10">{decoded.rawHeader}</span>
                            <span className="text-white font-bold relative z-10">.</span>
                            <span className="text-purple-400 relative z-10">{decoded.rawPayload}</span>
                            <span className="text-white font-bold relative z-10">.</span>
                            <span className="text-neon-cyan relative z-10">{decoded.signature}</span>
                        </div>

                        <div className="flex flex-col gap-3 mt-4">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <div className="w-3 h-3 rounded-full bg-red-400" /> Header Algorithm & Token Type
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <div className="w-3 h-3 rounded-full bg-purple-400" /> Payload Data Claims
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <div className="w-3 h-3 rounded-full bg-neon-cyan" /> Cryptographic Signature
                            </div>
                        </div>

                        <div className="mt-4 p-4 border border-neon-emerald/30 bg-neon-emerald/10 text-neon-emerald rounded flex items-center gap-2 text-sm">
                            <ShieldCheck size={18} />
                            Token decoded solely on the client. It never leaves your browser.
                        </div>
                    </div>

                    {/* Claims Side */}
                    <div className="lg:col-span-7 flex flex-col gap-6">

                        {/* Header Box */}
                        <div className="glass-panel border-l-[4px] border-l-red-400 border-white/10 relative">
                            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/5 text-red-400 font-bold uppercase text-xs tracking-wider">
                                Header
                                {decoded.header && (
                                    <button onClick={() => handleCopy(JSON.stringify(decoded.header, null, 2))} className="hover:text-red-300 transition-colors">
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                )}
                            </div>
                            <div className="p-5 overflow-auto custom-scrollbar">
                                {decoded.header ? (
                                    <pre className="font-mono text-sm text-red-300 m-0">
                                        {JSON.stringify(decoded.header, null, 4)}
                                    </pre>
                                ) : (
                                    <span className="text-slate-500 italic">Invalid JSON Header bytes</span>
                                )}
                            </div>
                        </div>

                        {/* Payload Box */}
                        <div className="glass-panel border-l-[4px] border-l-purple-400 border-white/10 relative">
                            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/5 text-purple-400 font-bold uppercase text-xs tracking-wider">
                                Payload (Claims)
                                {decoded.payload && (
                                    <button onClick={() => handleCopy(JSON.stringify(decoded.payload, null, 2))} className="hover:text-purple-300 transition-colors">
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                )}
                            </div>
                            <div className="p-5 overflow-auto custom-scrollbar max-h-[400px]">
                                {decoded.payload ? (
                                    <pre className="font-mono text-sm text-purple-300 m-0">
                                        {JSON.stringify(decoded.payload, null, 4)}
                                    </pre>
                                ) : (
                                    <span className="text-slate-500 italic">Invalid JSON Payload bytes</span>
                                )}
                            </div>
                        </div>

                        {/* Signature Box */}
                        <div className="glass-panel border-l-[4px] border-l-neon-cyan border-white/10 relative">
                            <div className="px-5 py-3 border-b border-white/5 bg-white/5 text-neon-cyan font-bold uppercase text-xs tracking-wider">
                                Signature Checksum
                            </div>
                            <div className="p-5">
                                <p className="font-mono text-sm text-neon-cyan break-all">
                                    {decoded.signature}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {!token && (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 italic mt-8 border border-white/5 rounded-xl border-dashed">
                    <Lock size={32} className="mb-4 opacity-50 text-slate-600" />
                    Paste a JWT above to decode its header and payload claims securely.
                </div>
            )}

        </div>
    );
}
