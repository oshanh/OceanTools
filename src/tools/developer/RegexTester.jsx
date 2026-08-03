import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  FileCode2,
  Loader2,
  Replace,
  SearchCode,
  Trash2,
} from 'lucide-react';
import { downloadBlob } from '../../utils/pdfjs';

const SAMPLE_TEXT = `OceanTools lets you format JSON, test regex, and remove backgrounds.
Email support: hello@oceantools.dev
Order IDs: OT-1024, OT-2048, OT-4096
Hex colors: #22d3ee, #2dd4bf, #4ade80`;

const SAMPLE_PATTERNS = [
  { label: 'Emails', pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}', flags: 'gi' },
  { label: 'Order IDs', pattern: 'OT-(\\d+)', flags: 'g' },
  { label: 'Hex Colors', pattern: '#(?:[0-9a-fA-F]{3}){1,2}', flags: 'gi' },
];

function parseRegexInput(patternInput, flagsInput) {
  const trimmed = patternInput.trim();
  if (!trimmed) {
    throw new Error('Enter a regex pattern to begin.');
  }

  const slashLiteral = trimmed.match(/^\/(.*)\/([a-z]*)$/i);
  if (slashLiteral) {
    return {
      source: slashLiteral[1],
      flags: slashLiteral[2] || flagsInput,
    };
  }

  return {
    source: trimmed,
    flags: flagsInput,
  };
}

function buildRegex(source, flags, forceGlobal = false) {
  const normalizedFlags = Array.from(new Set(`${flags}${forceGlobal ? 'g' : ''}`.split(''))).join('');
  return new RegExp(source, normalizedFlags);
}

function toGlobalFlags(flags) {
  return Array.from(new Set(`${flags}g`.split(''))).join('');
}

function highlightMatches(text, matches) {
  if (!text) return [];
  if (!matches.length) return [text];

  const segments = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const start = match.index ?? 0;
    const end = start + (match[0]?.length ?? 0);

    if (start > lastIndex) {
      segments.push(text.slice(lastIndex, start));
    }

    segments.push(
      <mark
        key={`match-${index}-${start}`}
        className="rounded-md bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 px-0.5"
      >
        {end > start ? text.slice(start, end) : '∅'}
      </mark>,
    );

    lastIndex = end;
  });

  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  return segments;
}

function formatGroups(match) {
  const namedGroups = match.groups && Object.keys(match.groups).length ? match.groups : null;
  const numberedGroups = match.length > 1 ? match.slice(1) : null;

  return {
    namedGroups,
    numberedGroups,
  };
}

/**
 * Regex Tester — test, inspect, highlight, and replace regex matches locally.
 */
