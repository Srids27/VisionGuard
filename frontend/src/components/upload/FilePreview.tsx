interface FilePreviewProps {
  file: File;
  previewUrl: string;
  onAnalyze: () => void;
  onClear: () => void;
  isAnalyzing: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePreview({
  file,
  previewUrl,
  onAnalyze,
  onClear,
  isAnalyzing,
}: FilePreviewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-6 border border-cyber-gray rounded-lg p-4 bg-cyber-charcoal animate-fade-in-up">
      <div className="flex items-center gap-4">
        <img
          src={previewUrl}
          alt="Preview"
          className="w-20 h-20 object-cover rounded border border-cyber-gray"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-cyber-green truncate">{file.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatSize(file.size)} -- {file.type}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClear}
            disabled={isAnalyzing}
            className="px-3 py-2 text-xs border border-cyber-gray text-gray-500 hover:text-cyber-red hover:border-cyber-red transition-colors disabled:opacity-50 tracking-wider"
          >
            CLEAR
          </button>
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="px-4 py-2 text-xs border-2 border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-cyber-black transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] disabled:opacity-50 tracking-wider font-bold"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />
                SCANNING...
              </span>
            ) : (
              'ANALYZE'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
