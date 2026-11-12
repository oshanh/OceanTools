import { useState, useMemo } from 'react';
import { WholeWord, Trash2, Copy, Check } from 'lucide-react';

export default function WordCounter() {
    const [text, setText] = useState('');
    const [copied, setCopied] = useState(false);

    // Compute stats
    const stats = useMemo(() => {
        const str = text || '';
        const words = str.match(/\b[-?(\w+)?]+\b/gi);
        const wordCount = words ? words.length : 0;

        const charsWithSpaces = str.length;
        const charsWithoutSpaces = str.replace(/\s/g, '').length;

        const sentences = str.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const paragraphs = str.split(/\n+/).filter(p => p.trim().length > 0).length;

        // Reading time avg 200 words per minute ~ 3.3 words per second
        const readingTimeMins = Math.floor(wordCount / 200);
        const readingTimeSecs = Math.round((wordCount % 200) / (200 / 60));
        let readTime = '< 1 min';
        if (readingTimeMins > 0 || readingTimeSecs > 0) {
            readTime = `${readingTimeMins}m ${readingTimeSecs}s`;
        }

        return {
            wordCount,
            charsWithSpaces,
            charsWithoutSpaces,
            sentences,
            paragraphs,
            readTime
        };
    }, [text]);

    const handleClear = () => setText('');

    const handleCopy = async () => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    const statBoxes = [
        { label: 'Words', value: stats.wordCount, color: 'text-neon-cyan' },
        { label: 'Characters', value: stats.charsWithSpaces, color: 'text-neon-emerald' },
        { label: 'Sentences', value: stats.sentences, color: 'text-fuchsia-400' },
        { label: 'Paragraphs', value: stats.paragraphs, color: 'text-amber-400' },
        { label: 'Chars (No Whitespace)', value: stats.charsWithoutSpaces },
        { label: 'Est. Reading Time', value: stats.readTime },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statBoxes.map((stat, idx) => (
                    <div key={idx} className="glass-panel p-4 flex flex-col items-center justify-center border border-white/10 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className={`text-3xl font-bold font-mono tracking-tight ${stat.color || 'text-slate-200'}`}>
                            {stat.value}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2 block">
                            {stat.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className="glass-panel p-5 border border-white/10 relative">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <WholeWord size={16} className="text-neon-cyan" />
                        Text Input
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Copy text">
                            {copied ? <Check size={16} className="text-neon-emerald" /> : <Copy size={16} />}
                        </button>
                        <button onClick={handleClear} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Clear text">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type or paste your text here to begin counting..."
                    className="w-full min-h-[400px] p-5 rounded-xl bg-ocean-900/60 border border-white/5 
                               text-slate-200 placeholder:text-slate-600 focus:outline-none 
                               focus:border-neon-cyan/50 focus:bg-ocean-900/80 transition-all resize-y text-lg leading-relaxed"
                    spellCheck={false}
                />
            </div>
        </div>
    );
}