export default function RegexTester() {
  const [patternInput, setPatternInput] = useState('/\\b[A-Z]{2}-\\d+\\b/gi');
  const [flagsInput, setFlagsInput] = useState('gi');
  const [testText, setTestText] = useState(SAMPLE_TEXT);
  const [replacement, setReplacement] = useState('$&');
  const [replaceAll, setReplaceAll] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const regexState = useMemo(() => {
    try {
      const parsed = parseRegexInput(patternInput, flagsInput);
      const regex = buildRegex(parsed.source, parsed.flags, true);
      const matches = testText ? Array.from(testText.matchAll(regex)) : [];
      const previewRegex = buildRegex(parsed.source, parsed.flags, replaceAll);
      const replacementPreview = testText ? testText.replace(previewRegex, replacement) : '';

      return {
        valid: true,
        source: parsed.source,
        flags: parsed.flags,
        regex,
        matches,
        replacementPreview,
      };
    } catch (err) {
      return {
        valid: false,
        error: err.message || 'Invalid regular expression.',
        matches: [],
        replacementPreview: '',
      };
    }
  }, [flagsInput, patternInput, replaceAll, replacement, testText]);

  const stats = useMemo(() => {
    const matchCount = regexState.matches.length;
    const totalChars = testText.length;
    const highlightedChars = regexState.matches.reduce((sum, match) => sum + (match[0]?.length ?? 0), 0);

    return {
      matchCount,
      totalChars,
      highlightedChars,
      lines: testText ? testText.split('\n').length : 0,
    };
  }, [regexState.matches, testText]);

  const handleRun = useCallback(() => {
    if (!patternInput.trim()) {
      setError('Enter a regex pattern to begin.');
      setStatus('');
      return;
    }

    if (!regexState.valid) {
      setError(regexState.error || 'Invalid regular expression.');
      setStatus('');
      return;
    }

    setError('');
    setStatus(`Found ${stats.matchCount} match${stats.matchCount === 1 ? '' : 'es'}.`);
  }, [patternInput, regexState.error, regexState.valid, stats.matchCount]);

  const handleCopy = useCallback(async (text) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Clipboard access is blocked in this browser.');
    }
  }, []);

  const handleDownload = useCallback(() => {
    const payload = [
      `Pattern: ${patternInput}`,
      `Flags: ${flagsInput}`,
      `Replace all: ${replaceAll ? 'yes' : 'no'}`,
      '',
      'Input:',
      testText,
      '',
      'Replacement preview:',
      regexState.replacementPreview || '',
    ].join('\n');

    downloadBlob(new Blob([payload], { type: 'text/plain;charset=utf-8' }), 'regex-test.txt');
  }, [flagsInput, patternInput, regexState.replacementPreview, replaceAll, testText]);

  const applySample = useCallback((sample) => {
    setPatternInput(sample.pattern);
    setFlagsInput(sample.flags);
    setError('');
    setStatus(`Loaded ${sample.label} sample.`);
  }, []);

  const handleReset = useCallback(() => {
    setPatternInput('/\\b[A-Z]{2}-\\d+\\b/gi');
    setFlagsInput('gi');
    setTestText(SAMPLE_TEXT);
    setReplacement('$&');
    setReplaceAll(true);
    setError('');
    setStatus('');
    setCopied(false);
  }, []);

  const selectedMatches = regexState.matches;
  const highlightedPreview = highlightMatches(testText, selectedMatches);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Pattern Settings
          </h2>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PATTERNS.map((sample) => (
              <button
                key={sample.label}
                onClick={() => applySample(sample)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-glow text-sm"
              >
                <SearchCode size={14} />
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <label htmlFor="regex-pattern" className="block text-sm text-slate-400 mb-2">
              Regex Pattern
            </label>
            <input
              id="regex-pattern"
              value={patternInput}
              onChange={(e) => setPatternInput(e.target.value)}
              placeholder="e.g. /hello(\\s+world)?/gi"
              className="w-full px-4 py-3 rounded-xl bg-ocean-900/80 border border-white/10 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-neon-cyan/50 transition-glow"
              spellCheck={false}
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="regex-flags" className="block text-sm text-slate-400 mb-2">
              Flags
            </label>
            <input
              id="regex-flags"
              value={flagsInput}
              onChange={(e) => setFlagsInput(e.target.value)}
              placeholder="gi"
              className="w-full px-4 py-3 rounded-xl bg-ocean-900/80 border border-white/10 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-neon-cyan/50 transition-glow"
              spellCheck={false}
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="regex-replace-all" className="block text-sm text-slate-400 mb-2">
              Replace
            </label>
            <div className="flex items-center h-[48px] gap-2 px-4 rounded-xl bg-ocean-900/80 border border-white/10">
              <input
                id="regex-replace-all"
                type="checkbox"
                checked={replaceAll}
                onChange={(e) => setReplaceAll(e.target.checked)}
                className="accent-neon-cyan"
              />
              <span className="text-sm text-slate-300">All</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label htmlFor="regex-replacement" className="block text-sm text-slate-400 mb-2">
              Replacement Text
            </label>
            <input
              id="regex-replacement"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="$1, $&, $&"
              className="w-full px-4 py-3 rounded-xl bg-ocean-900/80 border border-white/10 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-neon-cyan/50 transition-glow"
              spellCheck={false}
            />
            <p className="text-xs text-slate-500 mt-2">
              Supports capture groups like $1 and $& for the full match.
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Quick Actions</label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRun}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-neon-cyan/20 text-neon-cyan font-medium border border-neon-cyan/30 hover:bg-neon-cyan/30 hover:shadow-glow-cyan transition-glow disabled:opacity-50"
              >
                <FileCode2 size={18} />
                Test Regex
              </button>
              <button
                onClick={() => handleCopy(regexState.replacementPreview || testText)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/5 text-slate-300 font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-glow"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/5 text-slate-300 font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-glow"
              >
                <Replace size={18} />
                Download Report
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 text-slate-300 font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-glow"
              >
                <Trash2 size={17} />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Test String
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{stats.totalChars} chars</span>
              <span>•</span>
              <span>{stats.lines} lines</span>
            </div>
          </div>

          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Paste text to test against your regex..."
            className="w-full min-h-[420px] p-4 rounded-xl bg-ocean-900/80 border border-white/10 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-neon-cyan/50 transition-glow resize-y"
            spellCheck={false}
          />

          <div className="glass-panel p-4 bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Preview
            </h3>
            <div className="text-sm text-slate-200 leading-7 break-words font-mono whitespace-pre-wrap">
              {highlightedPreview}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Match Results
              </h2>
              <span className="text-xs text-slate-500">
                {regexState.valid ? `${stats.matchCount} match${stats.matchCount === 1 ? '' : 'es'}` : 'Waiting for valid pattern'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Matches</p>
                <p className="text-2xl font-bold text-neon-cyan mt-1">{stats.matchCount}</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Matched chars</p>
                <p className="text-2xl font-bold text-neon-emerald mt-1">{stats.highlightedChars}</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Flags</p>
                <p className="text-2xl font-bold text-slate-200 mt-1 font-mono">{regexState.flags || 'none'}</p>
              </div>
            </div>

            <div className="rounded-xl bg-ocean-900/70 border border-white/10 p-4 space-y-3">
              <p className="text-sm font-medium text-slate-300">Replacement Preview</p>
              <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words font-mono">
{regexState.replacementPreview || 'No replacement preview available yet.'}
              </pre>
            </div>
          </div>

          <div className="glass-panel p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Matches
            </h2>

            <div className="space-y-3 max-h-[470px] overflow-y-auto pr-1">
              {regexState.valid && regexState.matches.length > 0 ? (
                regexState.matches.map((match, index) => {
                  const groups = formatGroups(match);

                  return (
                    <div key={`${match.index}-${index}`} className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-200">Match {index + 1}</p>
                          <p className="text-xs text-slate-500">
                            Index {match.index} • Length {match[0]?.length ?? 0}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopy(match[0] || '')}
                          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-glow"
                        >
                          <Copy size={13} />
                          Copy
                        </button>
                      </div>

                      <div className="rounded-lg bg-ocean-900/80 border border-white/10 p-3 font-mono text-sm text-neon-cyan break-words">
                        {match[0]}
                      </div>

                      {groups.numberedGroups && groups.numberedGroups.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Capture Groups</p>
                          <div className="space-y-1">
                            {groups.numberedGroups.map((group, groupIndex) => (
                              <div key={`${index}-${groupIndex}`} className="text-sm text-slate-300 font-mono">
                                <span className="text-slate-500">${groupIndex + 1}:</span> {group ?? 'undefined'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {groups.namedGroups && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Named Groups</p>
                          <pre className="text-xs text-slate-300 bg-ocean-900/70 border border-white/10 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(groups.namedGroups, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : regexState.valid ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-slate-500">
                  No matches yet. Adjust the pattern or paste a different test string.
                </div>
              ) : (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3 text-red-300">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-sm">{regexState.error}</p>
                </div>
              )}
            </div>
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
