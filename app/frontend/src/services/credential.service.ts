import api from '@/lib/axios';
import { Credential, PaginatedResponse, IssueCredentialForm } from '@/types';

export const credentialService = {
  // Issue a new credential
  async issueCredential(data: IssueCredentialForm): Promise<Credential> {
    const formData = new FormData();
    formData.append('studentEmail', data.studentEmail);
    formData.append('credentialType', data.credentialType);
    formData.append('file', data.file);
    formData.append('metadata', JSON.stringify(data.metadata));

    const response = await api.post<Credential>('/credentials/issue', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Revoke a credential
  async revokeCredential(id: string, reason: string): Promise<Credential> {
    const response = await api.post<Credential>(`/credentials/${id}/revoke`, { reason });
    return response.data;
  },

  // Get credentials issued by current issuer
  async getMyIssuedCredentials(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<PaginatedResponse<Credential>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });
    const response = await api.get<PaginatedResponse<Credential>>(
      `/credentials/my-issued?${params}`
    );
    return response.data;
  },

  // Get credentials for current student
  async getMyCredentials(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Credential>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await api.get<PaginatedResponse<Credential>>(
      `/credentials/my-credentials?${params}`
    );
    return response.data;
  },

  // Get credential by ID
  async getCredentialById(id: string): Promise<Credential> {
    const response = await api.get<Credential>(`/credentials/${id}`);
    return response.data;
  },
};
