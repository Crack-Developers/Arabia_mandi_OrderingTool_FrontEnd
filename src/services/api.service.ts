/**
 * api.service.ts
 * Central Axios-based HTTP client for all backend API calls.
 * Base URL: http://localhost:5000/api/v1
 */

const BASE_URL = 'http://localhost:5000/api/v1';

// ─── Token helpers ───────────────────────────────────────────────
export const getToken = (): string | null => localStorage.getItem('erp_token');

const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Generic fetch wrapper ───────────────────────────────────────
async function request<T>(
  method: string,
  path: string,
  body?: any
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Non-JSON response from ${path}`);
  }

  if (!res.ok) {
    throw new Error(json?.message || `Request failed: ${res.status}`);
  }

  // Unwrap { success: true, data: {...} } envelope from backend
  return json?.data !== undefined ? json.data : json;
}

const get  = <T>(path: string)              => request<T>('GET',    path);
const post = <T>(path: string, body: any)   => request<T>('POST',   path, body);
const put  = <T>(path: string, body: any)   => request<T>('PUT',    path, body);
const patch= <T>(path: string, body?: any)  => request<T>('PATCH',  path, body);
const del  = <T>(path: string)              => request<T>('DELETE', path);

// ────────────────────────────────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    post<any>('/auth/login', { username, password }),

  getProfile: () => get<any>('/auth/profile'),

  changePassword: (currentPassword: string, newPassword: string) =>
    put<any>('/auth/change-password', { currentPassword, newPassword }),
};

// ────────────────────────────────────────────────────────────────────────────
// BRANCHES
// ────────────────────────────────────────────────────────────────────────────
export const branchApi = {
  getAll: () => get<any>('/branches'),
  getById: (id: string) => get<any>(`/branches/${id}`),
  create: (data: any) => post<any>('/branches', data),
  update: (id: string, data: any) => put<any>(`/branches/${id}`, data),
  delete: (id: string) => del<any>(`/branches/${id}`),
  toggleStatus: (id: string) => patch<any>(`/branches/${id}/toggle-status`),
};

// ────────────────────────────────────────────────────────────────────────────
// STAFF
// ────────────────────────────────────────────────────────────────────────────
export const staffApi = {
  getAll: (branchId?: string) =>
    get<any>(`/staff${branchId ? `?branchId=${branchId}` : ''}`),
  getById: (id: string) => get<any>(`/staff/${id}`),
  create: (data: any) => post<any>('/staff', data),
  update: (id: string, data: any) => put<any>(`/staff/${id}`, data),
  delete: (id: string) => del<any>(`/staff/${id}`),
  resetPassword: (id: string) => post<any>(`/staff/${id}/reset-password`, {}),
};

// ────────────────────────────────────────────────────────────────────────────
// SECTIONS
// ────────────────────────────────────────────────────────────────────────────
export const sectionApi = {
  getAll: (branchId?: string) =>
    get<any>(`/sections${branchId ? `?branchId=${branchId}` : ''}`),
  create: (data: any) => post<any>('/sections', data),
  update: (id: string, data: any) => put<any>(`/sections/${id}`, data),
  delete: (id: string) => del<any>(`/sections/${id}`),
};

// ────────────────────────────────────────────────────────────────────────────
// TABLES
// ────────────────────────────────────────────────────────────────────────────
export const tableApi = {
  getAll: (branchId?: string) =>
    get<any>(`/tables${branchId ? `?branchId=${branchId}` : ''}`),
  getById: (id: string) => get<any>(`/tables/${id}`),
  create: (data: any) => post<any>('/tables', data),
  update: (id: string, data: any) => put<any>(`/tables/${id}`, data),
  delete: (id: string) => del<any>(`/tables/${id}`),
  reserve: (data: any) => post<any>('/tables/reserve', data),
  cancelReservation: (tableId: string) =>
    post<any>('/tables/cancel-reservation', { tableId }),
  merge: (primaryTableId: string, targetTableId: string) =>
    post<any>('/tables/merge', { primaryTableId, targetTableId }),
  separate: (tableId: string) => post<any>('/tables/separate', { tableId }),
  release: (tableId: string) => post<any>('/tables/release', { tableId }),
};

// ────────────────────────────────────────────────────────────────────────────
// MENU
// ────────────────────────────────────────────────────────────────────────────
export const menuApi = {
  // Categories
  getAllCategories: () => get<any>('/menu/categories'),
  createCategory: (data: any) => post<any>('/menu/categories', data),
  updateCategory: (id: string, data: any) => put<any>(`/menu/categories/${id}`, data),
  deleteCategory: (id: string) => del<any>(`/menu/categories/${id}`),

  // Items
  getAllItems: (categoryId?: string) =>
    get<any>(`/menu/items${categoryId ? `?categoryId=${categoryId}` : ''}`),
  getItemById: (id: string) => get<any>(`/menu/items/${id}`),
  createItem: (data: any) => post<any>('/menu/items', data),
  updateItem: (id: string, data: any) => put<any>(`/menu/items/${id}`, data),
  deleteItem: (id: string) => del<any>(`/menu/items/${id}`),
  toggleAvailability: (id: string) => patch<any>(`/menu/items/${id}/availability`),
};

// ────────────────────────────────────────────────────────────────────────────
// ORDERS
// ────────────────────────────────────────────────────────────────────────────
export const orderApi = {
  getAll: (branchId?: string, status?: string) =>
    get<any>(`/orders${branchId ? `?branchId=${branchId}` : ''}${status ? `&status=${status}` : ''}`),
  getById: (id: string) => get<any>(`/orders/${id}`),
  create: (data: any) => post<any>('/orders', data),
  addItems: (id: string, items: any[]) => post<any>(`/orders/${id}/add-items`, { items }),
  updateStatus: (id: string, status: string) => patch<any>(`/orders/${id}/status`, { status }),
  generateKOT: (id: string) => post<any>(`/orders/${id}/kot`, {}),
  generateBill: (id: string, branchId: string) => post<any>(`/orders/${id}/bill`, { branchId }),
  processPayment: (billId: string, paymentMethods: { cash: number; card: number; upi: number }) =>
    post<any>('/orders/payment', { billId, paymentMethods }),
};

// ────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────────────────────────────────────────
export const notificationApi = {
  getAll: (branchId?: string) =>
    get<any>(`/notifications${branchId ? `?branchId=${branchId}` : ''}`),
  markRead: (id: string) => patch<any>(`/notifications/${id}/read`),
  delete: (id: string) => del<any>(`/notifications/${id}`),
};

// ────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ────────────────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getAdminStats: () => get<any>('/dashboard/admin'),
};

// ────────────────────────────────────────────────────────────────────────────
// SYNC
// ────────────────────────────────────────────────────────────────────────────
export const syncApi = {
  upload: (items: any[]) => post<any>('/sync/upload', { items }),
  getStatus: () => get<any>('/sync/status'),
  markSynced: (ids: string[]) => post<any>('/sync/mark-synced', { ids }),
};

// ────────────────────────────────────────────────────────────────────────────
// Token management (called on login/logout)
// ────────────────────────────────────────────────────────────────────────────
export const setToken = (token: string) => localStorage.setItem('erp_token', token);
export const clearToken = () => localStorage.removeItem('erp_token');

// ────────────────────────────────────────────────────────────────────────────
// PRINTERS (Wireless / Network Printers & Section-based KOT routing)
// ────────────────────────────────────────────────────────────────────────────
export const printerApi = {
  getAll: (branchId?: string) =>
    get<any>(`/printers${branchId ? `?branchId=${branchId}` : ''}`),
  scanLAN: () => get<any>('/printers/scan'),
  create: (data: any) => post<any>('/printers', data),
  update: (id: string, data: any) => put<any>(`/printers/${id}`, data),
  delete: (id: string) => del<any>(`/printers/${id}`),
  printJob: (printerId: string, payload: any) =>
    post<any>('/printers/print', { printerId, payload }),
};


