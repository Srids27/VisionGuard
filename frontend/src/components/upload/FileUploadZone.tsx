import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileUploadZone({ onFileSelect, isAnalyzing }: FileUploadZoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      setError(null);
      if (rejected.length > 0) {
        const err = rejected[0]?.errors?.[0];
        if (err?.code === 'file-too-large') {
          setError('File too large. Maximum size is 10MB.');
        } else if (err?.code === 'file-invalid-type') {
          setError('Invalid format. Only JPG and PNG accepted.');
        } else {
          setError('Invalid file.');
        }
        return;
      }
      if (accepted.length > 0) {
        onFileSelect(accepted[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: isAnalyzing,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive
            ? 'border-cyber-green bg-cyber-dim shadow-[0_0_20px_rgba(0,255,65,0.2)]'
            : 'border-cyber-gray hover:border-cyber-green hover:shadow-[0_0_10px_rgba(0,255,65,0.1)]'
          }
          ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
          ${error ? 'border-cyber-red' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {/* Upload icon */}
          <svg
            className={`w-16 h-16 transition-colors ${
              isDragActive ? 'text-cyber-green' : 'text-gray-600'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>

          <div>
            <p className="text-sm text-cyber-green tracking-wider">
              {isDragActive
                ? '[ DROP FILE TO ANALYZE ]'
                : '[ DRAG & DROP IMAGE HERE ]'}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              or click to browse -- JPG/PNG, max 10MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-center text-sm text-cyber-red tracking-wider">
          ! {error}
        </p>
      )}
    </div>
  );
}
