// Empty string = same-origin Next.js mock API routes (no C# backend needed).
// Set NEXT_PUBLIC_API_URL=http://localhost:5000 in .env.local to hit the real backend.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('fleetos_token') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data: Record<string, string>) =>
      request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  },
  dashboard: {
    summary: () => request('/api/v1/dashboard/summary'),
    acknowledgeAlert: (id: string) =>
      request(`/api/v1/dashboard/alerts/${id}/acknowledge`, { method: 'POST' }),
  },
  vehicles: {
    list: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request(`/api/v1/vehicles${q ? `?${q}` : ''}`);
    },
    get: (id: string) => request(`/api/v1/vehicles/${id}`),
    create: (data: Record<string, unknown>) =>
      request('/api/v1/vehicles', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/api/v1/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/v1/vehicles/${id}`, { method: 'DELETE' }),
  },
  drivers: {
    list: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request(`/api/v1/drivers${q ? `?${q}` : ''}`);
    },
    get: (id: string) => request(`/api/v1/drivers/${id}`),
    create: (data: Record<string, unknown>) =>
      request('/api/v1/drivers', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/v1/drivers/${id}`, { method: 'DELETE' }),
  },
  alerts: {
    list: (params?: { tenantId?: string; status?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<unknown[]>(`/api/v1/alerts${q ? `?${q}` : ''}`);
    },
    updateStatus: (id: string, status: string, operatorResponse?: string, operatorName?: string) =>
      request<void>(`/api/v1/alerts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, operatorResponse, operatorName }),
      }),
  },
  rbac: {
    /** Fetch allowed-module list for every system role */
    getPermissions: () =>
      request<{ roleId: string; allowedModules: string[] }[]>('/api/v1/rbac/permissions'),
    /** Replace the allowed-module set for a single role (super_admin only) */
    updatePermissions: (roleId: string, allowedModules: string[]) =>
      request<void>(`/api/v1/rbac/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ allowedModules }),
      }),
  },
};
