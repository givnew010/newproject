---
applyTo: "src/**/*.{ts,tsx}"
---

# تعليمات كود الـ Frontend (src/)

## بنية ملفات src/

```
src/
├── main.tsx              ← entry point (RTL + AuthProvider)
├── App.tsx               ← Shell: sidebar، header، router
├── types.ts              ← TypeScript types المشتركة
├── index.css             ← Tailwind + CSS variables + utility classes
│
├── lib/
│   └── api.ts            ← API client المركزي (كل طلبات HTTP هنا)
│
├── hooks/
│   ├── useApi.ts         ← useQuery + useMutation hooks عامة
│   ├── useInventory.ts   ← wrapper لـ inventory API
│   ├── useSales.ts       ← wrapper لـ sales API
│   └── usePurchases.ts   ← wrapper لـ purchases API
│
├── context/
│   ├── AuthContext.tsx   ← user، token، login، logout
│   └── ToastContext.tsx  ← showSuccess، showError، showWarning
│
├── components/
│   ├── Toast.tsx         ← مكون Toast Notifications
│   ├── Modal.tsx         ← wrapper للـ modal العام
│   ├── LoadingSkeleton.tsx
│   ├── StatusBadge.tsx   ← badge حالة المخزون
│   ├── InvoicePrint.tsx  ← template طباعة الفواتير
│   └── ConfirmDialog.tsx ← dialog تأكيد الحذف
│
├── Dashboard.tsx         ← لوحة التحكم (ربط بـ API)
├── Login.tsx             ← صفحة تسجيل الدخول
├── App.tsx               ← يتضمن: Inventory, Sales, Purchases, Reports, Warehouses, Settings
├── SalesInvoices.tsx
├── PurchaseInvoices.tsx
├── Reports.tsx
├── Warehouses.tsx
└── Settings.tsx
```

## نمط API Client (src/lib/api.ts)

```typescript
const BASE_URL = '/api/v1';

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('انتهت الجلسة');
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'خطأ غير معروف');
  return data.data as T;
}

export const inventoryApi = {
  getAll: (params?: Record<string, string>) => apiRequest<InventoryItem[]>('GET', `/inventory?${new URLSearchParams(params)}`),
  getById: (id: number) => apiRequest<InventoryItem>('GET', `/inventory/${id}`),
  create: (data: Partial<InventoryItem>) => apiRequest<InventoryItem>('POST', '/inventory', data),
  update: (id: number, data: Partial<InventoryItem>) => apiRequest<InventoryItem>('PUT', `/inventory/${id}`, data),
  delete: (id: number) => apiRequest<void>('DELETE', `/inventory/${id}`),
};
// ... salesApi, purchasesApi, customersApi, suppliersApi بنفس النمط
```

## نمط Custom Hooks (src/hooks/useApi.ts)

```typescript
// useQuery — لجلب البيانات
export function useQuery<T>(fetchFn: () => Promise<T>, deps: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

// useMutation — لعمليات الكتابة
export function useMutation<TInput, TOutput>(mutateFn: (input: TInput) => Promise<TOutput>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const mutate = async (input: TInput, successMsg?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutateFn(input);
      if (successMsg) showSuccess(successMsg);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'خطأ غير معروف';
      setError(msg);
      showError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
```

## نمط AuthContext

```typescript
// src/context/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

// استخدام في component
const { user, logout, isAdmin } = useAuth();
```

## الـ Types الرئيسية (src/types.ts)

```typescript
export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category?: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  warehouse_id?: number;
  is_active: boolean;
  status: 'in_stock' | 'low_stock' | 'out_of_stock'; // محسوب
  created_at: string;
}

export interface SalesInvoice {
  id: number;
  invoice_number: string;   // INV-2026-0001
  customer_id?: number;
  customer_name?: string;   // من JOIN
  status: 'draft' | 'confirmed' | 'paid' | 'partial' | 'cancelled';
  payment_type: 'cash' | 'credit' | 'bank';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  remaining_amount: number; // محسوب
  date: string;
  due_date?: string;
  notes?: string;
  items: SalesInvoiceItem[];
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'cashier' | 'viewer';
}
```

## قواعد التصميم

### ألوان الثيمات
```typescript
// استخدم هذه الألوان حسب القسم
const themes = {
  inventory:  { primary: 'blue-500',    bg: 'blue-950',    badge: 'bg-blue-500/10 text-blue-400' },
  sales:      { primary: 'emerald-500', bg: 'emerald-950', badge: 'bg-emerald-500/10 text-emerald-400' },
  purchases:  { primary: 'violet-500',  bg: 'violet-950',  badge: 'bg-violet-500/10 text-violet-400' },
  reports:    { primary: 'amber-500',   bg: 'amber-950',   badge: 'bg-amber-500/10 text-amber-400' },
  warehouses: { primary: 'cyan-500',    bg: 'cyan-950',    badge: 'bg-cyan-500/10 text-cyan-400' },
};
```

### Skeleton Loader أثناء التحميل
```tsx
{loading ? (
  <div className="animate-pulse space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-14 bg-slate-700 rounded-lg" />
    ))}
  </div>
) : (
  // البيانات الحقيقية
)}
```

### نمط Modal
```tsx
{showModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg"
    >
      {/* محتوى الـ modal */}
    </motion.div>
  </div>
)}
```

## قواعد صارمة
- لا تستخدم `alert()`, `confirm()` أو `prompt()` — استخدم `ToastContext` و `ConfirmDialog`
- لا تستخدم `localStorage` مباشرةً في المكونات إلا عبر `AuthContext`
- لا تستخدم `fetch()` مباشرةً — دائماً عبر `src/lib/api.ts`
- كل زر حذف يجب أن يمر بـ `ConfirmDialog`
- كل حقل نموذج يجب أن يكون له `label` عربي ورسالة خطأ واضحة
