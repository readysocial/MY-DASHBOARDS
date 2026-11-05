import { getAuthToken } from './auth';

export const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const handleUnauthorized = (error: any) => {
  if (error.status === 401) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    window.location.href = '/auth';
  }
  return error;
};

export const validateToken = () => {
  const token = getAuthToken();
  if (!token) {
    window.location.href = '/auth';
    return false;
  }
  return true;
};