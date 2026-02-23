import { useEffect, useState } from 'react';
import type { ScanSummary } from '../../types/forensics';
import { getScanHistory } from '../../services/historyService';

function getVerdictStyle(verdict: string) {
  const v = verdict.toLowerCase();
  if (v.includes('synthetic') || v.includes('inconclusive')) return 'text-cyber-yellow border-cyber-yellow';
  if (v.includes('authentic')) return 'text-cyber-green border-cyber-green';
  if (v.includes('suspicious')) return 'text-cyber-yellow border-cyber-yellow';
  return 'text-cyber-red border-cyber-red';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function ScanHistoryTable() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    setError(null);
    getScanHistory(limit, page * limit)
      .then((res) => {
        setScans(res.scans);
        setTotal(res.total);
      })
      .catch((e) => setError(e?.message || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-6 h-6 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 mt-3 tracking-wider">LOADING SCAN HISTORY...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-cyber-red tracking-wider">! ERROR: {error}</p>
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-cyber-gray rounded-lg">
        <p className="text-sm text-gray-500 tracking-wider">
          [ NO SCANS YET -- UPLOAD AN IMAGE TO BEGIN ]
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-cyber-gray">
              <th className="text-left py-3 px-3 text-gray-500 tracking-wider">FILE</th>
              <th className="text-left py-3 px-3 text-gray-500 tracking-wider">VERDICT</th>
              <th className="text-left py-3 px-3 text-gray-500 tracking-wider">SCORE</th>
              <th className="text-left py-3 px-3 text-gray-500 tracking-wider">SOFTWARE</th>
              <th className="text-left py-3 px-3 text-gray-500 tracking-wider">AI</th>
              <th className="text-left py-3 px-3 text-gray-500 tracking-wider">DATE</th>
              <th className="text-left py-3 px-3 text-gray-500 tracking-wider">HASH</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan, i) => (
              <tr
                key={scan.scan_id}
                className={`border-b border-cyber-gray/30 hover:bg-cyber-green/5 hover:border-l-2 hover:border-l-cyber-green transition-colors ${
                  i % 2 === 0 ? 'bg-cyber-black/50' : ''
                }`}
              >
                <td className="py-3 px-3 text-cyber-green truncate max-w-[150px]">
                  {scan.image_name}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 border rounded text-[10px] tracking-wider ${getVerdictStyle(
                      scan.verdict
                    )}`}
                  >
                    {scan.verdict.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-400">{scan.manipulation_score.toFixed(1)}</td>
                <td className="py-3 px-3 text-gray-500 truncate max-w-[120px]">
                  {scan.software_detected || '--'}
                </td>
                <td className="py-3 px-3 text-gray-400">
                  {scan.ai_score != null ? `${(scan.ai_score * 100).toFixed(0)}%` : '--'}
                </td>
                <td className="py-3 px-3 text-gray-500">{formatDate(scan.timestamp)}</td>
                <td className="py-3 px-3 text-cyber-cyan text-[10px] truncate max-w-[100px]">
                  {scan.sha256_hash.substring(0, 12)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-xs border border-cyber-gray text-gray-500 hover:text-cyber-green hover:border-cyber-green disabled:opacity-30 tracking-wider transition-colors"
          >
            {'<'} PREV
          </button>
          <span className="text-xs text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 text-xs border border-cyber-gray text-gray-500 hover:text-cyber-green hover:border-cyber-green disabled:opacity-30 tracking-wider transition-colors"
          >
            NEXT {'>'}
          </button>
        </div>
      )}
    </div>
  );
}
