// ══════════════════════════════════════════════════════════════════════════════
// src/lib/api.ts
// المهمة 9-1: API client المركزي لجميع طلبات HTTP
// ══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = '/api/v1';

// ─── API Request Function ─────────────────────────────────────────────────────
async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: any
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const token = localStorage.getItem('auth_token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return { success: false, error: 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى' };
    }

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'حدث خطأ غير متوقع' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('API Request Error:', error);
    return { success: false, error: 'فشل في الاتصال بالسيرفر' };
  }
}

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiRequest<{ token: string; user: { id: number; username: string; full_name: string; role: string } }>('POST', '/auth/login', credentials),

  me: () =>
    apiRequest<{ id: number; username: string; full_name: string; role: string }>('GET', '/auth/me'),
};

// ─── Inventory API ───────────────────────────────────────────────────────────
export const inventoryApi = {
  getAll: (params?: { search?: string; category?: string; status?: string; warehouse_id?: number; sortBy?: string; sortOrder?: 'asc' | 'desc'; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, value.toString());
        }
      });
    }
    return apiRequest('GET', `/inventory?${query}`);
  },

  getById: (id: number) =>
    apiRequest('GET', `/inventory/${id}`),

  create: (item: any) =>
    apiRequest('POST', '/inventory', item),

  update: (id: number, item: any) =>
    apiRequest('PUT', `/inventory/${id}`, item),

  delete: (id: number) =>
    apiRequest('DELETE', `/inventory/${id}`),

  getCategories: () =>
    apiRequest('GET', '/inventory/categories'),
};

// ─── Sales API ───────────────────────────────────────────────────────────────
export const salesApi = {
  getAll: (params?: { customer_id?: number; status?: string; payment_type?: string; date_from?: string; date_to?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, value.toString());
        }
      });
    }
    return apiRequest('GET', `/sales?${query}`);
  },

  getById: (id: number) =>
    apiRequest('GET', `/sales/${id}`),

  create: (invoice: any) =>
    apiRequest('POST', '/sales', invoice),

  update: (id: number, invoice: any) =>
    apiRequest('PUT', `/sales/${id}`, invoice),

  delete: (id: number) =>
    apiRequest('DELETE', `/sales/${id}`),

  addPayment: (id: number, payment: any) =>
    apiRequest('POST', `/sales/${id}/payments`, payment),

  getPayments: (id: number) =>
    apiRequest('GET', `/sales/${id}/payments`),
};

// ─── Purchases API ───────────────────────────────────────────────────────────
export const purchasesApi = {
  getAll: (params?: { supplier_id?: number; status?: string; date_from?: string; date_to?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, value.toString());
        }
      });
    }
    return apiRequest('GET', `/purchases?${query}`);
  },

  getById: (id: number) =>
    apiRequest('GET', `/purchases/${id}`),

  create: (invoice: any) =>
    apiRequest('POST', '/purchases', invoice),

  update: (id: number, invoice: any) =>
    apiRequest('PUT', `/purchases/${id}`, invoice),

  delete: (id: number) =>
    apiRequest('DELETE', `/purchases/${id}`),

  addPayment: (id: number, payment: any) =>
    apiRequest('POST', `/purchases/${id}/payments`, payment),

  getPayments: (id: number) =>
    apiRequest('GET', `/purchases/${id}/payments`),
};

// ─── Customers API ───────────────────────────────────────────────────────────
export const customersApi = {
  getAll: (params?: { search?: string; has_balance?: boolean; is_active?: boolean }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, value.toString());
        }
      });
    }
    return apiRequest('GET', `/customers?${query}`);
  },

  getById: (id: number) =>
    apiRequest('GET', `/customers/${id}`),

  create: (customer: any) =>
    apiRequest('POST', '/customers', customer),

  update: (id: number, customer: any) =>
    apiRequest('PUT', `/customers/${id}`, customer),

  delete: (id: number) =>
    apiRequest('DELETE', `/customers/${id}`),

  getInvoices: (id: number) =>
    apiRequest('GET', `/customers/${id}/invoices`),

  getPayments: (id: number) =>
    apiRequest('GET', `/customers/${id}/payments`),

  getStatement: (id: number) =>
    apiRequest('GET', `/customers/${id}/statement`),
};

// ─── Suppliers API ───────────────────────────────────────────────────────────
export const suppliersApi = {
  getAll: (params?: { search?: string; has_balance?: boolean; is_active?: boolean }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, value.toString());
        }
      });
    }
    return apiRequest('GET', `/suppliers?${query}`);
  },

  getById: (id: number) =>
    apiRequest('GET', `/suppliers/${id}`),

  create: (supplier: any) =>
    apiRequest('POST', '/suppliers', supplier),

  update: (id: number, supplier: any) =>
    apiRequest('PUT', `/suppliers/${id}`, supplier),

  delete: (id: number) =>
    apiRequest('DELETE', `/suppliers/${id}`),

  getInvoices: (id: number) =>
    apiRequest('GET', `/suppliers/${id}/invoices`),

  getPayments: (id: number) =>
    apiRequest('GET', `/suppliers/${id}/payments`),

  getStatement: (id: number) =>
    apiRequest('GET', `/suppliers/${id}/statement`),
};

// ─── Warehouses API ──────────────────────────────────────────────────────────
export const warehousesApi = {
  getAll: () =>
    apiRequest('GET', '/warehouses'),

  getById: (id: number) =>
    apiRequest('GET', `/warehouses/${id}`),

  create: (warehouse: any) =>
    apiRequest('POST', '/warehouses', warehouse),

  update: (id: number, warehouse: any) =>
    apiRequest('PUT', `/warehouses/${id}`, warehouse),

  delete: (id: number) =>
    apiRequest('DELETE', `/warehouses/${id}`),
};

// ─── Reports API ─────────────────────────────────────────────────────────────
export const reportsApi = {
  getDashboard: () =>
    apiRequest('GET', '/reports/dashboard'),

  getSales: (params?: { date_from?: string; date_to?: string; customer_id?: number; group_by?: 'day' | 'week' | 'month' }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, value.toString());
        }
      });
    }
    return apiRequest('GET', `/reports/sales?${query}`);
  },

  getPurchases: (params?: { date_from?: string; date_to?: string; supplier_id?: number; group_by?: 'day' | 'week' | 'month' }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, value.toString());
        }
      });
    }
    return apiRequest('GET', `/reports/purchases?${query}`);
  },

  getInventory: () =>
    apiRequest('GET', '/reports/inventory'),

  getReceivables: () =>
    apiRequest('GET', '/reports/receivables'),

  getPayables: () =>
    apiRequest('GET', '/reports/payables'),
};

// ─── Users API ───────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: () =>
    apiRequest('GET', '/users'),

  getById: (id: number) =>
    apiRequest('GET', `/users/${id}`),

  create: (user: any) =>
    apiRequest('POST', '/users', user),

  update: (id: number, user: any) =>
    apiRequest('PUT', `/users/${id}`, user),

  updatePassword: (id: number, password: string) =>
    apiRequest('PUT', `/users/${id}/password`, { password }),

  delete: (id: number) =>
    apiRequest('DELETE', `/users/${id}`),
};

// ─── Settings API ────────────────────────────────────────────────────────────
export const settingsApi = {
  getAll: () =>
    apiRequest('GET', '/settings'),

  update: (settings: Record<string, any>) =>
    apiRequest('PUT', '/settings', settings),

  backup: () =>
    apiRequest('POST', '/settings/backup'),

  restore: (data: any) =>
    apiRequest('POST', '/settings/restore', data),
};
