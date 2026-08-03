import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRightLeft,
  Check,
  Copy,
  Download,
  FileInput,
  FileUp,
  Loader2,
  Package,
  Trash2,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import { downloadBlob } from '../../utils/pdfjs';

const TEXT_SAMPLE = 'OceanTools Base64 demo';
const DEFAULT_BASE64 = 'T2NlYW5Ub29scw==';

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += Array.from(chunk, (byte) => String.fromCodePoint(byte)).join('');
  }

  return btoa(binary);
}

function base64ToBytes(base64) {
  const cleaned = base64.replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.codePointAt(index) ?? 0;
  }

  return bytes;
}

function textToBase64(text) {
  return bytesToBase64(new TextEncoder().encode(text));
}

function base64ToText(base64) {
  return new TextDecoder().decode(base64ToBytes(base64));
}

function parseBase64Input(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Paste Base64 or upload a file to begin.');
  }

  const dataUrlMatch = trimmed.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,(.*)$/is);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1] || 'application/octet-stream',
      payload: dataUrlMatch[3],
      fileName: 'decoded-file',
    };
  }

  return {
    mimeType: 'application/octet-stream',
    payload: trimmed,
    fileName: 'decoded-file',
  };
}

function Base64StatsCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-semibold text-slate-200 mt-1 truncate">{value}</p>
    </div>
  );
}

function ActionButton({ onClick, children, className = '', disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}

function ModeToggle({ mode, setMode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-1">
      <ActionButton
        onClick={() => setMode('text')}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-glow ${mode === 'text' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'text-slate-300 hover:bg-white/5'}`}
      >
        <FileInput size={16} />
        Text
      </ActionButton>
      <ActionButton
        onClick={() => setMode('file')}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-glow ${mode === 'file' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'text-slate-300 hover:bg-white/5'}`}
      >
        <FileUp size={16} />
        File
      </ActionButton>
    </div>
  );
}

