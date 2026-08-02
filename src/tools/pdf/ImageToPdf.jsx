import { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  FilePlus,
  GripVertical,
  AlertCircle,
  X,
  Images,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import { convertImagesToPdf } from '../../utils/imageToPdf';
import { downloadBlob } from '../../utils/pdfjs';

/**
 * Image to PDF — combines one or more images into a single PDF document.
 * All processing happens client-side; files never leave the browser.
 */
export default function ImageToPdf() {
  const [images, setImages] = useState([]);
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);

  // Revoke preview URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  const addImages = useCallback((files) => {
    const newImages = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
    }));
    setImages((prev) => [...prev, ...newImages]);
    setError(null);
  }, []);

  const removeImage = useCallback((id) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setError(null);
  }, [images]);

  // Simple drag-to-reorder
  const handleDragStart = (index) => setDragIndex(index);

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    setImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDragIndex(index);
  };

  const handleGenerate = async () => {
    if (!images.length) return;

    setLoading(true);
    setError(null);

    try {
      const blob = await convertImagesToPdf(
        images.map((img) => img.file),
        { pageSize, orientation, margin },
      );
      downloadBlob(blob, 'document.pdf');
    } catch (err) {
      setError(err.message || 'Failed to generate PDF. Please check your image files.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload zone — always visible to add more images */}
      <FileDropzone
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        multiple
        onFiles={addImages}
        label="Drop images here or click to browse"
        hint="PNG, JPG, WebP, GIF · Add multiple images for multi-page PDFs"
      />

      {/* Image list */}
      {images.length > 0 && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              {images.length} image{images.length !== 1 ? 's' : ''} added
            </h2>
            <button
              onClick={clearAll}
              className="text-xs text-slate-500 hover:text-red-400 transition-glow"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2">
            {images.map((img, index) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={() => setDragIndex(null)}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10
                           hover:border-neon-cyan/20 transition-glow cursor-grab active:cursor-grabbing"
              >
                <GripVertical size={16} className="text-slate-600 shrink-0" />
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  className="w-12 h-12 object-cover rounded-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{img.name}</p>
                  <p className="text-xs text-slate-500">Page {index + 1}</p>
                </div>
                <button
                  onClick={() => removeImage(img.id)}
                  className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-glow shrink-0"
                  aria-label={`Remove ${img.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF settings */}
      {images.length > 0 && (
        <div className="glass-panel p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            PDF Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Page Size</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                           text-slate-200 text-sm focus:outline-none focus:border-neon-cyan/50 transition-glow"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Orientation</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                           text-slate-200 text-sm focus:outline-none focus:border-neon-cyan/50 transition-glow"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Margin ({margin} mm)
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full accent-neon-cyan"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                       bg-neon-emerald/20 text-neon-emerald font-medium border border-neon-emerald/30
                       hover:bg-neon-emerald/30 hover:shadow-glow-emerald transition-glow
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating PDF…
              </>
            ) : (
              <>
                <FilePlus size={18} />
                Generate & Download PDF
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

      {/* Empty state hint */}
      {images.length === 0 && (
        <div className="glass-panel p-6 text-center">
          <Images size={24} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm text-slate-500">
            Upload one or more images above. Drag to reorder pages before generating.
          </p>
        </div>
      )}
    </div>
  );
}
