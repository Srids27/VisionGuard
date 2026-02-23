/* visionguard/frontend/src/components/forensics/IntegrityCertificate.tsx */


interface IntegrityCertificateProps {
  fileHash: string;
  verdict: string;
  manipulationScore: number;
  timestamp: string;
  imageName: string;
  hasExif: boolean;
  metadataStatus: string; // The flag from your updated backend logic
}

/**
 * Helper to determine the visual theme based on forensic results.
 * Prioritizes metadata skepticism as requested for the final update.
 */
function getVerdictStyle(verdict: string, metadataStatus: string) {
  const v = verdict.toLowerCase();
  const m = (metadataStatus || "").toLowerCase();

  // If metadata is stripped/missing, we force a yellow "Inconclusive" state
  if (m.includes('inconclusive') || m.includes('stripped')) {
    return { 
      color: 'text-cyber-yellow', 
      border: 'border-cyber-yellow', 
      bg: 'bg-cyber-yellow/10',
      label: 'INCONCLUSIVE' 
    };
  }
  
  // High risk or AI-detected artifacts
  if (v.includes('synthetic') || v.includes('tampered') || v.includes('suspicious')) {
    return { 
      color: 'text-cyber-red', 
      border: 'border-cyber-red', 
      bg: 'bg-cyber-red/10',
      label: 'TAMPERED' 
    };
  }
  
  // Passed all checks
  return { 
    color: 'text-cyber-green', 
    border: 'border-cyber-green', 
    bg: 'bg-cyber-green/5',
    label: 'AUTHENTIC' 
  };
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export default function IntegrityCertificate({
  fileHash,
  verdict,
  manipulationScore,
  timestamp,
  imageName,
  hasExif,
  metadataStatus,
}: IntegrityCertificateProps) {
  const style = getVerdictStyle(verdict, metadataStatus);
  
  // The border of the entire card matches the verdict severity
  const borderColor = style.border;

  return (
    <div className={`border-2 ${borderColor} rounded-lg bg-cyber-charcoal p-5 relative animate-glow-pulse shadow-lg`}>
      {/* Aesthetic corner decorations for the Y2K/Cyberpunk feel */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${borderColor} -translate-x-px -translate-y-px`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${borderColor} translate-x-px -translate-y-px`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${borderColor} -translate-x-px translate-y-px`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${borderColor} translate-x-px translate-y-px`} />

      <h3 className={`text-sm font-bold tracking-[0.2em] ${style.color} glow-text mb-4 text-center`}>
        [ {style.label} REPORT ]
      </h3>

      <div className="space-y-4">
        {/* File Metadata Section */}
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <span className="text-[10px] text-gray-500 tracking-widest uppercase">Target File</span>
          <span className={`text-xs ${style.color} truncate max-w-[60%] font-mono`}>{imageName}</span>
        </div>

        {/* SHA-256 Hash Display */}
        <div>
          <span className="text-[10px] text-gray-500 tracking-widest uppercase">Digital Fingerprint (SHA-256)</span>
          <p className="text-[10px] text-cyber-cyan mt-1 break-all select-all font-mono leading-tight bg-black/30 p-2 rounded">
            {fileHash}
          </p>
        </div>

        {/* Dynamic Verdict Display */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 tracking-widest uppercase">Forensic Verdict</span>
          <span className={`text-xs font-bold tracking-widest px-4 py-1 border-2 rounded ${style.color} ${style.border} ${style.bg}`}>
            {style.label}
          </span>
        </div>

        {/* Risk Score Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 tracking-widest uppercase">Manipulation Risk</span>
            <span className={`text-xs font-bold ${style.color}`}>{manipulationScore.toFixed(1)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{
                width: `${manipulationScore}%`,
                backgroundColor: 
                  manipulationScore < 30 ? 'var(--color-cyber-green)' : 
                  manipulationScore < 60 ? 'var(--color-cyber-yellow)' : 'var(--color-cyber-red)'
              }}
            />
          </div>
        </div>

        {/* Critical Warning for Missing Metadata */}
        {(style.label === 'INCONCLUSIVE' || !hasExif) && (
          <div className="border border-cyber-yellow/40 rounded p-3 bg-cyber-yellow/5 mt-2">
            <p className="text-[10px] text-cyber-yellow tracking-wider leading-relaxed">
              <span className="font-bold">⚠️ SIGNAL ALERT:</span> {metadataStatus || "Metadata provenance unavailable."} 
              The absence of camera EXIF structures suggests the file was processed via 
              digital intermediaries or synthetic generators.
            </p>
          </div>
        )}

        {/* Timestamp Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <span className="text-[9px] text-gray-600 tracking-widest uppercase">Analysis Epoch</span>
          <span className="text-[9px] text-gray-400 font-mono">{formatTimestamp(timestamp)}</span>
        </div>
      </div>
    </div>
  );
}