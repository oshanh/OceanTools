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
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import { downloadBlob } from '../../utils/pdfjs';

/**
 * JSON Formatter — format, minify, validate, and inspect JSON locally in the browser.
 */
export default function JSONFormatter() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    const text = outputText || inputText;
    return {
      characters: text.length,
      lines: text ? text.split('\n').length : 0,
    };
  }, [inputText, outputText]);

  const parseJson = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Paste or upload JSON to begin.');
    }

    return JSON.parse(trimmed);
  }, []);

  const setParseError = useCallback((err) => {
    if (!(err instanceof SyntaxError)) {
      setError(err.message || 'Invalid JSON.');
      return;
    }

    const message = err.message || 'Invalid JSON.';
    const lineMatch = /line\s+(\d+)/i.exec(message);
    const columnMatch = /column\s+(\d+)/i.exec(message);
    const locationParts = [];

    if (lineMatch) locationParts.push(`line ${lineMatch[1]}`);
    if (columnMatch) locationParts.push(`column ${columnMatch[1]}`);

    setError(
      locationParts.length
        ? `Invalid JSON near ${locationParts.join(', ')}: ${message}`
        : `Invalid JSON: ${message}`,
    );
  }, []);

  const handleFormat = useCallback(() => {
    try {
      setError(null);
      const parsed = parseJson(inputText);
      const formatted = JSON.stringify(parsed, null, indentSize);
      setOutputText(formatted);
      setStatus('Formatted JSON successfully.');
    } catch (err) {
      setOutputText('');
      setStatus('');
      setParseError(err);
    }
  }, [indentSize, inputText, parseJson, setParseError]);

  const handleMinify = useCallback(() => {
    try {
      setError(null);
      const parsed = parseJson(inputText);
      const minified = JSON.stringify(parsed);
      setOutputText(minified);
      setStatus('Minified JSON successfully.');
    } catch (err) {
      setOutputText('');
      setStatus('');
      setParseError(err);
    }
  }, [inputText, parseJson, setParseError]);

  const handleValidate = useCallback(() => {
    try {
      parseJson(inputText);
      setError(null);
      setStatus('JSON is valid.');
      setOutputText('');
    } catch (err) {
      setOutputText('');
      setStatus('');
      setParseError(err);
    }
  }, [inputText, parseJson, setParseError]);

  const handleCopy = useCallback(async () => {
    const textToCopy = outputText || inputText;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Clipboard access is blocked in this browser.');
    }
  }, [inputText, outputText]);

  const handleDownload = useCallback(() => {
    const textToDownload = outputText || inputText;
    if (!textToDownload) return;

    const blob = new Blob([textToDownload], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, outputText ? 'formatted.json' : 'json-input.json');
  }, [inputText, outputText]);

  const handleClear = useCallback(() => {
    setInputText('');
    setOutputText('');
    setError(null);
    setStatus('');
    setCopied(false);
  }, []);

  const handleFileLoad = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setStatus('');

    try {
      const text = await file.text();
      setInputText(text);
      setOutputText('');
    } catch {
      setError('Could not read the selected file.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <FileDropzone
        accept=".json,application/json,text/plain"
        onFiles={handleFileLoad}
        label="Drop JSON file here or click to browse"
        hint="Load .json or .txt files, then format, minify, or validate instantly"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Input JSON
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="json-indent" className="text-xs text-slate-500">
                Indent
              </label>
              <select
                id="json-indent"
                value={indentSize}
                onChange={(e) => setIndentSize(Number(e.target.value))}
                className="themed-select px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-neon-cyan/50 transition-glow"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={8}>8 spaces</option>
              </select>
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste JSON here..."
            className="w-full p-4 rounded-xl bg-ocean-900/80 border border-white/10 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-neon-cyan/50 transition-glow resize-y"
            style={{ minHeight: '420px' }}
            spellCheck={false}
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleFormat}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-neon-cyan/20 text-neon-cyan font-medium border border-neon-cyan/30 hover:bg-neon-cyan/30 hover:shadow-glow-cyan transition-glow disabled:opacity-50"
            >
              <FileCode2 size={18} />
              Format
            </button>
            <button
              onClick={handleMinify}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/5 text-slate-300 font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-glow disabled:opacity-50"
            >
              <Sparkles size={18} />
              Minify
            </button>
            <button
              onClick={handleValidate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-neon-emerald/20 text-neon-emerald font-medium border border-neon-emerald/30 hover:bg-neon-emerald/30 hover:shadow-glow-emerald transition-glow disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Validate
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 text-slate-300 font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-glow"
            >
              <Trash2 size={17} />
              Clear
            </button>
          </div>
        </div>

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
            className="w-full p-4 rounded-xl bg-ocean-900/60 border border-white/10 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none resize-y"
            style={{ minHeight: '420px' }}
            spellCheck={false}
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/5 text-slate-300 font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-glow"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/5 text-slate-300 font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-glow"
            >
              <Download size={18} />
              Download
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-panel p-4 flex items-start gap-3 border border-red-500/30 bg-red-500/5">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {status && !error && (
        <div className="glass-panel p-4 flex items-start gap-3 border border-neon-emerald/30 bg-neon-emerald/5">
          <Check size={20} className="text-neon-emerald shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300">{status}</p>
        </div>
      )}
    </div>
  );
}
