import { useCallback, useEffect, useState } from 'react';
import {
  Download,
  Loader2,
  ImageDown,
  Archive,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import {
  convertPdfToImages,
  downloadBlob,
  downloadAsZip,
} from '../../utils/pdfjs';

/**
 * PDF to Image — converts each PDF page to PNG or JPEG.
 * All processing happens client-side; files never leave the browser.
 */
export default function PdfToImage() {
  const [pdfFile, setPdfFile] = useState(null);
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(2);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Revoke object URLs on unmount or reset
  useEffect(() => {
    return () => {
      pages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [pages]);

  const reset = useCallback(() => {
    pages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPages([]);
    setPdfFile(null);
    setError(null);
  }, [pages]);

  const handleConvert = async () => {
    if (!pdfFile) return;

    setLoading(true);
    setError(null);
    pages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPages([]);

    try {
      const results = await convertPdfToImages(pdfFile, { format, quality, scale });
      setPages(results);
    } catch (err) {
      setError(err.message || 'Failed to convert PDF. The file may be corrupted or password-protected.');
    } finally {
      setLoading(false);
    }
  };

  const baseName = pdfFile?.name.replace(/\.pdf$/i, '') ?? 'document';
  const ext = format === 'jpeg' ? 'jpg' : 'png';

  const handleDownloadAll = async () => {
    const files = pages.map((p) => ({
      blob: p.blob,
      filename: `${baseName}_page_${p.pageNumber}.${ext}`,
    }));
    await downloadAsZip(files, `${baseName}_pages.zip`);
  };

  return (
    <div className="space-y-6">
      {/* Upload */}
      {!pdfFile ? (
        <FileDropzone
          accept=".pdf,application/pdf"
          onFiles={(files) => setPdfFile(files[0])}
          label="Drop a PDF file here or click to browse"
          hint="Supports standard PDF files · Processed locally in your browser"
        />
      ) : (
        <div className="glass-panel p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan shrink-0">
              <ImageDown size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-slate-200 font-medium truncate">{pdfFile.name}</p>
              <p className="text-xs text-slate-500">
                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
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

      {/* Options */}
      {pdfFile && (
        <div className="glass-panel p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Conversion Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Format */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="themed-select w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                           text-slate-200 text-sm focus:outline-none focus:border-neon-cyan/50 transition-glow"
              >
                <option value="png">PNG (lossless)</option>
                <option value="jpeg">JPEG (smaller)</option>
              </select>
            </div>

            {/* Quality — only for JPEG */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Quality {format === 'jpeg' ? `(${Math.round(quality * 100)}%)` : ''}
              </label>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={quality}
                disabled={format !== 'jpeg'}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-neon-cyan disabled:opacity-40"
              />
            </div>

            {/* Scale / resolution */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Resolution ({scale}x)
              </label>
              <select
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="themed-select w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                           text-slate-200 text-sm focus:outline-none focus:border-neon-cyan/50 transition-glow"
              >
                <option value={1}>1x — Standard</option>
                <option value={2}>2x — High (recommended)</option>
                <option value={3}>3x — Very High</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleConvert}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                       bg-neon-cyan/20 text-neon-cyan font-medium border border-neon-cyan/30
                       hover:bg-neon-cyan/30 hover:shadow-glow-cyan transition-glow
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Converting…
              </>
            ) : (
              <>
                <ImageDown size={18} />
                Convert to {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-panel p-4 flex items-start gap-3 border border-red-500/30 bg-red-500/5">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Results */}
      {pages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-slate-100">
              {pages.length} page{pages.length !== 1 ? 's' : ''} converted
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {pages.map((page) => (
              <div key={page.pageNumber} className="glass-panel overflow-hidden group">
                <div className="aspect-[3/4] bg-ocean-900 overflow-hidden">
                  <img
                    src={page.previewUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Page {page.pageNumber}</span>
                  <button
                    onClick={() =>
                      downloadBlob(
                        page.blob,
                        `${baseName}_page_${page.pageNumber}.${ext}`,
                      )
                    }
                    className="p-1.5 rounded-md text-slate-400 hover:text-neon-cyan
                               hover:bg-neon-cyan/10 transition-glow"
                    aria-label={`Download page ${page.pageNumber}`}
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
