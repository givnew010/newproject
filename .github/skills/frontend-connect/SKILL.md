---
name: frontend-connect
description: >
  ربط مكونات React بالـ Backend API للمُنسق.
  استخدم عند إنشاء api.ts أو hooks أو عند استبدال localStorage ببيانات حقيقية.
  يوفر templates لـ API client وCustom Hooks وAuthContext.
allowed-tools: editFiles, readFile
---

# Frontend Connect Skill

## الملف 1 — src/lib/api.ts (API Client المركزي)

```typescript
import type { InventoryItem, SalesInvoice, PurchaseInvoice, Customer, Supplier, Warehouse } from '../types';

const BASE = '/api/v1';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new ApiError(401, 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً');
  }

  const data = await res.json();

  if (!data.success) {
    throw new ApiError(res.status, data.message || 'خطأ غير معروف');
  }

  return data.data as T;
}

// ── Inventory ──────────────────────────────────────────
export const inventoryApi = {
  getAll: (params?: Record<string, string>) =>
    request<{ items: InventoryItem[]; total: number }>('GET', `/inventory?${new URLSearchParams(params)}`),
  getById: (id: number) => request<InventoryItem>('GET', `/inventory/${id}`),
  getAlerts: () => request<InventoryItem[]>('GET', '/inventory/alerts'),
  getCategories: () => request<string[]>('GET', '/inventory/categories'),
  getMovements: (id: number, params?: Record<string, string>) =>
    request<unknown[]>('GET', `/inventory/${id}/movements?${new URLSearchParams(params)}`),
  create: (data: Partial<InventoryItem>) => request<InventoryItem>('POST', '/inventory', data),
  update: (id: number, data: Partial<InventoryItem>) => request<InventoryItem>('PUT', `/inventory/${id}`, data),
  delete: (id: number) => request<void>('DELETE', `/inventory/${id}`),
};

// ── Sales ──────────────────────────────────────────────
export const salesApi = {
  getAll: (params?: Record<string, string>) =>
    request<{ items: SalesInvoice[]; total: number }>('GET', `/sales?${new URLSearchParams(params)}`),
  getById: (id: number) => request<SalesInvoice>('GET', `/sales/${id}`),
  create: (data: unknown) => request<SalesInvoice>('POST', '/sales', data),
  update: (id: number, data: unknown) => request<SalesInvoice>('PUT', `/sales/${id}`, data),
  cancel: (id: number) => request<void>('DELETE', `/sales/${id}`),
  addPayment: (id: number, data: unknown) => request<unknown>('POST', `/sales/${id}/payments`, data),
  getPayments: (id: number) => request<unknown[]>('GET', `/sales/${id}/payments`),
};

// ── Purchases ──────────────────────────────────────────
export const purchasesApi = {
  getAll: (params?: Record<string, string>) =>
    request<{ items: PurchaseInvoice[]; total: number }>('GET', `/purchases?${new URLSearchParams(params)}`),
  getById: (id: number) => request<PurchaseInvoice>('GET', `/purchases/${id}`),
  create: (data: unknown) => request<PurchaseInvoice>('POST', '/purchases', data),
  update: (id: number, data: unknown) => request<PurchaseInvoice>('PUT', `/purchases/${id}`, data),
  cancel: (id: number) => request<void>('DELETE', `/purchases/${id}`),
  addPayment: (id: number, data: unknown) => request<unknown>('POST', `/purchases/${id}/payments`, data),
};

// ── Customers ──────────────────────────────────────────
export const customersApi = {
  getAll: (params?: Record<string, string>) =>
    request<Customer[]>('GET', `/customers?${new URLSearchParams(params)}`),
  getById: (id: number) => request<Customer>('GET', `/customers/${id}`),
  getStatement: (id: number) => request<unknown>('GET', `/customers/${id}/statement`),
  create: (data: Partial<Customer>) => request<Customer>('POST', '/customers', data),
  update: (id: number, data: Partial<Customer>) => request<Customer>('PUT', `/customers/${id}`, data),
  delete: (id: number) => request<void>('DELETE', `/customers/${id}`),
};

// ── Suppliers ──────────────────────────────────────────
export const suppliersApi = {
  getAll: (params?: Record<string, string>) =>
    request<Supplier[]>('GET', `/suppliers?${new URLSearchParams(params)}`),
  getById: (id: number) => request<Supplier>('GET', `/suppliers/${id}`),
  getStatement: (id: number) => request<unknown>('GET', `/suppliers/${id}/statement`),
  create: (data: Partial<Supplier>) => request<Supplier>('POST', '/suppliers', data),
  update: (id: number, data: Partial<Supplier>) => request<Supplier>('PUT', `/suppliers/${id}`, data),
  delete: (id: number) => request<void>('DELETE', `/suppliers/${id}`),
};

// ── Warehouses ─────────────────────────────────────────
export const warehousesApi = {
  getAll: () => request<Warehouse[]>('GET', '/warehouses'),
  create: (data: Partial<Warehouse>) => request<Warehouse>('POST', '/warehouses', data),
  update: (id: number, data: Partial<Warehouse>) => request<Warehouse>('PUT', `/warehouses/${id}`, data),
  delete: (id: number) => request<void>('DELETE', `/warehouses/${id}`),
};

// ── Reports ────────────────────────────────────────────
export const reportsApi = {
  getDashboard: () => request<unknown>('GET', '/reports/dashboard'),
  getSales: (params?: Record<string, string>) =>
    request<unknown>('GET', `/reports/sales?${new URLSearchParams(params)}`),
  getPurchases: (params?: Record<string, string>) =>
    request<unknown>('GET', `/reports/purchases?${new URLSearchParams(params)}`),
  getInventory: () => request<unknown>('GET', '/reports/inventory'),
  getReceivables: () => request<unknown>('GET', '/reports/receivables'),
  getPayables: () => request<unknown>('GET', '/reports/payables'),
};

// ── Settings ───────────────────────────────────────────
export const settingsApi = {
  getAll: () => request<Record<string, string>>('GET', '/settings'),
  update: (data: Record<string, string>) => request<void>('PUT', '/settings', data),
  backup: () => request<unknown>('POST', '/settings/backup'),
};

// ── Auth ───────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: unknown }>('POST', '/auth/login', { username, password }),
  me: () => request<unknown>('GET', '/auth/me'),
};
```

## الملف 2 — src/hooks/useApi.ts

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../context/ToastContext';

export function useQuery<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (mountedRef.current) setData(result);
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : 'خطأ غير معروف');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => { mountedRef.current = false; };
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

export function useMutation<TInput, TOutput = unknown>(
  mutateFn: (input: TInput) => Promise<TOutput>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  const mutate = useCallback(async (input: TInput): Promise<TOutput> => {
    setLoading(true);
    setError(null);
    try {
      return await mutateFn(input);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'خطأ غير معروف';
      setError(msg);
      showError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [mutateFn, showError]);

  return { mutate, loading, error };
}
```

## الملف 3 — src/context/AuthContext.tsx

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../lib/api';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'cashier' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const stored = localStorage.getItem('auth_token');
      if (!stored) { setIsLoading(false); return; }
      try {
        const me = await authApi.me() as User;
        setUser(me);
        setToken(stored);
      } catch {
        localStorage.removeItem('auth_token');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    verify();

    // الاستماع لحدث انتهاء الجلسة
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (username: string, password: string) => {
    const { token: newToken, user: newUser } = await authApi.login(username, password);
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(newUser as User);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAdmin: user?.role === 'admin', login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
```

## الملف 4 — vite.config.ts (Proxy)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```
