import { useState } from 'react';
import { marked } from 'marked';
import { FileText, Copy, Check, Trash2, Eye } from 'lucide-react';

export default function MarkdownPreview() {
    const [markdown, setMarkdown] = useState(
        `# Hello Markdown
Welcome to the markdown previewer!

## Features
- **Live Preview:** See HTML as you type
- *Styling Supported:* Headings, bold, italics, links
- \`Code blocks\` are also supported

\`\`\`javascript
function generatePreview() {
    return "Awesome!";
}
\`\`\`

> "Markdown is the standard for text-to-HTML conversion."

### Table of Contents
1. Item 1
2. Item 2
`
    );
    const [copied, setCopied] = useState(false);

    // Provide safe HTML config
    const rawHtml = marked.parse(markdown, {
        gfm: true,
        breaks: true,
    });

    const handleCopyHtml = async () => {
        try {
            await navigator.clipboard.writeText(rawHtml);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)] min-h-[500px]">

                {/* Editor Panel */}
                <div className="glass-panel p-5 border border-white/10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={16} className="text-neon-cyan" />
                            Markdown Editor
                        </h2>
                        <button onClick={() => setMarkdown('')} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Clear text">
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <textarea
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        placeholder="Write your markdown here..."
                        className="flex-1 w-full p-5 rounded-xl bg-ocean-900/40 border border-white/5 
                                   text-slate-200 placeholder:text-slate-600 focus:outline-none 
                                   focus:border-neon-cyan/50 focus:bg-ocean-900/80 transition-all resize-none font-mono text-sm"
                        spellCheck={false}
                    />
                </div>

                {/* Preview Panel */}
                <div className="glass-panel p-5 border border-white/10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Eye size={16} className="text-neon-emerald" />
                            Live HTML Preview
                        </h2>
                        <button onClick={handleCopyHtml} className="px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all" title="Copy raw HTML output">
                            {copied ? <Check size={14} className="text-neon-emerald" /> : <Copy size={14} />}
                            Copy HTML
                        </button>
                    </div>

                    <div
                        className="flex-1 w-full p-5 rounded-xl bg-ocean-950 border border-white/5 overflow-y-auto custom-scrollbar prose prose-invert prose-cyan max-w-none text-slate-300 prose-headings:text-slate-100 prose-a:text-neon-cyan prose-code:text-neon-emerald"
                        dangerouslySetInnerHTML={{ __html: rawHtml }}
                    />
                </div>

            </div>
        </div>
    );
}
