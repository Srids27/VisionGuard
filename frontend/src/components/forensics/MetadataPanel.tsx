import type { MetadataResult } from '../../types/forensics';

const SUSPICIOUS = ['photoshop', 'gimp', 'canva', 'affinity', 'pixlr', 'paint.net'];

interface MetadataPanelProps {
  metadata: MetadataResult;
}

export default function MetadataPanel({ metadata }: MetadataPanelProps) {
  const isSuspicious = metadata.software
    ? SUSPICIOUS.some((s) => metadata.software!.toLowerCase().includes(s))
    : false;

  const rows: [string, string | null, boolean][] = [
    ['Status', metadata.metadata_status, metadata.metadata_status !== 'Present'],
    ['EXIF Present', metadata.has_exif ? 'YES' : 'NO', !metadata.has_exif],
    ['Camera Make', metadata.camera_make, false],
    ['Camera Model', metadata.camera_model, false],
    ['Software', metadata.software, isSuspicious],
    ['Date Taken', metadata.date_taken, false],
    [
      'GPS',
      metadata.gps ? `${metadata.gps.lat}, ${metadata.gps.lon}` : null,
      false,
    ],
  ];

  return (
    <div className="border border-cyber-gray rounded-lg bg-cyber-charcoal p-4 h-full">
      <h3 className="text-sm font-bold tracking-widest text-cyber-green glow-text mb-4">
        [ METADATA ANALYSIS ]
      </h3>
      <div className="text-xs text-cyber-gray mb-3">{'='.repeat(36)}</div>

      <div className="space-y-2">
        {rows.map(([label, value, warn]) => (
          <div
            key={label}
            className="flex justify-between items-center py-1.5 border-b border-cyber-gray/30 last:border-0"
          >
            <span className="text-xs text-gray-500 tracking-wider">{label}</span>
            <span
              className={`text-xs text-right max-w-[55%] truncate ${
                warn ? 'text-cyber-red font-bold' : 'text-cyber-green'
              }`}
            >
              {value ?? '--'}
            </span>
          </div>
        ))}
      </div>

      {metadata.warnings.length > 0 && (
        <div className="mt-4 space-y-1">
          {metadata.warnings.map((w, i) => (
            <p key={i} className="text-xs text-cyber-red tracking-wider">
              ! {w}
            </p>
          ))}
        </div>
      )}

      {Object.keys(metadata.all_tags).length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-cyber-green tracking-wider">
            [+] RAW EXIF TAGS ({Object.keys(metadata.all_tags).length})
          </summary>
          <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
            {Object.entries(metadata.all_tags).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-[10px]">
                <span className="text-gray-600 min-w-[120px]">{k}:</span>
                <span className="text-gray-400 truncate">{v}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
