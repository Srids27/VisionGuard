import api from './api';
import type { AnalysisResponse } from '../types/forensics';

export async function uploadAndAnalyze(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);
  // Add '/api' before '/analyze' to match main.py
  const response = await api.post<AnalysisResponse>('/api/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}