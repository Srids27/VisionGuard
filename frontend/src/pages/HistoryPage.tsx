import ScanHistoryTable from '../components/history/ScanHistoryTable';

export default function HistoryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-lg font-bold tracking-widest text-cyber-green glow-text">
          [ SCAN HISTORY ]
        </h2>
        <p className="text-xs text-gray-500 mt-2 tracking-wider">
          Previous forensic analyses ordered by most recent.
        </p>
        <div className="text-xs text-cyber-gray mt-2">{'='.repeat(50)}</div>
      </div>

      <ScanHistoryTable />
    </div>
  );
}
