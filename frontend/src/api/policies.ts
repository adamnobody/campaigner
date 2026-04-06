import type {
  ApiResponse,
  Policy,
  CreatePolicy,
  UpdatePolicy,
  PolicyFactionLink,
  CreatePolicyFactionLink,
  UpdatePolicyFactionLink,
} from '@campaigner/shared';
import { apiClient, type VoidResponse } from './client';

export const policiesApi = {
  getAll: (projectId: number) =>
    apiClient.get<ApiResponse<Policy[]>>('/policies', { params: { projectId } }),
  getById: (id: number) =>
    apiClient.get<ApiResponse<Policy>>(`/policies/${id}`),
  create: (data: CreatePolicy) =>
    apiClient.post<ApiResponse<Policy>>('/policies', data),
  update: (id: number, data: UpdatePolicy) =>
    apiClient.put<ApiResponse<Policy>>(`/policies/${id}`, data),
  delete: (id: number) =>
    apiClient.delete<VoidResponse>(`/policies/${id}`),
  getLinks: (policyId: number) =>
    apiClient.get<ApiResponse<PolicyFactionLink[]>>(`/policies/${policyId}/links`),
  addLink: (policyId: number, data: CreatePolicyFactionLink) =>
    apiClient.post<ApiResponse<PolicyFactionLink>>(`/policies/${policyId}/links`, data),
  updateLink: (policyId: number, linkId: number, data: UpdatePolicyFactionLink) =>
    apiClient.put<ApiResponse<PolicyFactionLink>>(`/policies/${policyId}/links/${linkId}`, data),
  removeLink: (policyId: number, linkId: number) =>
    apiClient.delete<VoidResponse>(`/policies/${policyId}/links/${linkId}`),
};
