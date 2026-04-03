// ══════════════════════════════════════════════════════════════════════════════
// src/hooks/useApi.ts
// المهمة 9-2: Custom hooks للـ data fetching مع loading/error/data
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

// ─── useQuery Hook ───────────────────────────────────────────────────────────
export function useQuery<T>(
  fetchFn: () => Promise<{ success: boolean; data?: T; error?: string }>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'حدث خطأ غير متوقع');
      }
    } catch (err) {
      setError('فشل في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    refetch();
  }, deps);

  return { data, loading, error, refetch };
}

// ─── useMutation Hook ────────────────────────────────────────────────────────
export function useMutation<TData = any, TVariables = any>(
  mutateFn: (variables: TVariables) => Promise<{ success: boolean; data?: TData; error?: string }>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutate = useCallback(async (variables: TVariables) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await mutateFn(variables);
      if (result.success) {
        setSuccess(true);
        return result.data;
      } else {
        setError(result.error || 'حدث خطأ غير متوقع');
        return null;
      }
    } catch (err) {
      setError('فشل في الاتصال بالسيرفر');
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutateFn]);

  return { mutate, loading, error, success };
}

// ─── Specialized Hooks ───────────────────────────────────────────────────────

// Inventory Hook
export function useInventory(params?: { search?: string; category?: string; status?: string; warehouse_id?: number; sortBy?: string; sortOrder?: 'asc' | 'desc'; page?: number; limit?: number }) {
  const { data, loading, error, refetch } = useQuery(
    () => import('../lib/api').then(m => m.inventoryApi.getAll(params)),
    [JSON.stringify(params)]
  );
  return { items: data?.items || [], loading, error, refetch };
}

// Sales Hook
export function useSales(params?: { customer_id?: number; status?: string; payment_type?: string; date_from?: string; date_to?: string; search?: string; page?: number; limit?: number }) {
  const { data, loading, error, refetch } = useQuery(
    () => import('../lib/api').then(m => m.salesApi.getAll(params)),
    [JSON.stringify(params)]
  );
  return { invoices: data?.invoices || [], loading, error, refetch };
}

// Purchases Hook
export function usePurchases(params?: { supplier_id?: number; status?: string; date_from?: string; date_to?: string; search?: string; page?: number; limit?: number }) {
  const { data, loading, error, refetch } = useQuery(
    () => import('../lib/api').then(m => m.purchasesApi.getAll(params)),
    [JSON.stringify(params)]
  );
  return { invoices: data?.invoices || [], loading, error, refetch };
}

// ─── Mutation Hooks ─────────────────────────────────────────────────────────

// Inventory Mutations
export function useCreateInventory() {
  return useMutation(
    (item: any) => import('../lib/api').then(m => m.inventoryApi.create(item))
  );
}

export function useUpdateInventory() {
  return useMutation(
    ({ id, item }: { id: number; item: any }) => import('../lib/api').then(m => m.inventoryApi.update(id, item))
  );
}

export function useDeleteInventory() {
  return useMutation(
    (id: number) => import('../lib/api').then(m => m.inventoryApi.delete(id))
  );
}

// Warehouses Hook
export function useWarehouses() {
  const { data, loading, error, refetch } = useQuery(
    () => import('../lib/api').then(m => m.warehousesApi.getAll()),
    []
  );
  return { warehouses: (data as any)?.warehouses || [], loading, error, refetch };
}

// Warehouse Mutations
export function useCreateWarehouse() {
  return useMutation(
    (warehouse: any) => import('../lib/api').then(m => m.warehousesApi.create(warehouse))
  );
}

export function useUpdateWarehouse() {
  return useMutation(
    ({ id, warehouse }: { id: number; warehouse: any }) => import('../lib/api').then(m => m.warehousesApi.update(id, warehouse))
  );
}

export function useDeleteWarehouse() {
  return useMutation(
    (id: number) => import('../lib/api').then(m => m.warehousesApi.delete(id))
  );
}

// Sales Mutations
export function useCreateSale() {
  return useMutation(
    (sale: any) => import('../lib/api').then(m => m.salesApi.create(sale))
  );
}

export function useUpdateSale() {
  return useMutation(
    ({ id, sale }: { id: number; sale: any }) => import('../lib/api').then(m => m.salesApi.update(id, sale))
  );
}

export function useDeleteSale() {
  return useMutation(
    (id: number) => import('../lib/api').then(m => m.salesApi.delete(id))
  );
}

export function useCreateSalePayment() {
  return useMutation(
    ({ id, payment }: { id: number; payment: any }) => import('../lib/api').then(m => m.salesApi.addPayment(id, payment))
  );
}

// Purchases Mutations
export function useCreatePurchase() {
  return useMutation(
    (purchase: any) => import('../lib/api').then(m => m.purchasesApi.create(purchase))
  );
}

export function useUpdatePurchase() {
  return useMutation(
    ({ id, purchase }: { id: number; purchase: any }) => import('../lib/api').then(m => m.purchasesApi.update(id, purchase))
  );
}

export function useDeletePurchase() {
  return useMutation(
    (id: number) => import('../lib/api').then(m => m.purchasesApi.delete(id))
  );
}

export function useCreatePurchasePayment() {
  return useMutation(
    ({ id, payment }: { id: number; payment: any }) => import('../lib/api').then(m => m.purchasesApi.addPayment(id, payment))
  );
}

// Customers Hook
export function useCustomers(params?: { search?: string; has_balance?: boolean; is_active?: boolean }) {
  const { data, loading, error, refetch } = useQuery(
    () => import('../lib/api').then(m => m.customersApi.getAll(params)),
    [JSON.stringify(params)]
  );
  return { customers: data, loading, error, refetch };
}

// Suppliers Hook
export function useSuppliers(params?: { search?: string; has_balance?: boolean; is_active?: boolean }) {
  const { data, loading, error, refetch } = useQuery(
    () => import('../lib/api').then(m => m.suppliersApi.getAll(params)),
    [JSON.stringify(params)]
  );
  return { suppliers: data, loading, error, refetch };
}

// Users Hook
export function useUsers() {
  const { data, loading, error, refetch } = useQuery(
    () => import('../lib/api').then(m => m.usersApi.getAll()),
    []
  );
  return { users: data, loading, error, refetch };
}

// Dashboard Hook
export function useDashboard() {
  const { data, loading, error, refetch } = useQuery(
    () => import('../lib/api').then(m => m.reportsApi.getDashboard()),
    []
  );
  return { dashboard: data, loading, error, refetch };
}

// Settings Hook
export function useSettings() {
  const { data, loading, error, refetch } = useQuery(
    () => import('../lib/api').then(m => m.settingsApi.getAll()),
    []
  );
  return { settings: data, loading, error, refetch };
}