function InputPanel({
  mode,
  action,
  setAction,
  textInput,
  setTextInput,
  base64Input,
  setBase64Input,
  fileBase64,
  handleFileSelect,
  fileName,
  setFileName,
  fileMimeType,
  setFileMimeType,
}) {
  const inputValue = mode === 'text'
    ? (action === 'encode' ? textInput : base64Input)
    : (fileBase64 || base64Input);

  const onChange = (event) => {
    if (mode === 'text') {
      if (action === 'encode') {
        setTextInput(event.target.value);
      } else {
        setBase64Input(event.target.value);
      }
      return;
    }

    setBase64Input(event.target.value);
  };

  const placeholder = mode === 'text'
    ? (action === 'encode' ? 'Type text to encode...' : 'Paste Base64 to decode...')
    : 'Paste Base64 here to decode it back to a file...';

  return (
    <div>
      {mode === 'file' && (
        <div className="mb-4">
          <FileDropzone
            accept="*/*"
            onFiles={handleFileSelect}
            label="Drop any file here or click to browse"
            hint="Selected file will be encoded to Base64"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-2">
        <label htmlFor="base64-input" className="text-sm text-slate-400">
          {mode === 'text' ? 'Text or Base64 Input' : 'Base64 Input'}
        </label>
        {mode === 'text' && (
          <ActionButton
            onClick={() => setAction((prev) => (prev === 'encode' ? 'decode' : 'encode'))}
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-glow"
          >
            <ArrowRightLeft size={14} />
            {action === 'encode' ? 'Encode' : 'Decode'}
          </ActionButton>
        )}
      </div>

      <textarea
        id="base64-input"
        value={inputValue}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full min-h-105 p-4 rounded-xl bg-ocean-900/80 border border-white/10 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-neon-cyan/50 transition-glow resize-y"
        spellCheck={false}
      />

      {mode === 'file' && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="base64-file-name" className="block text-xs text-slate-500 mb-1">
              File Name
            </label>
            <input
              id="base64-file-name"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-neon-cyan/50 transition-glow"
            />
          </div>
          <div>
            <label htmlFor="base64-mime-type" className="block text-xs text-slate-500 mb-1">
              MIME Type
            </label>
            <input
              id="base64-mime-type"
              value={fileMimeType}
              onChange={(event) => setFileMimeType(event.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-neon-cyan/50 transition-glow"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function OutputPanel({
  mode,
  output,
  stats,
  copied,
  loading,
  status,
  setStatus,
  error,
  setError,
  textInput,
  base64Input,
  fileBase64,
  file,
  action,
  setOutput,
  handleCopy,
  handleDownload,
  handleClear,
  handleDecodeFile,
  runPrimaryAction,
}) {
  return (
    <div className="space-y-4">
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Output
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{stats.length} chars</span>
            <span>•</span>
            <span>{stats.lines} lines</span>
          </div>
        </div>

        <textarea
          value={output}
          readOnly
          placeholder={mode === 'text' ? 'Encoded or decoded result appears here...' : 'Encoded file Base64 appears here...'}
          className="w-full min-h-105 p-4 rounded-xl bg-ocean-900/60 border border-white/10 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none resize-y"
          spellCheck={false}
        />

        <div className="flex flex-wrap gap-3">
          <ActionButton
            onClick={runPrimaryAction}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-neon-cyan/20 text-neon-cyan font-medium border border-neon-cyan/30 hover:bg-neon-cyan/30 hover:shadow-glow-cyan transition-glow disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRightLeft size={18} />}
            Run
          </ActionButton>
          <ActionButton
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/5 text-slate-300 font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-glow"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied' : 'Copy'}
          </ActionButton>
          <ActionButton
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/5 text-slate-300 font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-glow"
          >
            <Download size={18} />
            Download
          </ActionButton>
          {mode === 'file' && (
            <ActionButton
              onClick={handleDecodeFile}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-neon-emerald/20 text-neon-emerald font-medium border border-neon-emerald/30 hover:bg-neon-emerald/30 hover:shadow-glow-emerald transition-glow"
            >
              <Package size={18} />
              Decode File
            </ActionButton>
          )}
          <ActionButton
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 text-slate-300 font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-glow"
          >
            <Trash2 size={17} />
            Clear
          </ActionButton>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Base64StatsCard label="Input Type" value={mode === 'text' ? 'Text' : 'File'} />
        <Base64StatsCard label="Status" value={status || 'Ready'} />
        <Base64StatsCard label="File" value={file?.name || 'None'} />
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

/**
 * Base64 Encoder/Decoder — convert text or files to and from Base64 locally.
 */
export default function Base64Encoder() {
  const [mode, setMode] = useState('text');
  const [action, setAction] = useState('encode');
  const [textInput, setTextInput] = useState(TEXT_SAMPLE);
  const [base64Input, setBase64Input] = useState(DEFAULT_BASE64);
  const [file, setFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [fileMimeType, setFileMimeType] = useState('application/octet-stream');
  const [fileName, setFileName] = useState('decoded-file.bin');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    const text = output || (mode === 'text' ? (action === 'encode' ? textInput : base64Input) : (fileBase64 || base64Input));
    return {
      length: text.length,
      lines: text ? text.split('\n').length : 0,
    };
  }, [action, base64Input, fileBase64, mode, output, textInput]);

  const handleFileSelect = useCallback(async (files) => {
    const selected = files[0];
    if (!selected) return;

    setLoading(true);
    setError('');
    setStatus('');
    setOutput('');
    setFile(selected);
    setFileName(selected.name || 'decoded-file.bin');
    setFileMimeType(selected.type || 'application/octet-stream');

    try {
      const bytes = new Uint8Array(await selected.arrayBuffer());
      setFileBase64(bytesToBase64(bytes));
    } catch {
      setError('Could not read the selected file.');
      setFile(null);
      setFileBase64('');
    } finally {
      setLoading(false);
    }
  }, []);

  const runPrimaryAction = useCallback(() => {
    if (mode === 'text') {
      try {
        if (action === 'encode') {
          setOutput(textToBase64(textInput));
          setStatus('Text encoded to Base64.');
        } else {
          setOutput(base64ToText(base64Input));
          setStatus('Base64 decoded to text.');
        }
        setError('');
      } catch (err) {
        setOutput('');
        setError(err.message || 'Invalid Base64 input.');
        setStatus('');
      }
      return;
    }

    if (!file && !fileBase64 && !base64Input.trim()) {
      setError('Upload a file or paste Base64 to continue.');
      return;
    }

    setOutput(fileBase64 || base64Input);
    setError('');
    setStatus('Base64 ready.');
  }, [action, base64Input, file, fileBase64, mode, textInput]);

  const handleDecodeFile = useCallback(() => {
    try {
      setError('');
      const parsed = parseBase64Input(base64Input || fileBase64 || output);
      const bytes = base64ToBytes(parsed.payload);
      const blob = new Blob([bytes], { type: parsed.mimeType || fileMimeType });
      downloadBlob(blob, fileName || parsed.fileName || 'decoded-file.bin');
      setStatus('Decoded file downloaded.');
    } catch {
      setError('Invalid Base64 input.');
      setStatus('');
    }
  }, [base64Input, fileBase64, fileMimeType, fileName, output]);

  const handleCopy = useCallback(async () => {
    const textToCopy = output || (mode === 'text' ? (action === 'encode' ? textInput : base64Input) : (fileBase64 || base64Input));
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Clipboard access is blocked in this browser.');
    }
  }, [action, base64Input, fileBase64, mode, output, textInput]);

  const handleDownload = useCallback(() => {
    const textToDownload = output || (mode === 'text' ? (action === 'encode' ? textInput : base64Input) : (fileBase64 || base64Input));
    if (!textToDownload) return;

    const filename = mode === 'text' ? 'base64-output.txt' : 'base64.txt';
    downloadBlob(new Blob([textToDownload], { type: 'text/plain;charset=utf-8' }), filename);
  }, [action, base64Input, fileBase64, mode, output, textInput]);

  const handleClear = useCallback(() => {
    setMode('text');
    setAction('encode');
    setTextInput(TEXT_SAMPLE);
    setBase64Input(DEFAULT_BASE64);
    setFile(null);
    setFileBase64('');
    setOutput('');
    setError('');
    setStatus('');
    setCopied(false);
    setFileName('decoded-file.bin');
    setFileMimeType('application/octet-stream');
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Mode
          </h2>
          <ModeToggle mode={mode} setMode={setMode} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InputPanel
            mode={mode}
            action={action}
            setAction={setAction}
            textInput={textInput}
            setTextInput={setTextInput}
            base64Input={base64Input}
            setBase64Input={setBase64Input}
            fileBase64={fileBase64}
            handleFileSelect={handleFileSelect}
            fileName={fileName}
            setFileName={setFileName}
            fileMimeType={fileMimeType}
            setFileMimeType={setFileMimeType}
          />

          <OutputPanel
            mode={mode}
            output={output}
            stats={stats}
            copied={copied}
            loading={loading}
            status={status}
            setStatus={setStatus}
            error={error}
            setError={setError}
            textInput={textInput}
            base64Input={base64Input}
            fileBase64={fileBase64}
            file={file}
            action={action}
            setOutput={setOutput}
            handleCopy={handleCopy}
            handleDownload={handleDownload}
            handleClear={handleClear}
            handleDecodeFile={handleDecodeFile}
            runPrimaryAction={runPrimaryAction}
          />
        </div>
      </div>
    </div>
  );
}
