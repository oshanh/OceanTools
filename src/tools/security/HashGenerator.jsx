import { useState, useMemo } from 'react';
import { Fingerprint, Copy, Check, Trash2 } from 'lucide-react';
import CryptoJS from 'crypto-js';

export default function HashGenerator() {
    const [input, setInput] = useState('');
    const [copiedAlgo, setCopiedAlgo] = useState(null);

    const hashes = useMemo(() => {
        if (!input) return [];

        return [
            { name: 'MD5', value: CryptoJS.MD5(input).toString() },
            { name: 'SHA-1', value: CryptoJS.SHA1(input).toString() },
            { name: 'SHA-256', value: CryptoJS.SHA256(input).toString() },
            { name: 'SHA-512', value: CryptoJS.SHA512(input).toString() },
            { name: 'SHA-3', value: CryptoJS.SHA3(input).toString() },
            { name: 'RIPEMD-160', value: CryptoJS.RIPEMD160(input).toString() },
        ];
    }, [input]);

    const handleCopy = async (text, algo) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAlgo(algo);
            setTimeout(() => setCopiedAlgo(null), 2000);
        } catch { }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            <div className="glass-panel p-5 border border-white/10 relative">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Fingerprint size={16} className="text-neon-cyan" />
                        Input Data
                    </h2>
                    <button onClick={() => setInput('')} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Clear input">
                        <Trash2 size={16} />
                    </button>
                </div>

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter text to hash..."
                    className="w-full min-h-[150px] p-4 rounded-xl bg-ocean-900/40 border border-white/5 
                               text-slate-200 placeholder:text-slate-600 focus:outline-none 
                               focus:border-neon-cyan/50 focus:bg-ocean-900/60 transition-all resize-y font-mono"
                    spellCheck={false}
                />
            </div>

            {hashes.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {hashes.map(hash => (
                        <div key={hash.name} className="glass-panel p-5 border border-white/10 flex flex-col gap-3 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-200 tracking-wider text-sm">{hash.name}</span>
                                <button
                                    onClick={() => handleCopy(hash.value, hash.name)}
                                    className="p-1.5 min-w-[60px] flex items-center justify-center gap-1 bg-ocean-900 border border-white/10 rounded text-xs font-semibold text-slate-400 hover:text-neon-cyan hover:border-neon-cyan/50 transition-all z-10"
                                >
                                    {copiedAlgo === hash.name ? <Check size={12} className="text-neon-emerald" /> : <Copy size={12} />}
                                    {copiedAlgo === hash.name ? 'Copied' : 'Copy'}
                                </button>
                            </div>

                            <div className="bg-ocean-950 p-3 rounded border border-white/5 font-mono text-sm text-neon-cyan break-all leading-relaxed relative z-10">
                                {hash.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {hashes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 italic mt-8 border border-white/5 rounded-xl border-dashed">
                    <Fingerprint size={32} className="mb-4 opacity-50 text-slate-600" />
                    Enter text above to instantly compute cryptographic hashes.
                </div>
            )}

        </div>
    );
}
