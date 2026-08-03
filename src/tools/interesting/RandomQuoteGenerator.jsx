import { useEffect, useState, useCallback } from 'react';
import {
    Check,
    Copy,
    MessageSquareQuote,
    RefreshCw,
    Share2,
    Quote
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Fallback Quotes (in case API fails)
// ---------------------------------------------------------------------------
const FALLBACK_QUOTES = [
    { quote: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
    { quote: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
    { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { quote: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
];

export default function RandomQuoteGenerator() {
    const [quote, setQuote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(false);

    // -------------------------------------------------------------------------
    // Fetch Quote
    // -------------------------------------------------------------------------
    const fetchQuote = useCallback(async () => {
        setIsLoading(true);
        setError(false);

        // Slight artificial delay for smooth refreshing feeling
        const delay = new Promise((resolve) => setTimeout(resolve, 400));

        try {
            const [res] = await Promise.all([
                fetch('https://dummyjson.com/quotes/random'),
                delay
            ]);

            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setQuote({ quote: data.quote, author: data.author });
        } catch (err) {
            // Fallback
            setError(true);
            const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
            setQuote(randomFallback);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuote();
    }, [fetchQuote]);

    // -------------------------------------------------------------------------
    // Actions
    // -------------------------------------------------------------------------
    const handleCopy = useCallback(async () => {
        if (!quote) return;
        const textToCopy = `"${quote.quote}" — ${quote.author}`;
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Silent catch
        }
    }, [quote]);

    const handleTweet = useCallback(() => {
        if (!quote) return;
        const text = encodeURIComponent(`"${quote.quote}" — ${quote.author}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }, [quote]);

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
        <div className="max-w-2xl mx-auto space-y-6">

            {/* Title */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-neon-emerald/10 text-neon-emerald flex items-center justify-center mb-2">
                    <MessageSquareQuote size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-100">Random Quote Generator</h2>
                <p className="text-sm text-slate-400 max-w-md">
                    Discover a new perspective with a random quote. Save it, share it, or let it inspire your next big idea.
                </p>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Quote Card                                                          */}
            {/* ------------------------------------------------------------------ */}
            <div className="relative group">

                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-emerald/20 to-neon-cyan/20 
                        rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

                <div className="relative glass-panel rounded-3xl p-8 sm:p-12 border border-white/10 
                        bg-gradient-to-br from-ocean-900/90 to-ocean-950/90 overflow-hidden min-h-[300px] flex flex-col justify-center">

                    {/* Decorative quote mark */}
                    <div className="absolute top-6 left-6 text-white/5 pointer-events-none transform -scale-x-100">
                        <Quote size={80} strokeWidth={1} fill="currentColor" />
                    </div>

                    <div className="relative z-10">
                        {isLoading && !quote ? (
                            <div className="flex flex-col items-center justify-center min-h-[120px] space-y-4">
                                <RefreshCw size={24} className="text-neon-emerald animate-spin" />
                                <p className="text-sm font-medium text-slate-400">Finding inspiration...</p>
                            </div>
                        ) : (
                            <div className={`transition-all duration-500 ease-in-out
                              ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                                {/* Quote Text */}
                                <h3 className="text-2xl sm:text-3xl font-medium text-slate-100 leading-snug sm:leading-snug text-center font-serif italic mb-6">
                                    "{quote?.quote}"
                                </h3>

                                {/* Author */}
                                <div className="flex items-center justify-center gap-4">
                                    <div className="h-px bg-white/20 w-12" />
                                    <p className="text-sm font-semibold tracking-wide text-neon-emerald uppercase">
                                        {quote?.author}
                                    </p>
                                    <div className="h-px bg-white/20 w-12" />
                                </div>

                                {error && (
                                    <p className="text-center text-[10px] text-slate-500 mt-8 mb-[-1rem]">
                                        (Showing offline quotes due to network error)
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Actions Strip                                                       */}
            {/* ------------------------------------------------------------------ */}
            <div className="flex items-center justify-center flex-wrap gap-4 mt-8">

                {/* Next Quote Button */}
                <button
                    onClick={fetchQuote}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium 
                     bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/30
                     hover:bg-neon-emerald/30 hover:shadow-glow-emerald transition-glow
                     disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    New Quote
                </button>

                {/* Copy Button */}
                <button
                    onClick={handleCopy}
                    disabled={isLoading || !quote}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium 
                     bg-white/5 text-slate-300 border border-white/10
                     hover:bg-white/10 hover:border-white/20 transition-glow
                     disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {copied ? <Check size={18} className="text-neon-emerald" /> : <Copy size={18} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>

                {/* Share Twitter Button */}
                <button
                    onClick={handleTweet}
                    disabled={isLoading || !quote}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium 
                     bg-[#1DA1F2]/10 text-[#1DA1F2] border border-[#1DA1F2]/20
                     hover:bg-[#1DA1F2]/20 transition-glow
                     disabled:opacity-50 disabled:cursor-not-allowed hidden sm:inline-flex"
                >
                    <Share2 size={18} />
                    Tweet
                </button>
            </div>

        </div>
    );
}
