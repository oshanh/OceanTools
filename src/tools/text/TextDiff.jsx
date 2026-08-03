import { useState, useMemo } from 'react';
import * as Diff from 'diff';
import { GitCompare, ArrowLeftRight, Trash2 } from 'lucide-react';

export default function TextDiff() {
    const [original, setOriginal] = useState('This is the original text.\nIt has a few lines.\nSome things will change.');
    const [modified, setModified] = useState('This is the modified text.\nIt has a few changed lines.\nSome things will change.\nAnd some are new!');

    // Toggle between inline (word) and block (line) diffing
    const [mode, setMode] = useState('words'); // 'words' | 'lines'

    const diffResult = useMemo(() => {
        if (!original && !modified) return [];
        return mode === 'lines'
            ? Diff.diffLines(original || '', modified || '')
            : Diff.diffWordsWithSpace(original || '', modified || '');
    }, [original, modified, mode]);

    const handleClear = () => {
        setOriginal('');
        setModified('');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* Input Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-4 border border-white/10 flex flex-col h-72">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Original Text</label>
                        <button onClick={() => setOriginal('')} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <textarea
                        value={original}
                        onChange={(e) => setOriginal(e.target.value)}
                        placeholder="Paste original text..."
                        className="flex-1 w-full p-3 rounded-lg bg-ocean-900/40 border border-red-500/10 
                                   text-slate-300 focus:outline-none focus:border-red-500/40 transition-all resize-none font-mono text-sm leading-relaxed"
                        spellCheck={false}
                    />
                </div>

                <div className="glass-panel p-4 border border-white/10 flex flex-col h-72">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Modified Text</label>
                        <button onClick={() => setModified('')} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <textarea
                        value={modified}
                        onChange={(e) => setModified(e.target.value)}
                        placeholder="Paste modified text..."
                        className="flex-1 w-full p-3 rounded-lg bg-ocean-900/40 border border-neon-emerald/10 
                                   text-slate-300 focus:outline-none focus:border-neon-emerald/40 transition-all resize-none font-mono text-sm leading-relaxed"
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* Differential Output Panel */}
            <div className="glass-panel p-5 border border-white/10 relative mt-8">

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <GitCompare size={18} className="text-neon-cyan" />
                        Difference Analysis
                    </h2>

                    <div className="flex items-center gap-2 bg-ocean-900/50 p-1 rounded-lg border border-white/5">
                        <button
                            onClick={() => setMode('words')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'words' ? 'bg-neon-cyan/20 text-neon-cyan shadow-glow-cyan' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Word Diff
                        </button>
                        <button
                            onClick={() => setMode('lines')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'lines' ? 'bg-neon-cyan/20 text-neon-cyan shadow-glow-cyan' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Line Diff
                        </button>
                    </div>
                </div>

                <div className="w-full min-h-[300px] p-6 rounded-xl bg-ocean-950 border border-white/5 text-lg leading-relaxed font-mono whitespace-pre-wrap word-break">
                    {diffResult.map((part, index) => {
                        let colorClass = 'text-slate-300';
                        let bgClass = '';

                        if (part.added) {
                            colorClass = 'text-neon-emerald';
                            bgClass = mode === 'lines' ? 'bg-neon-emerald/10 block my-1 border-l-2 border-neon-emerald pl-2' : 'bg-neon-emerald/10 rounded px-0.5';
                        }
                        if (part.removed) {
                            colorClass = 'text-red-400 line-through opacity-70';
                            bgClass = mode === 'lines' ? 'bg-red-500/10 block my-1 border-l-2 border-red-500 pl-2' : 'bg-red-500/10 rounded px-0.5';
                        }

                        // For lines mode, part.value can have \n at the end. The block styling takes care of it.
                        if (mode === 'lines') {
                            return (
                                <span key={index} className={`${colorClass} ${bgClass}`}>
                                    {part.value}
                                </span>
                            );
                        }

                        return (
                            <span key={index} className={`${colorClass} ${bgClass}`}>
                                {part.value}
                            </span>
                        );
                    })}
                    {diffResult.length === 0 && (
                        <div className="flex h-full items-center justify-center text-slate-500 italic mt-16 text-sm">
                            Enter text above to compute the differential graph.
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                        <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500" />
                        Removed
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <div className="w-3 h-3 rounded-full bg-slate-500/30 border border-slate-500" />
                        Unchanged
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-neon-emerald">
                        <div className="w-3 h-3 rounded-full bg-neon-emerald/30 border border-neon-emerald" />
                        Added
                    </div>
                </div>

            </div>
        </div>
    );
}
