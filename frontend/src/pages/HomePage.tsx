import { useState, useCallback } from 'react';
import FileUploadZone from '../components/upload/FileUploadZone';
import FilePreview from '../components/upload/FilePreview';
import ForensicDashboard from '../components/forensics/ForensicDashboard';
import { uploadAndAnalyze } from '../services/forensicsService';
import type { AnalysisResponse } from '../types/forensics';

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  }, [previewUrl]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await uploadAndAnalyze(selectedFile);
      setResult(res);
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail || e?.message || 'Analysis failed. Check backend connection.';
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile]);

  return (
    <div className="px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold tracking-widest text-cyber-green glow-text-strong typing-cursor">
          DIGITAL IMAGE FORENSICS
        </h2>
        <p className="text-xs text-gray-500 mt-3 tracking-wider">
          Upload an image to analyze its authenticity using metadata extraction, error level
          analysis, and AI-powered deepfake detection.
        </p>
      </div>

      {/* Upload Zone */}
      <FileUploadZone onFileSelect={handleFileSelect} isAnalyzing={isAnalyzing} />

      {/* File Preview + Analyze Button */}
      {selectedFile && previewUrl && !result && (
        <FilePreview
          file={selectedFile}
          previewUrl={previewUrl}
          onAnalyze={handleAnalyze}
          onClear={handleClear}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* Error */}
      {error && (
        <div className="max-w-2xl mx-auto mt-6 border border-cyber-red rounded-lg p-4 bg-cyber-charcoal">
          <p className="text-sm text-cyber-red tracking-wider">! ERROR: {error}</p>
        </div>
      )}

      {/* Loading */}
      {isAnalyzing && (
        <div className="text-center mt-10">
          <div className="inline-block w-8 h-8 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 mt-3 tracking-wider">
            ANALYZING IMAGE... PLEASE WAIT
          </p>
          <div className="max-w-xs mx-auto mt-3 h-1 bg-cyber-gray rounded-full overflow-hidden">
            <div className="h-full bg-cyber-green rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      )}

      {/* Results Dashboard */}
      {result && <ForensicDashboard result={result} />}
    </div>
  );
}
