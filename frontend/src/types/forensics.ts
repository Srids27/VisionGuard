export interface MetadataResult {
  has_exif: boolean;
  metadata_status: string;
  camera_model: string | null;
  camera_make: string | null;
  software: string | null;
  date_taken: string | null;
  gps: { lat: number; lon: number } | null;
  warnings: string[];
  all_tags: Record<string, string>;
}

export interface ELAResult {
  heatmap_base64: string;
  mean_diff: number;
  max_diff: number;
}

export interface AIDetectionResult {
  deepfake_probability: number;
  confidence: number;
  model_used: string;
}

export interface AnalysisResponse {
  scan_id: number;
  image_name: string;
  sha256_hash: string;
  timestamp: string;
  verdict: string;
  manipulation_score: number;
  metadata: MetadataResult;
  ela: ELAResult;
  ai_detection: AIDetectionResult;
  original_image_base64: string;
}

export interface ScanSummary {
  scan_id: number;
  image_name: string;
  sha256_hash: string;
  timestamp: string;
  verdict: string;
  manipulation_score: number;
  software_detected: string | null;
  ela_mean: number | null;
  ai_score: number | null;
}

export interface ScanListResponse {
  total: number;
  limit: number;
  offset: number;
  scans: ScanSummary[];
}
