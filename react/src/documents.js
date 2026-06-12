import { API_BASE } from './config';
import { authHeaders } from './auth';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const listDocuments = ({ search, starred } = {}) => {
  const qs = new URLSearchParams();
  if (search) qs.set('search', search);
  if (starred) qs.set('starred', '1');
  const suffix = qs.toString() ? `?${qs}` : '';
  return request(`/api/documents${suffix}`);
};

export const createDocument = (doc = {}) =>
  request('/api/documents', { method: 'POST', body: JSON.stringify(doc) });

export const getDocument = (id) => request(`/api/documents/${id}`);

export const updateDocument = (id, patch) =>
  request(`/api/documents/${id}`, { method: 'PUT', body: JSON.stringify(patch) });

export const deleteDocument = (id) =>
  request(`/api/documents/${id}`, { method: 'DELETE' });
