import { useState, useCallback } from 'react';
import {
    ArrowDownUp,
    Check,
    Copy,
    Link,
    Trash2,
    AlertTriangle,
    Wand2,
} from 'lucide-react';

/**
 * URL Encoder/Decoder tool.
 * Provides standard encodeURIComponent / decodeURIComponent, along with an option
 * to encode/decode full URLs (encodeURI) safely.
 */
export default function UrlEncoder() {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');

    // Modes: 'component' uses encodeURIComponent, 'url' uses encodeURI
    const [encodeMode, setEncodeMode] = useState('component');

    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // ---------------------------------------------------------------------------
    // Handlers
    // ---------------------------------------------------------------------------

    const handleEncode = useCallback(() => {
        setError('');
        if (!inputText) {
            setOutputText('');
            return;
        }

        try {
            const encoded = encodeMode === 'component'
                ? encodeURIComponent(inputText)
                : encodeURI(inputText);

            setOutputText(encoded);
        } catch (err) {
            setError('Encoding failed. Ensure the input contains valid text.');
            setOutputText('');
        }
    }, [inputText, encodeMode]);

    const handleDecode = useCallback(() => {
        setError('');
        if (!inputText) {
            setOutputText('');
            return;
        }

        try {
            const decoded = encodeMode === 'component'
                ? decodeURIComponent(inputText)
                : decodeURI(inputText);

            setOutputText(decoded);
        } catch (err) {
            setError('Decoding failed. The input might be a malformed URL or contain invalid percent-encoding.');
            setOutputText('');
        }
    }, [inputText, encodeMode]);

    const handleSwap = useCallback(() => {
        setInputText(outputText);
        setOutputText('');
        setError('');
    }, [outputText]);

    const handleCopy = useCallback(async () => {
        if (!outputText) return;
        try {
            await navigator.clipboard.writeText(outputText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Clipboard access is blocked in this browser.');
        }
    }, [outputText]);

    const handleClear = useCallback(() => {
        setInputText('');
        setOutputText('');
        setError('');
    }, []);

    const handleExample = useCallback(() => {
        setInputText('https://example.com/api/search?q=hello world & "react"&filter=active#results');
        setOutputText('');
        setError('');
    }, []);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* ------------------------------------------------------------------ */}
            {/* Controls & Options                                                  */}
            {/* ------------------------------------------------------------------ */}
            <div className="glass-panel p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

                {/* Mode Toggle */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Encoding Scope
                    </label>
                    <div className="flex bg-ocean-900/50 p-1 rounded-lg border border-white/5 w-fit">
                        <button
                            onClick={() => setEncodeMode('component')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${encodeMode === 'component'
                                    ? 'bg-neon-cyan/20 text-neon-cyan shadow-glow-cyan'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                        >
                            Component (Parameters)
                        </button>
                        <button
                            onClick={() => setEncodeMode('url')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${encodeMode === 'url'
                                    ? 'bg-neon-cyan/20 text-neon-cyan shadow-glow-cyan'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                        >
                            Full URL
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        {encodeMode === 'component'
                            ? 'Encodes special characters including ?, =, &, and / (best for query parameters).'
                            : 'Leaves base URL structures (?, =, &, /) untouched (best for full web addresses).'}
                    </p>
                </div>

            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Editors                                                             */}
            {/* ------------------------------------------------------------------ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Input Panel */}
                <div className="glass-panel p-5 flex flex-col h-full border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Link size={14} className="text-neon-cyan" />
                            Input
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExample}
                                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded transition-colors"
                                title="Load example URL"
                            >
                                <Wand2 size={12} />
                                Example
                            </button>
                            <button
                                onClick={handleClear}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                                title="Clear input"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste your URL or text here..."
                        className="flex-1 w-full min-h-[300px] p-4 rounded-xl bg-ocean-900/40 border border-white/5 
                       text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none 
                       focus:border-neon-cyan/50 focus:bg-ocean-900/80 transition-all resize-y"
                        spellCheck={false}
                    />

                    <div className="flex items-center gap-3 mt-4">
                        <button
                            onClick={handleEncode}
                            className="flex-1 py-3 px-4 rounded-lg font-medium text-sm text-neon-cyan border border-neon-cyan/30
                         bg-neon-cyan/10 hover:bg-neon-cyan/20 hover:shadow-glow-cyan transition-glow"
                        >
                            Encode
                        </button>
                        <button
                            onClick={handleDecode}
                            className="flex-1 py-3 px-4 rounded-lg font-medium text-sm text-fuchsia-400 border border-fuchsia-400/30
                         bg-fuchsia-400/10 hover:bg-fuchsia-400/20 hover:shadow-[0_0_15px_rgba(232,121,249,0.3)] transition-glow"
                        >
                            Decode
                        </button>
                    </div>
                </div>

                {/* Output Panel */}
                <div className="glass-panel p-5 flex flex-col h-full border border-white/10 relative">

                    {/* Swap Trigger (Visible fully on large screens natively overlaying the gap) */}
                    <div className="hidden lg:flex absolute left-[-2rem] top-1/2 -translate-y-1/2 z-10 w-16 h-16 
                          items-center justify-center">
                        <button
                            onClick={handleSwap}
                            disabled={!outputText}
                            className="p-3 rounded-full bg-ocean-900 border border-white/20 text-slate-300
                           hover:text-neon-cyan hover:border-neon-cyan/50 hover:shadow-glow-cyan 
                           transition-all disabled:opacity-50 disabled:cursor-not-allowed rotate-90"
                            title="Move output to input"
                        >
                            <ArrowDownUp size={20} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                            Output
                        </h2>

                        {/* Mobile Swap Button */}
                        <button
                            onClick={handleSwap}
                            disabled={!outputText}
                            className="lg:hidden flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded bg-white/5 
                         text-slate-400 hover:text-neon-cyan hover:bg-white/10 disabled:opacity-50"
                        >
                            <ArrowDownUp size={12} />
                            Swap
                        </button>
                    </div>

                    <textarea
                        value={outputText}
                        readOnly
                        placeholder="Result will appear here..."
                        className="flex-1 w-full min-h-[300px] p-4 rounded-xl bg-ocean-900/60 border border-white/5 
                       text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none 
                       focus:border-neon-cyan/30 resize-y"
                        spellCheck={false}
                    />

                    <div className="flex mt-4">
                        <button
                            onClick={handleCopy}
                            disabled={!outputText}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm
                         bg-white/5 border border-white/10 text-slate-300
                         hover:bg-white/10 hover:border-white/20 transition-glow disabled:opacity-50"
                        >
                            {copied ? <Check size={18} className="text-neon-emerald" /> : <Copy size={18} />}
                            {copied ? 'Copied to Clipboard' : 'Copy Result'}
                        </button>
                    </div>
                </div>

            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Error Alert                                                         */}
            {/* ------------------------------------------------------------------ */}
            {error && (
                <div className="glass-panel p-4 flex items-start gap-3 border border-red-500/30 bg-red-500/5 animate-in slide-in-from-bottom-2 fade-in">
                    <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

        </div>
    );
}
