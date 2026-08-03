import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Eraser,
  ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import { downloadBlob } from '../../utils/pdfjs';
import { removeImageBackground } from '../../utils/backgroundRemover';

/**
 * Background Remover — removes edge-connected background colors.
 * Runs entirely in-browser and exports transparent PNG.
 */
export default function BackgroundRemover() {
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [threshold, setThreshold] = useState(58);
  const [feather, setFeather] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (result?.previewUrl) URL.revokeObjectURL(result.previewUrl);
    };
  }, [originalUrl, result]);

  const baseName = useMemo(() => {
    if (!file?.name) return 'image';
    return file.name.replace(/\.[^/.]+$/, '');
  }, [file]);

  const clearResult = () => {
    if (result?.previewUrl) URL.revokeObjectURL(result.previewUrl);
    setResult(null);
  };

  const resetAll = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (result?.previewUrl) URL.revokeObjectURL(result.previewUrl);
    setFile(null);
    setOriginalUrl(null);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const onSelectFile = (files) => {
    const selected = files[0];
    if (!selected) return;

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (result?.previewUrl) URL.revokeObjectURL(result.previewUrl);

    setFile(selected);
    setOriginalUrl(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  const processImage = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    clearResult();

    try {
      const output = await removeImageBackground(file, {
        threshold,
        feather,
      });
      setResult(output);
    } catch (err) {
      setError(err.message || 'Failed to remove background. Try adjusting the settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onFiles={onSelectFile}
          label="Drop an image here or click to browse"
          hint="PNG, JPG, WebP · Best results when background touches image edges"
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
            onClick={resetAll}
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
            Removal Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bg-threshold" className="block text-sm text-slate-400 mb-2">
                Edge Similarity ({threshold})
              </label>
              <input
                id="bg-threshold"
                type="range"
                min="10"
                max="120"
                step="1"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-neon-cyan"
              />
              <p className="text-xs text-slate-500 mt-1">
                Higher values remove a wider range of near-edge colors.
              </p>
            </div>

            <div>
              <label htmlFor="bg-feather" className="block text-sm text-slate-400 mb-2">
                Feather ({feather})
              </label>
              <input
                id="bg-feather"
                type="range"
                min="0"
                max="80"
                step="1"
                value={feather}
                onChange={(e) => setFeather(Number(e.target.value))}
                className="w-full accent-neon-cyan"
              />
              <p className="text-xs text-slate-500 mt-1">
                Smooths hard edges between subject and removed background.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={processImage}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                         bg-neon-cyan/20 text-neon-cyan font-medium border border-neon-cyan/30
                         hover:bg-neon-cyan/30 hover:shadow-glow-cyan transition-glow
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Removing Background...
                </>
              ) : (
                <>
                  <Eraser size={18} />
                  Remove Background
                </>
              )}
            </button>

            {result && (
              <button
                onClick={() => downloadBlob(result.blob, `${baseName}_no_bg.png`)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                           bg-neon-emerald/20 text-neon-emerald font-medium border border-neon-emerald/30
                           hover:bg-neon-emerald/30 hover:shadow-glow-emerald transition-glow"
              >
                <Download size={18} />
                Download PNG
              </button>
            )}

            {result && (
              <button
                onClick={processImage}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg
                           bg-white/5 text-slate-300 font-medium border border-white/10
                           hover:bg-white/10 hover:border-white/20 transition-glow"
              >
                <RefreshCw size={17} />
                Re-run
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="glass-panel p-4 flex items-start gap-3 border border-red-500/30 bg-red-500/5">
          <TriangleAlert size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-panel p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Original
            </h3>
            <div className="rounded-lg border border-white/10 bg-ocean-900 overflow-hidden aspect-square flex items-center justify-center">
              {originalUrl && (
                <img
                  src={originalUrl}
                  alt="Original upload"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>

          <div className="glass-panel p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Output
            </h3>
            <div className="rounded-lg border border-white/10 overflow-hidden aspect-square flex items-center justify-center checkerboard-bg">
              {result ? (
                <img
                  src={result.previewUrl}
                  alt="Background removed output"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center px-6">
                  <Sparkles size={22} className="mx-auto text-slate-500 mb-2" />
                  <p className="text-sm text-slate-500">
                    Run background removal to preview transparent output.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
