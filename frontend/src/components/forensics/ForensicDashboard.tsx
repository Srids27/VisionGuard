import type { AnalysisResponse } from '../../types/forensics';
import MetadataPanel from './MetadataPanel';
import ELAComparison from './ELAComparison';
import AIScoreGauge from './AIScoreGauge';
import IntegrityCertificate from './IntegrityCertificate';

interface ForensicDashboardProps {
  result: AnalysisResponse;
}

export default function ForensicDashboard({ result }: ForensicDashboardProps) {
  return (
    <div className="w-full max-w-7xl mx-auto mt-10 animate-fade-in-up space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold tracking-widest text-cyber-green glow-text-strong">
          [ FORENSIC ANALYSIS COMPLETE ]
        </h2>
        <p className="text-xs text-gray-500 mt-1 tracking-wider">
          scan_id: {result.scan_id} // {result.image_name}
        </p>
      </div>

      {/* Main grid: ELA left, Metadata + AI right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ELAComparison
            originalImageBase64={result.original_image_base64}
            elaHeatmapBase64={result.ela.heatmap_base64}
            meanDiff={result.ela.mean_diff}
            maxDiff={result.ela.max_diff}
          />
        </div>
        <div className="space-y-6">
          <MetadataPanel metadata={result.metadata} />
          <AIScoreGauge
            score={Math.round(result.ai_detection.deepfake_probability * 100)}
            confidence={result.ai_detection.confidence}
            modelUsed={result.ai_detection.model_used}
          />
        </div>
      </div>

      {/* Integrity Certificate */}
      <IntegrityCertificate
        fileHash={result.sha256_hash}
        verdict={result.verdict}
        manipulationScore={result.manipulation_score}
        timestamp={result.timestamp}
        imageName={result.image_name}
        hasExif={result.metadata.has_exif}
      />
    </div>
  );
}
