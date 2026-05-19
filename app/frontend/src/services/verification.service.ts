import api from '@/lib/axios';
import { VerificationResult, Credential } from '@/types';

export const verificationService = {
  // Verify credential by file upload
  async verifyByFile(file: File): Promise<VerificationResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<VerificationResult>('/verify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Verify credential by ID (QR code scan)
  async verifyById(id: string): Promise<VerificationResult> {
    const response = await api.get<VerificationResult>(`/verify/${id}`);
    return response.data;
  },

  // Get public credential details
  async getPublicCredential(id: string): Promise<Credential> {
    const response = await api.get<Credential>(`/verify/${id}/public`);
    return response.data;
  },

  // Get verification statistics
  async getVerificationStats(id: string): Promise<{
    totalVerifications: number;
    lastVerifiedAt: string | null;
  }> {
    const response = await api.get<{
      totalVerifications: number;
      lastVerifiedAt: string | null;
    }>(`/verify/${id}/stats`);
    return response.data;
  },
};
