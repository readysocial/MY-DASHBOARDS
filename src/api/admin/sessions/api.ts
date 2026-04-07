import { API_ENDPOINTS } from '@/config/api';
import type {
    UpdateStatusRequest,
    UpdateStatusResponse,
    AddMeetingLinkRequest,
    AddMeetingLinkResponse,
  } from './types';

const getAdminToken = () => {
  const token = localStorage.getItem('adminToken');
  if (!token) throw new Error('No admin authentication token found');
  return token;
};

export const updateSessionStatus = async (
  sessionId: string,
  data: UpdateStatusRequest
): Promise<UpdateStatusResponse> => {
  const token = getAdminToken();

  const response = await fetch(API_ENDPOINTS.admin.sessions.updateStatus(sessionId), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update session status');
  }

  return response.json();
};

export const addMeetingLink = async (
  sessionId: string,
  data: AddMeetingLinkRequest
): Promise<AddMeetingLinkResponse> => {
  const token = getAdminToken();
  console.log('🔐 adminToken:', token);                         // 1
  const url = API_ENDPOINTS.admin.sessions.addMeetingLink(sessionId);
  console.log('🌐 PATCH ➜', url);                               // 2

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  console.log('📡 response status:', response.status);          // 3

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add meeting link');
  }

  return response.json();
};