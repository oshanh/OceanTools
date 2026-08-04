import { useState, useRef } from 'react';
import { Scan, Download, Trash2, Contrast, Image as ImageIcon, Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import FileDropzone from '../../components/tools/FileDropzone';

const FILTERS = [
    { id: 'magic', name: 'Magic Scan', css: 'contrast(1.5) brightness(1.15) saturate(1.8)' },
    { id: 'bw', name: 'B & W', css: 'grayscale(100%) contrast(2.5) brightness(1.1)' },
    { id: 'gray', name: 'Grayscale', css: 'grayscale(100%) contrast(1.2)' },
    { id: 'original', name: 'Original', css: 'none' }
];

export default function DocumentScanner() {
    const [pages, setPages] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('magic');
    const [isExporting, setIsExporting] = useState(false);
    const canvasRef = useRef(null);

    const handleFiles = (files) => {
        if (!files || files.length === 0) return;
        const newPages = Array.from(files).map((f) => ({
            id: Math.random().toString(36).substring(7),
            file: f,
            url: URL.createObjectURL(f),
            filter: globalFilter
        }));
        setPages(prev => [...prev, ...newPages]);
    };

    const removePage = (id) => {
        setPages(prev => prev.filter(p => p.id !== id));
    };

    const updatePageFilter = (id, filterId) => {
        setPages(prev => prev.map(p => p.id === id ? { ...p, filter: filterId } : p));
    };

    const applyGlobalFilter = (filterId) => {
        setGlobalFilter(filterId);
        setPages(prev => prev.map(p => ({ ...p, filter: filterId })));
    };

    const generatePdf = async () => {
        if (pages.length === 0) return;
        setIsExporting(true);

        try {
            const doc = new jsPDF({
                unit: 'px',
                format: 'a4',
                orientation: 'portrait'
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const filterCss = FILTERS.find(f => f.id === page.filter)?.css || 'none';

                // Load image securely asynchronously
                const img = await new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = reject;
                    image.src = page.url;
                });

                // Standard A4 aspect ratio resolution scaling limit (roughly ~2480x3508 at 300dpi)
                // Downscale if massive to save memory
                const MAX_WIDTH = 2000;
                let drawWidth = img.width;
                let drawHeight = img.height;
                if (drawWidth > MAX_WIDTH) {
                    const ratio = MAX_WIDTH / drawWidth;
                    drawWidth = MAX_WIDTH;
                    drawHeight = img.height * ratio;
                }

                canvas.width = drawWidth;
                canvas.height = drawHeight;

                // Apply Browser Canvas Filters (Hardware accelerated)
                ctx.filter = filterCss;
                ctx.drawImage(img, 0, 0, drawWidth, drawHeight);

                // Convert to compressed Blob URL payload
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = doc.internal.pageSize.getHeight();

                // Calculate scale to fit page natively
                const imgRatio = drawWidth / drawHeight;
                const pdfRatio = pdfWidth / pdfHeight;

                let finalW = pdfWidth;
                let finalH = pdfHeight;
                let x = 0;
                let y = 0;

                if (imgRatio > pdfRatio) {
                    finalW = pdfWidth;
                    finalH = pdfWidth / imgRatio;
                    y = (pdfHeight - finalH) / 2; // Centers it vertically
                } else {
                    finalH = pdfHeight;
                    finalW = pdfHeight * imgRatio;
                    x = (pdfWidth - finalW) / 2; // Centers it horizontally
                }

                if (i > 0) doc.addPage();
                doc.addImage(dataUrl, 'JPEG', x, y, finalW, finalH);
            }

            doc.save('Scanned_Document.pdf');

        } catch (err) {
            console.error(err);
            alert('Failed to generate PDF document.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8">

            {/* Header Settings */}
            <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10">
                <div className="flex items-center gap-2">
                    <Scan size={24} className="text-neon-cyan" />
                    <div>
                        <h2 className="font-bold text-slate-200">Document Scanner</h2>
                        <p className="text-xs text-slate-400">Apply powerful camera enhancement filters</p>
                    </div>
                </div>

                {pages.length > 0 && (
                    <div className="flex items-center gap-4 bg-ocean-950 px-4 py-2 rounded-lg border border-white/5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Global Filter:</span>
                        <div className="flex gap-2">
                            {FILTERS.map(f => (
                                <button
                                    key={`global-${f.id}`}
                                    onClick={() => applyGlobalFilter(f.id)}
                                    className={`p-1.5 rounded-md transition-colors ${globalFilter === f.id ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'text-slate-400 hover:bg-white/5 border border-transparent'}`}
                                    title={f.name}
                                >
                                    {f.id === 'magic' && <Sparkles size={16} />}
                                    {f.id === 'bw' && <Contrast size={16} />}
                                    {f.id === 'gray' && <ImageIcon size={16} />}
                                    {f.id === 'original' && <Scan size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {pages.length === 0 ? (
                <FileDropzone
                    accept="image/*"
                    multiple={true}
                    onFiles={handleFiles}
                    label="Drag & Drop Camera Photos Here"
                    hint="Supports mass uploads. Images are natively filtered inside your browser (100% Privacy)."
                />
            ) : (
                <div className="space-y-6">
                    {/* Filter Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {pages.map((page, index) => (
                            <div key={page.id} className="glass-panel border-white/10 overflow-hidden flex flex-col group relative">
                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-slate-300 pointer-events-none z-10 border border-white/10">
                                    Page {index + 1}
                                </div>
                                <button
                                    onClick={() => removePage(page.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors z-10 opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>

                                <div className="h-48 w-full bg-ocean-950 flex items-center justify-center p-2 checkerboard-bg relative overflow-hidden">
                                    <img
                                        src={page.url}
                                        alt={`Scan ${index + 1}`}
                                        className="max-h-full max-w-full object-contain rounded"
                                        style={{ filter: FILTERS.find(f => f.id === page.filter)?.css || 'none' }}
                                    />
                                </div>

                                <div className="p-3 bg-ocean-900 border-t border-white/5 flex gap-1 justify-between">
                                    {FILTERS.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => updatePageFilter(page.id, f.id)}
                                            className={`text-[10px] font-bold uppercase tracking-wider py-1.5 px-1.5 rounded flex-1 transition-all ${page.filter === f.id
                                                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 shadow-glow-cyan'
                                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                                                }`}
                                        >
                                            {f.name.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="glass-panel border-dashed border-2 border-slate-600/50 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all flex flex-col items-center justify-center h-full min-h-[200px] cursor-pointer group">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                onChange={(e) => handleFiles(e.target.files)}
                            />
                            <Scan size={32} className="text-slate-500 group-hover:text-neon-cyan transition-colors mb-2" />
                            <span className="text-sm font-semibold text-slate-400 group-hover:text-neon-cyan transition-colors">Add more pages</span>
                        </div>
                    </div>

                    <div className="flex justify-end mt-8 border-t border-white/5 pt-6">
                        <button
                            onClick={generatePdf}
                            disabled={isExporting}
                            className="bg-neon-emerald/10 border border-neon-emerald/30 text-neon-emerald px-8 py-4 rounded-xl flex items-center justify-center gap-3 font-bold hover:bg-neon-emerald/20 transition-all shadow-glow-emerald disabled:opacity-50 min-w-[250px]"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-neon-emerald border-t-transparent rounded-full animate-spin" />
                                    Processing Document...
                                </>
                            ) : (
                                <>
                                    <Download size={20} />
                                    Export as High-Res PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
