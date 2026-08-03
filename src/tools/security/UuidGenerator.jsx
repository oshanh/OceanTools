import { useState } from 'react';
import { Key, Copy, Check, RefreshCw } from 'lucide-react';

export default function UuidGenerator() {
    const [uuids, setUuids] = useState([]);
    const [count, setCount] = useState(5);
    const [version, setVersion] = useState('v4');
    const [copiedIndex, setCopiedIndex] = useState(null);

    const generate = () => {
        const newUuids = [];
        for (let i = 0; i < count; i++) {
            // Because browser only natively supports v4 via crypto.randomUUID
            if (version === 'v4' && window.crypto?.randomUUID) {
                newUuids.push(window.crypto.randomUUID());
            } else {
                // Fallback / pseudo alternative
                newUuids.push('xx-xx-xx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
                    return v.toString(16);
                }) + '... (v4 only supported via crypt API)');
            }
        }
        setUuids(newUuids);
        setCopiedIndex(null);
    };

    const handleCopy = async (text, i) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(i);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch { }
    };

    const copyAll = async () => {
        try {
            await navigator.clipboard.writeText(uuids.join('\n'));
            setCopiedIndex('all');
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch { }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            <div className="glass-panel p-6 border border-white/10 flex flex-col sm:flex-row gap-6 items-end">
                <div className="w-full flex-1 space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Number to generate</label>
                    <input
                        type="number"
                        min="1" max="100"
                        value={count}
                        onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value, 10))))}
                        className="w-full bg-ocean-950 border border-white/10 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-neon-cyan/50 font-mono"
                    />
                </div>

                <div className="w-full flex-1 space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">UUID Version</label>
                    <select
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        className="w-full bg-ocean-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan/50 themed-select font-mono"
                    >
                        <option value="v4">UUID v4 (Random / Cryptographically Secure)</option>
                    </select>
                </div>

                <div className="w-full sm:w-auto mt-4 sm:mt-0 flex">
                    <button
                        onClick={generate}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 transition-all font-bold shadow-glow-cyan"
                    >
                        <RefreshCw size={18} />
                        Generate
                    </button>
                </div>
            </div>

            {uuids.length > 0 && (
                <div className="glass-panel p-6 border border-white/10 relative">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Key size={16} className="text-neon-cyan" />
                            Generated Identifiers
                        </h2>
                        <button onClick={copyAll} className="px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all">
                            {copiedIndex === 'all' ? <Check size={14} className="text-neon-emerald" /> : <Copy size={14} />}
                            Copy All
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {uuids.map((uuid, i) => (
                            <div key={i} className="flex items-center justify-between bg-ocean-900/40 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors group">
                                <span className="font-mono text-slate-300 text-lg tracking-wide">{uuid}</span>
                                <button
                                    onClick={() => handleCopy(uuid, i)}
                                    className="p-2 text-slate-500 group-hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-md transition-colors"
                                >
                                    {copiedIndex === i ? <Check size={16} className="text-neon-emerald" /> : <Copy size={16} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {uuids.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 italic mt-8 border border-white/5 rounded-xl border-dashed">
                    <Key size={32} className="mb-4 opacity-50 text-slate-600" />
                    Configure settings and click generate to create UUIDs.
                </div>
            )}
        </div>
    );
}
