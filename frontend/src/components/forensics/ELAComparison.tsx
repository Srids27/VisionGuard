interface ELAComparisonProps {
  originalImageBase64: string;
  elaHeatmapBase64: string;
  meanDiff: number;
  maxDiff: number;
}

export default function ELAComparison({
  originalImageBase64,
  elaHeatmapBase64,
  meanDiff,
  maxDiff,
}: ELAComparisonProps) {
  return (
    <div className="border border-cyber-gray rounded-lg bg-cyber-charcoal p-4">
      <h3 className="text-sm font-bold tracking-widest text-cyber-green glow-text mb-4">
        [ ERROR LEVEL ANALYSIS ]
      </h3>
      <div className="text-xs text-cyber-gray mb-3">{'='.repeat(36)}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <div>
          <p className="text-xs text-gray-500 tracking-wider mb-2">ORIGINAL</p>
          <div className="border border-cyber-gray rounded overflow-hidden hover:border-cyber-green hover:shadow-[0_0_10px_rgba(0,255,65,0.15)] transition-all">
            <img
              src={originalImageBase64}
              alt="Original"
              className="w-full h-auto object-contain max-h-80"
            />
          </div>
        </div>

        {/* ELA Heatmap */}
        <div>
          <p className="text-xs text-gray-500 tracking-wider mb-2">ELA HEATMAP</p>
          <div className="border border-cyber-gray rounded overflow-hidden hover:border-cyber-cyan hover:shadow-[0_0_10px_rgba(0,240,255,0.15)] transition-all">
            <img
              src={elaHeatmapBase64}
              alt="ELA Heatmap"
              className="w-full h-auto object-contain max-h-80"
            />
          </div>
        </div>
      </div>

      {/* ELA Stats */}
      <div className="mt-4 flex gap-6 text-xs">
        <div>
          <span className="text-gray-500">Mean Diff: </span>
          <span className={meanDiff > 15 ? 'text-cyber-yellow' : 'text-cyber-green'}>
            {meanDiff.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Max Diff (P99): </span>
          <span className={maxDiff > 35 ? 'text-cyber-red' : 'text-cyber-green'}>
            {maxDiff.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
