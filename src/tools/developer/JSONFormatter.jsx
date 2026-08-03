import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileCode2,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import { downloadBlob } from '../../utils/pdfjs';
import { fixJson } from '../../utils/jsonFixer';

/**
 * JSON Formatter — format, minify, validate, auto-fix, and inspect JSON locally.
 */
export default function JSONFormatter() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  /** List of { rule, count } objects from the last auto-fix run */
  const [appliedFixes, setAppliedFixes] = useState([]);
  const [fixFailed, setFixFailed] = useState(false);

  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    const text = outputText || inputText;
    return {
      characters: text.length,
      lines: text ? text.split('\n').length : 0,
    };
  }, [inputText, outputText]);

  // ---------------------------------------------------------------------------
  const parseJson = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Paste or upload JSON to begin.');
    return JSON.parse(trimmed);
  }, []);

  const setParseError = useCallback((err) => {
    if (!(err instanceof SyntaxError)) {
      setError(err.message || 'Invalid JSON.');
      return;
    }
    const message = err.message || 'Invalid JSON.';
    const lineMatch = /line\s+(\d+)/i.exec(message);
    const colMatch = /column\s+(\d+)/i.exec(message);
    const parts = [];
    if (lineMatch) parts.push(`line ${lineMatch[1]}`);
    if (colMatch) parts.push(`column ${colMatch[1]}`);
    setError(parts.length ? `Invalid JSON near ${parts.join(', ')}: ${message}` : `Invalid JSON: ${message}`);
  }, []);

  // ---------------------------------------------------------------------------
  const clearFixes = () => { setAppliedFixes([]); setFixFailed(false); };

  const handleFormat = useCallback(() => {
    try {
      setError(null); clearFixes();
      const parsed = parseJson(inputText);
      const formatted = JSON.stringify(parsed, null, indentSize);
      setOutputText(formatted);
      setStatus('Formatted JSON successfully.');
    } catch (err) {
      setOutputText(''); setStatus(''); setParseError(err);
    }
  }, [indentSize, inputText, parseJson, setParseError]);

  const handleMinify = useCallback(() => {
    try {
      setError(null); clearFixes();
      const parsed = parseJson(inputText);
      const minified = JSON.stringify(parsed);
      setOutputText(minified);
      setStatus('Minified JSON successfully.');
    } catch (err) {
      setOutputText(''); setStatus(''); setParseError(err);
    }
  }, [inputText, parseJson, setParseError]);

  const handleValidate = useCallback(() => {
    try {
      parseJson(inputText);
      setError(null); clearFixes();
      setStatus('JSON is valid ✓');
      setOutputText('');
    } catch (err) {
      setOutputText(''); setStatus(''); setParseError(err);
    }
  }, [inputText, parseJson, setParseError]);

  // ---------------------------------------------------------------------------
  /** Auto-fix: attempt to repair the raw input, then format it */
  const handleAutoFix = useCallback(() => {
    setError(null);
    setAppliedFixes([]);
    setFixFailed(false);
    setStatus('');

    const src = inputText.trim();
    if (!src) { setError('Paste or upload JSON to begin.'); return; }

    const { fixed, fixes, success, error: fixError } = fixJson(src);

    setAppliedFixes(fixes);

    if (success) {
      // Replace input with the corrected text and format it
      const formatted = JSON.stringify(JSON.parse(fixed.trim()), null, indentSize);
      setInputText(fixed);
      setOutputText(formatted);
      setStatus(fixes.length === 0 ? 'No corrections needed — JSON is already valid.' : `Applied ${fixes.length} fix${fixes.length !== 1 ? 'es' : ''}. JSON formatted successfully.`);
    } else {
      // Partial fix — still show what changed
      setInputText(fixed);
      setFixFailed(true);
      setError(fixError || 'Could not fully repair the JSON. Review the remaining error and edit manually.');
    }
  }, [inputText, indentSize]);

  // ---------------------------------------------------------------------------
  const handleCopy = useCallback(async () => {
    const text = outputText || inputText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Clipboard access is blocked in this browser.');
    }
  }, [inputText, outputText]);

  const handleDownload = useCallback(() => {
    const text = outputText || inputText;
    if (!text) return;
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, outputText ? 'formatted.json' : 'json-input.json');
  }, [inputText, outputText]);

  const handleClear = useCallback(() => {
    setInputText(''); setOutputText(''); setError(null);
    setStatus(''); setCopied(false); clearFixes();
  }, []);

  const handleFileLoad = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    setLoading(true); setError(null); setStatus('');
    try {
      const text = await file.text();
      setInputText(text); setOutputText(''); clearFixes();
    } catch {
      setError('Could not read the selected file.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <FileDropzone
        accept=".json,application/json,text/plain"
        onFiles={handleFileLoad}
        label="Drop JSON file here or click to browse"
        hint="Load .json or .txt files, then format, minify, validate, or auto-fix"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ---- Input panel ---- */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Input JSON
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="json-indent" className="text-xs text-slate-500">Indent</label>
              <select
                id="json-indent"
                value={indentSize}
                onChange={(e) => setIndentSize(Number(e.target.value))}
                className="themed-select px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg
                           text-slate-200 text-sm focus:outline-none focus:border-neon-cyan/50 transition-glow"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={8}>8 spaces</option>
              </select>
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => { setInputText(e.target.value); clearFixes(); }}
            placeholder="Paste JSON here..."
            className="w-full p-4 rounded-xl bg-ocean-900/80 border border-white/10 text-sm font-mono
                       text-slate-200 placeholder:text-slate-500 focus:outline-none
                       focus:border-neon-cyan/50 transition-glow resize-y"
            style={{ minHeight: '420px' }}
            spellCheck={false}
          />

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleFormat}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg
                         bg-neon-cyan/20 text-neon-cyan font-medium border border-neon-cyan/30
                         hover:bg-neon-cyan/30 hover:shadow-glow-cyan transition-glow disabled:opacity-50"
            >
              <FileCode2 size={18} />
              Format
            </button>

            <button
              onClick={handleMinify}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg
                         bg-white/5 text-slate-300 font-medium border border-white/10
                         hover:bg-white/10 hover:border-white/20 transition-glow disabled:opacity-50"
            >
              <Sparkles size={18} />
              Minify
            </button>

            <button
              onClick={handleValidate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg
                         bg-neon-emerald/20 text-neon-emerald font-medium border border-neon-emerald/30
                         hover:bg-neon-emerald/30 hover:shadow-glow-emerald transition-glow disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Validate
            </button>

            {/* Auto-Fix — primary accent */}
            <button
              onClick={handleAutoFix}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-medium border
                         bg-violet-500/20 text-violet-300 border-violet-500/30
                         hover:bg-violet-500/30 hover:shadow-[0_0_12px_rgba(139,92,246,0.4)]
                         transition-glow disabled:opacity-50"
              title="Attempt to auto-fix common JSON errors"
            >
              <Wand2 size={18} />
              Auto-Fix
            </button>

            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg
                         bg-white/5 text-slate-300 font-medium border border-white/10
                         hover:bg-white/10 hover:border-white/20 transition-glow"
            >
              <Trash2 size={17} />
              Clear
            </button>
          </div>
        </div>

        {/* ---- Output panel ---- */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Output
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{stats.characters} chars</span>
              <span>•</span>
              <span>{stats.lines} lines</span>
            </div>
          </div>

          <textarea
            value={outputText}
            readOnly
            placeholder="Formatted JSON will appear here..."
            className="w-full p-4 rounded-xl bg-ocean-900/60 border border-white/10 text-sm font-mono
                       text-slate-200 placeholder:text-slate-500 focus:outline-none resize-y"
            style={{ minHeight: '420px' }}
            spellCheck={false}
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg
                         bg-white/5 text-slate-300 font-medium border border-white/10
                         hover:bg-white/10 hover:border-white/20 transition-glow"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg
                         bg-white/5 text-slate-300 font-medium border border-white/10
                         hover:bg-white/10 hover:border-white/20 transition-glow"
            >
              <Download size={18} />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Auto-Fix change summary                                              */}
      {/* ------------------------------------------------------------------ */}
      {appliedFixes.length > 0 && (
        <div className={`glass-panel p-5 space-y-4 border ${fixFailed ? 'border-amber-500/30 bg-amber-500/5' : 'border-violet-500/30 bg-violet-500/5'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 size={16} className={fixFailed ? 'text-amber-400' : 'text-violet-400'} />
              <h3 className={`text-sm font-semibold ${fixFailed ? 'text-amber-300' : 'text-violet-300'}`}>
                {fixFailed ? 'Partial fix applied' : `${appliedFixes.length} correction${appliedFixes.length !== 1 ? 's' : ''} applied`}
              </h3>
            </div>
            <button
              onClick={clearFixes}
              className="p-1 rounded text-slate-500 hover:text-slate-300 transition-glow"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {appliedFixes.map(({ rule, count }) => (
              <div
                key={rule.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                           bg-white/5 border border-violet-500/20 text-slate-300"
                title={rule.description}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                <span className="font-medium">{rule.label}</span>
                {count > 1 && (
                  <span className="text-violet-400 font-mono">×{count}</span>
                )}
              </div>
            ))}
          </div>

          {/* Per-fix detail rows */}
          <div className="space-y-1.5">
            {appliedFixes.map(({ rule, count }) => (
              <div key={rule.id} className="flex items-start gap-2 text-xs text-slate-400">
                <Check size={12} className="text-violet-400 mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium text-slate-300">{rule.label}</span>
                  {' — '}
                  {rule.description}
                  {count > 1 && (
                    <span className="ml-1 text-slate-500">({count} occurrences)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No-fix needed banner */}
      {appliedFixes.length === 0 && status.includes('already valid') && (
        <div className="glass-panel p-4 flex items-center gap-3 border border-violet-500/30 bg-violet-500/5">
          <Wand2 size={18} className="text-violet-400 shrink-0" />
          <p className="text-sm text-violet-300">No corrections needed — the JSON is already valid.</p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Error                                                                */}
      {/* ------------------------------------------------------------------ */}
      {error && (
        <div className="glass-panel p-4 flex items-start gap-3 border border-red-500/30 bg-red-500/5">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Success status                                                        */}
      {/* ------------------------------------------------------------------ */}
      {status && !error && !status.includes('already valid') && (
        <div className="glass-panel p-4 flex items-start gap-3 border border-neon-emerald/30 bg-neon-emerald/5">
          <Check size={20} className="text-neon-emerald shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300">{status}</p>
        </div>
      )}
    </div>
  );
}
