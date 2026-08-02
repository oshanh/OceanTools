import { useCallback, useRef, useState } from 'react';
import { Upload, FileIcon } from 'lucide-react';

/**
 * Drag-and-drop file upload zone with click-to-browse fallback.
 */
export default function FileDropzone({
  accept,
  multiple = false,
  onFiles,
  label = 'Drop files here or click to browse',
  hint,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (fileList) => {
      if (!fileList?.length) return;
      const files = multiple ? Array.from(fileList) : [fileList[0]];
      onFiles(files);
    },
    [multiple, onFiles],
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        glass-panel p-10 text-center cursor-pointer transition-glow
        border-2 border-dashed
        ${isDragging
          ? 'border-neon-cyan/60 bg-neon-cyan/5 shadow-glow-cyan'
          : 'border-white/10 hover:border-neon-cyan/30 hover:bg-white/[0.02]'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="flex flex-col items-center gap-3">
        <div className="p-4 rounded-full bg-neon-cyan/10 text-neon-cyan">
          {isDragging ? <FileIcon size={32} /> : <Upload size={32} />}
        </div>
        <p className="text-slate-200 font-medium">{label}</p>
        {hint && <p className="text-sm text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
