import { useState, useMemo } from 'react';
import { AlignLeft, Copy, Check } from 'lucide-react';

const LOREM_WORDS = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consetetur", "sadipscing", "elitr",
    "sed", "diam", "nonumy", "eirmod", "tempor", "invidunt", "ut", "labore", "et",
    "dolore", "magna", "aliquyam", "erat", "voluptua", "at", "vero", "eos", "accusam",
    "justo", "duo", "dolores", "ea", "rebum", "stet", "clita", "kasd", "gubergren",
    "no", "sea", "takimata", "sanctus", "est"
];

function generateParagraph() {
    const sentenceCount = Math.floor(Math.random() * 5) + 3; // 3 to 7 sentences
    let paragraph = [];

    for (let i = 0; i < sentenceCount; i++) {
        const wordCount = Math.floor(Math.random() * 10) + 6; // 6 to 15 words
        let sentence = [];
        for (let j = 0; j < wordCount; j++) {
            sentence.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
        }
        // Capitalize first word
        sentence[0] = sentence[0].charAt(0).toUpperCase() + sentence[0].slice(1);
        paragraph.push(sentence.join(' ') + '.');
    }

    return paragraph.join(' ');
}

export default function LoremIpsumGenerator() {
    const [paragraphs, setParagraphs] = useState(3);
    const [copied, setCopied] = useState(false);

    // Regenerate fully when slider changes or explicit reroll requested
    const [seed, setSeed] = useState(0);

    const generatedText = useMemo(() => {
        let text = [];
        for (let i = 0; i < paragraphs; i++) {
            if (i === 0 && seed === 0) {
                // Classic start for very first run just because people expect it
                let p = generateParagraph();
                text.push("Lorem ipsum dolor sit amet, consetetur sadipscing elitr, " + p.substring(p.indexOf(' ') + 1));
            } else {
                text.push(generateParagraph());
            }
        }
        return text.join('\n\n');
    }, [paragraphs, seed]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            <div className="glass-panel p-5 grid grid-cols-1 md:grid-cols-2 gap-6 border border-white/10">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Number of Paragraphs: {paragraphs}</label>
                    <input
                        type="range"
                        min="1" max="50"
                        value={paragraphs}
                        onChange={(e) => setParagraphs(parseInt(e.target.value, 10))}
                        className="w-full accent-neon-cyan h-2 bg-ocean-900 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div className="flex items-end justify-end">
                    <button
                        onClick={() => setSeed(s => s + 1)}
                        className="py-2 px-4 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-bold text-sm hover:bg-neon-cyan/20 transition-all shadow-glow-cyan"
                    >
                        Generate New Text
                    </button>
                </div>
            </div>

            <div className="glass-panel p-5 border border-white/10 relative">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <AlignLeft size={16} className="text-neon-cyan" />
                        Generated Lorem Ipsum
                    </h2>
                    <button onClick={handleCopy} className="px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all">
                        {copied ? <Check size={14} className="text-neon-emerald" /> : <Copy size={14} />}
                        Copy All
                    </button>
                </div>

                <div className="w-full min-h-[400px] max-h-[600px] overflow-y-auto p-5 rounded-xl bg-ocean-900/60 border border-white/5 text-lg leading-relaxed text-slate-300 custom-scrollbar whitespace-pre-wrap font-serif">
                    {generatedText}
                </div>
            </div>

        </div>
    );
}
