import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Eraser,
  ImageIcon,
  Loader2,
  Redo2,
  RefreshCw,
  Sparkles,
  Trash2,
  TriangleAlert,
  Undo2,
  ZoomIn,
} from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import { downloadBlob } from '../../utils/pdfjs';
import { removeImageBackground } from '../../utils/backgroundRemover';

/**
 * Background Remover — removes edge-connected background colors.
 * Runs entirely in-browser and exports transparent PNG.
 */
export default function BackgroundRemover() {
  const MAX_HISTORY_STEPS = 30;

  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [threshold, setThreshold] = useState(58);
  const [feather, setFeather] = useState(24);
  const [brushSize, setBrushSize] = useState(28);
  const [zoom, setZoom] = useState(100);
  const [manualEraseEnabled, setManualEraseEnabled] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [hasManualEdits, setHasManualEdits] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [cursorPreview, setCursorPreview] = useState({
    visible: false,
    x: 0,
    y: 0,
    diameter: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const outputCanvasRef = useRef(null);
  const outputBaseImageRef = useRef(null);
  const lastPointRef = useRef(null);
  const strokeHadMovementRef = useRef(false);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

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
    outputBaseImageRef.current = null;
    setManualEraseEnabled(false);
    setHasManualEdits(false);
    setIsErasing(false);
    setCanUndo(false);
    setCanRedo(false);
    setCursorPreview((prev) => ({ ...prev, visible: false }));
    setZoom(100);
    historyRef.current = [];
    historyIndexRef.current = -1;
  };

  const resetAll = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (result?.previewUrl) URL.revokeObjectURL(result.previewUrl);
    setFile(null);
    setOriginalUrl(null);
    setResult(null);
    outputBaseImageRef.current = null;
    setError(null);
    setManualEraseEnabled(false);
    setHasManualEdits(false);
    setIsErasing(false);
    setCanUndo(false);
    setCanRedo(false);
    setCursorPreview((prev) => ({ ...prev, visible: false }));
    setZoom(100);
    setLoading(false);
    historyRef.current = [];
    historyIndexRef.current = -1;
  };

  const onSelectFile = (files) => {
    const selected = files[0];
    if (!selected) return;

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (result?.previewUrl) URL.revokeObjectURL(result.previewUrl);

    setFile(selected);
    setOriginalUrl(URL.createObjectURL(selected));
    setResult(null);
    outputBaseImageRef.current = null;
    setError(null);
    setManualEraseEnabled(false);
    setHasManualEdits(false);
    setIsErasing(false);
    setCanUndo(false);
    setCanRedo(false);
    setCursorPreview((prev) => ({ ...prev, visible: false }));
    setZoom(100);
    historyRef.current = [];
    historyIndexRef.current = -1;
  };

  const drawBaseOutput = useCallback(() => {
    const canvas = outputCanvasRef.current;
    const image = outputBaseImageRef.current;
    if (!canvas || !image) return;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = 'source-over';
    context.drawImage(image, 0, 0);
  }, []);

  const updateHistoryFlags = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(
      historyIndexRef.current >= 0
      && historyIndexRef.current < historyRef.current.length - 1,
    );
    setHasManualEdits(historyIndexRef.current > 0);
  }, []);

  const snapshotCurrentCanvas = useCallback(() => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }, []);

  const resetHistoryWithCurrent = useCallback(() => {
    const snapshot = snapshotCurrentCanvas();
    if (!snapshot) return;

    historyRef.current = [snapshot];
    historyIndexRef.current = 0;
    updateHistoryFlags();
  }, [snapshotCurrentCanvas, updateHistoryFlags]);

  const pushHistoryState = useCallback(() => {
    const snapshot = snapshotCurrentCanvas();
    if (!snapshot) return;

    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    trimmed.push(snapshot);

    if (trimmed.length > MAX_HISTORY_STEPS) {
      trimmed.shift();
    }

    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
    updateHistoryFlags();
  }, [snapshotCurrentCanvas, updateHistoryFlags]);

  const applySnapshot = useCallback((dataUrl) => {
    const canvas = outputCanvasRef.current;
    if (!canvas || !dataUrl) return Promise.resolve();

    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const context = canvas.getContext('2d');
        if (!context) {
          resolve();
          return;
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.globalCompositeOperation = 'source-over';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve();
      };
      image.src = dataUrl;
    });
  }, []);

  const undoEdit = useCallback(async () => {
    if (historyIndexRef.current <= 0) return;

    historyIndexRef.current -= 1;
    await applySnapshot(historyRef.current[historyIndexRef.current]);
    updateHistoryFlags();
  }, [applySnapshot, updateHistoryFlags]);

  const redoEdit = useCallback(async () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    historyIndexRef.current += 1;
    await applySnapshot(historyRef.current[historyIndexRef.current]);
    updateHistoryFlags();
  }, [applySnapshot, updateHistoryFlags]);

  useEffect(() => {
    if (!result?.previewUrl) return;

    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      outputBaseImageRef.current = image;
      drawBaseOutput();
      resetHistoryWithCurrent();
      setIsErasing(false);
      setCursorPreview((prev) => ({ ...prev, visible: false }));
    };
    image.src = result.previewUrl;

    return () => {
      active = false;
    };
  }, [result, drawBaseOutput, resetHistoryWithCurrent]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey;
      const isRedo = ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y')
        || ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'z');

      if (isUndo) {
        event.preventDefault();
        undoEdit();
      }

      if (isRedo) {
        event.preventDefault();
        redoEdit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [undoEdit, redoEdit]);

  const getPointerData = (event) => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const canvasX = (localX / rect.width) * canvas.width;
    const canvasY = (localY / rect.height) * canvas.height;

    const previewDiameter = Math.max(8, (brushSize / canvas.width) * rect.width);

    return {
      localX,
      localY,
      canvasX,
      canvasY,
      previewDiameter,
    };
  };

  const updateCursorBoundary = (event) => {
    if (!manualEraseEnabled || !result) {
      setCursorPreview((prev) => ({ ...prev, visible: false }));
      return;
    }

    const pointer = getPointerData(event);
    if (!pointer) return;

    setCursorPreview({
      visible: true,
      x: pointer.localX,
      y: pointer.localY,
      diameter: pointer.previewDiameter,
    });
  };

  const beginErase = (event) => {
    if (!manualEraseEnabled || !result) return;

    const canvas = outputCanvasRef.current;
    const context = canvas?.getContext('2d');
    const pointer = getPointerData(event);
    if (!canvas || !context || !pointer) return;

    event.preventDefault();

    updateCursorBoundary(event);

    context.save();
    context.globalCompositeOperation = 'destination-out';
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.lineWidth = brushSize;
    context.beginPath();
    context.moveTo(pointer.canvasX, pointer.canvasY);
    context.lineTo(pointer.canvasX, pointer.canvasY);
    context.stroke();
    context.restore();

    lastPointRef.current = { x: pointer.canvasX, y: pointer.canvasY };
    strokeHadMovementRef.current = true;
    setIsErasing(true);
    setHasManualEdits(true);
    canvas.setPointerCapture(event.pointerId);
  };

  const moveErase = (event) => {
    updateCursorBoundary(event);

    if (!isErasing || !manualEraseEnabled) return;

    const canvas = outputCanvasRef.current;
    const context = canvas?.getContext('2d');
    const pointer = getPointerData(event);
    if (!canvas || !context || !pointer || !lastPointRef.current) return;

    event.preventDefault();

    context.save();
    context.globalCompositeOperation = 'destination-out';
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.lineWidth = brushSize;
    context.beginPath();
    context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    context.lineTo(pointer.canvasX, pointer.canvasY);
    context.stroke();
    context.restore();

    lastPointRef.current = { x: pointer.canvasX, y: pointer.canvasY };
    strokeHadMovementRef.current = true;
  };

  const endErase = (event) => {
    const canvas = outputCanvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (strokeHadMovementRef.current) {
      pushHistoryState();
      strokeHadMovementRef.current = false;
    }

    lastPointRef.current = null;
    setIsErasing(false);
  };

  const handleDownloadOutput = async () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) {
      if (result?.blob) {
        downloadBlob(result.blob, `${baseName}_no_bg.png`);
      }
      return;
    }

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((outputBlob) => {
        if (!outputBlob) {
          reject(new Error('Failed to export edited image.'));
          return;
        }
        resolve(outputBlob);
      }, 'image/png');
    });

    downloadBlob(blob, `${baseName}_no_bg.png`);
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
                onClick={handleDownloadOutput}
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

            {result && (
              <button
                onClick={undoEdit}
                disabled={!canUndo || loading}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg
                           bg-white/5 text-slate-300 font-medium border border-white/10
                           hover:bg-white/10 hover:border-white/20 transition-glow
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo2 size={17} />
                Undo
              </button>
            )}

            {result && (
              <button
                onClick={redoEdit}
                disabled={!canRedo || loading}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg
                           bg-white/5 text-slate-300 font-medium border border-white/10
                           hover:bg-white/10 hover:border-white/20 transition-glow
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Redo2 size={17} />
                Redo
              </button>
            )}

            {result && (
              <button
                onClick={() => setManualEraseEnabled((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg font-medium border transition-glow
                           ${manualEraseEnabled
                             ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30 shadow-glow-cyan'
                             : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'}
                           `}
              >
                <Eraser size={17} />
                {manualEraseEnabled ? 'Eraser On' : 'Manual Eraser'}
              </button>
            )}

            {result && hasManualEdits && (
              <button
                onClick={() => {
                  drawBaseOutput();
                  resetHistoryWithCurrent();
                }}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg
                           bg-white/5 text-slate-300 font-medium border border-white/10
                           hover:bg-white/10 hover:border-white/20 transition-glow"
              >
                <RefreshCw size={17} />
                Reset Edits
              </button>
            )}
          </div>

          {result && manualEraseEnabled && (
            <div className="pt-2 border-t border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="eraser-size" className="block text-sm text-slate-400 mb-2">
                    Eraser Size ({brushSize}px)
                  </label>
                  <input
                    id="eraser-size"
                    type="range"
                    min="8"
                    max="120"
                    step="1"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-neon-cyan"
                  />
                </div>

                <div>
                  <label htmlFor="eraser-zoom" className="block text-sm text-slate-400 mb-2">
                    Zoom
                  </label>
                  <div className="flex items-center gap-2">
                    <ZoomIn size={16} className="text-slate-400 shrink-0" />
                    <select
                      id="eraser-zoom"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="themed-select w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                                 text-slate-200 text-sm focus:outline-none focus:border-neon-cyan/50 transition-glow"
                    >
                      <option value={50}>50%</option>
                      <option value={75}>75%</option>
                      <option value={100}>100%</option>
                      <option value={125}>125%</option>
                      <option value={150}>150%</option>
                      <option value={200}>200%</option>
                    </select>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Drag on the output image to erase any remaining background.
              </p>
            </div>
          )}
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
            <div className="rounded-lg border border-white/10 overflow-auto aspect-square checkerboard-bg p-2">
              {result ? (
                <div className="relative mx-auto" style={{ width: `${zoom}%` }}>
                  <canvas
                    ref={outputCanvasRef}
                    onPointerDown={beginErase}
                    onPointerMove={moveErase}
                    onPointerUp={endErase}
                    onPointerCancel={endErase}
                    onPointerEnter={updateCursorBoundary}
                    onPointerLeave={() => {
                      setCursorPreview((prev) => ({ ...prev, visible: false }));
                    }}
                    className={`w-full h-auto ${manualEraseEnabled ? 'cursor-none touch-none' : ''}`}
                    aria-label="Background removed output preview"
                  />

                  {manualEraseEnabled && cursorPreview.visible && (
                    <div
                      className="absolute pointer-events-none border border-neon-cyan/80 rounded-full shadow-glow-cyan"
                      style={{
                        left: `${cursorPreview.x}px`,
                        top: `${cursorPreview.y}px`,
                        width: `${cursorPreview.diameter}px`,
                        height: `${cursorPreview.diameter}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  )}
                </div>
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
