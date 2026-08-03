import { useState } from 'react';
import { CaseSensitive, Copy, Check, Trash2 } from 'lucide-react';

export default function CaseConverter() {
    const [text, setText] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    // Converters
    const toLower = () => setText(text.toLowerCase());
    const toUpper = () => setText(text.toUpperCase());
    const toTitle = () => setText(text.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    const toSentence = () => {
        setText(text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()));
    };
    const toCamel = () => {
        const words = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
        setText(words.charAt(0).toLowerCase() + words.slice(1));
    };
    const toPascal = () => {
        const words = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
        setText(words.charAt(0).toUpperCase() + words.slice(1));
    };
    const toSnake = () => setText(text.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
    const toKebab = () => setText(text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    const toAlternating = () => {
        setText(text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''));
    };

    const actions = [
        { label: 'lower case', fn: toLower },
        { label: 'UPPER CASE', fn: toUpper },
        { label: 'Title Case', fn: toTitle },
        { label: 'Sentence case', fn: toSentence },
        { label: 'camelCase', fn: toCamel },
        { label: 'PascalCase', fn: toPascal },
        { label: 'snake_case', fn: toSnake },
        { label: 'kebab-case', fn: toKebab },
        { label: 'aLtErNaTiNg', fn: toAlternating },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="glass-panel p-5 border border-white/10 relative">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <CaseSensitive size={16} className="text-neon-cyan" />
                        Text Editor
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handleCopy} className="px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all">
                            {copied ? <Check size={14} className="text-neon-emerald" /> : <Copy size={14} />}
                            Copy
                        </button>
                        <button onClick={() => setText('')} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Clear text">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type or paste your text here to format its casing..."
                    className="w-full min-h-[300px] p-5 rounded-xl bg-ocean-900/60 border border-white/5 
                               text-slate-200 placeholder:text-slate-600 focus:outline-none 
                               focus:border-neon-cyan/50 focus:bg-ocean-900/80 transition-all resize-y text-lg leading-relaxed"
                    spellCheck={false}
                />

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
                    {actions.map((act) => (
                        <button
                            key={act.label}
                            onClick={act.fn}
                            disabled={!text}
                            className="py-3 px-4 rounded-lg bg-ocean-900 border border-white/10 text-sm font-mono font-medium text-slate-300 hover:border-neon-cyan/50 hover:text-neon-cyan hover:shadow-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center"
                        >
                            {act.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
