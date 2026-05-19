import api from '@/lib/axios';
import { Issuer, IssuerRegistrationForm, PaginatedResponse } from '@/types';

export const issuerService = {
  // Register as issuer
  async register(data: IssuerRegistrationForm): Promise<Issuer> {
    const response = await api.post<Issuer>('/issuers/register', data);
    return response.data;
  },

  // Get current issuer profile
  async getMyProfile(): Promise<Issuer> {
    const response = await api.get<Issuer>('/issuers/me');
    return response.data;
  },

  // Update issuer profile
  async updateProfile(data: Partial<IssuerRegistrationForm>): Promise<Issuer> {
    const response = await api.put<Issuer>('/issuers/me', data);
    return response.data;
  },

  // Get all issuers (admin only)
  async getAllIssuers(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<PaginatedResponse<Issuer>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });
    const response = await api.get<PaginatedResponse<Issuer>>(`/issuers?${params}`);
    return response.data;
  },

  // Get pending issuer applications (admin only)
  async getPendingApplications(): Promise<Issuer[]> {
    const response = await api.get<Issuer[]>('/issuers/pending');
    return response.data;
  },

  // Approve or reject issuer (admin only)
  async approveIssuer(id: string, approved: boolean): Promise<Issuer> {
    const response = await api.post<Issuer>(`/issuers/${id}/approve`, { approved });
    return response.data;
  },

  // Get issuer by ID
  async getIssuerById(id: string): Promise<Issuer> {
    const response = await api.get<Issuer>(`/issuers/${id}`);
    return response.data;
  },

  // Delete issuer (admin only)
  async deleteIssuer(id: string): Promise<void> {
    await api.delete(`/issuers/${id}`);
  },
};
