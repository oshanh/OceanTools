import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Check,
  Copy,
  Download,
  Frown,
  ImageIcon,
  Loader2,
  Trash2,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import { downloadAsZip, downloadBlob } from '../../utils/pdfjs';
import { generateFaviconAssets } from '../../utils/favicon';

const HTML_SNIPPET = `<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />`;

const MANIFEST_TEMPLATE = {
  name: 'OceanTools App',
  short_name: 'OceanTools',
  icons: [
    {
      src: '/android-chrome-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/android-chrome-512x512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
  theme_color: '#0f172a',
  background_color: '#0f172a',
  display: 'standalone',
};

/**
 * Favicon Generator — create favicon.ico plus modern icon files from one image.
 */
export default function FaviconGenerator() {
  const [file, setFile] = useState(null);
  const [fit, setFit] = useState('cover');
  const [background, setBackground] = useState('transparent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    return () => {
      assets.forEach((asset) => {
        if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
      });
    };
  }, [assets]);

  const reset = useCallback(() => {
    assets.forEach((asset) => {
      if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
    });
    setAssets([]);
    setError(null);
    setCopied(false);
    setFile(null);
  }, [assets]);

  const manifestContent = useMemo(
    () => `${JSON.stringify(MANIFEST_TEMPLATE, null, 2)}\n`,
    [],
  );

  const generateFavicons = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setCopied(false);

    assets.forEach((asset) => {
      if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
    });
    setAssets([]);

    try {
      const faviconAssets = await generateFaviconAssets(file, { fit, background });
      const filesWithPreviews = faviconAssets.map((asset) => ({
        ...asset,
        previewUrl: /\.(png|svg)$/i.test(asset.filename)
          ? URL.createObjectURL(asset.blob)
          : null,
      }));

      setAssets(filesWithPreviews);
    } catch (err) {
      setError(err.message || 'Failed to generate favicons. Please try another image.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    const filesForZip = [
      ...assets.map((asset) => ({ blob: asset.blob, filename: asset.filename })),
      {
        blob: new Blob([manifestContent], { type: 'application/manifest+json' }),
        filename: 'site.webmanifest',
      },
      {
        blob: new Blob([HTML_SNIPPET], { type: 'text/plain;charset=utf-8' }),
        filename: 'favicon-links.html',
      },
    ];

    await downloadAsZip(filesForZip, 'favicon-pack.zip');
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(HTML_SNIPPET);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Clipboard permission is blocked. Copy the snippet manually.');
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          onFiles={(files) => {
            setFile(files[0]);
            setError(null);
          }}
          label="Drop a logo/image here or click to browse"
          hint="Recommended: square image, at least 512x512"
        />
      ) : (
        <div className="glass-panel p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan shrink-0">
              <ImageIcon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-slate-200 font-medium truncate">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-glow shrink-0"
            aria-label="Remove file"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}

      {file && (
        <div className="glass-panel p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Output Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="favicon-fit" className="block text-sm text-slate-400 mb-2">Image Fit</label>
              <select
                id="favicon-fit"
                value={fit}
                onChange={(e) => setFit(e.target.value)}
                className="themed-select w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                           text-slate-200 text-sm focus:outline-none focus:border-neon-cyan/50 transition-glow"
              >
                <option value="cover">Cover (fills canvas)</option>
                <option value="contain">Contain (keeps full image)</option>
              </select>
            </div>

            <div>
              <label htmlFor="favicon-background" className="block text-sm text-slate-400 mb-2">Background</label>
              <select
                id="favicon-background"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="themed-select w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                           text-slate-200 text-sm focus:outline-none focus:border-neon-cyan/50 transition-glow"
              >
                <option value="transparent">Transparent</option>
                <option value="#0f172a">Ocean Dark</option>
                <option value="#ffffff">White</option>
                <option value="#000000">Black</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateFavicons}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                       bg-neon-cyan/20 text-neon-cyan font-medium border border-neon-cyan/30
                       hover:bg-neon-cyan/30 hover:shadow-glow-cyan transition-glow
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating Favicons...
              </>
            ) : (
              <>
                <ImageIcon size={18} />
                Generate Favicon Pack
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="glass-panel p-4 flex items-start gap-3 border border-red-500/30 bg-red-500/5">
          <Frown size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {assets.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-slate-100">
              Generated Files ({assets.length + 2})
            </h2>
            <button
              onClick={handleDownloadAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                         bg-neon-emerald/20 text-neon-emerald font-medium border border-neon-emerald/30
                         hover:bg-neon-emerald/30 hover:shadow-glow-emerald transition-glow text-sm"
            >
              <Archive size={16} />
              Download All (ZIP)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div key={asset.filename} className="glass-panel p-4 space-y-3">
                <div className="h-28 rounded-lg bg-ocean-900 border border-white/10 flex items-center justify-center overflow-hidden">
                  {asset.previewUrl ? (
                    <img
                      src={asset.previewUrl}
                      alt={asset.label}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <p className="text-xs text-slate-500">Preview not available</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-200 truncate">{asset.filename}</p>
                  <p className="text-xs text-slate-500">{asset.label}</p>
                </div>
                <button
                  onClick={() => downloadBlob(asset.blob, asset.filename)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                             bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-glow text-sm"
                >
                  <Download size={15} />
                  Download
                </button>
              </div>
            ))}
          </div>

          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                HTML Snippet
              </h3>
              <button
                onClick={copySnippet}
                className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg
                           border border-white/15 text-slate-300 hover:bg-white/5 transition-glow"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="text-xs sm:text-sm text-slate-300 bg-ocean-900/70 border border-white/10 rounded-lg p-4 overflow-x-auto">
{HTML_SNIPPET}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
