import api from './api';
import type { ScanListResponse } from '../types/forensics';

export async function getScanHistory(
  limit = 50,
  offset = 0
): Promise<ScanListResponse> {
  const response = await api.get<ScanListResponse>('/scans', {
    params: { limit, offset },
  });
  return response.data;
}
