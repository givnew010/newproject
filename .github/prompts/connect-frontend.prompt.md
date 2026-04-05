---
mode: agent
description: ربط Frontend React بالـ Backend API — استبدال localStorage بطلبات حقيقية
---

# ربط Frontend بالـ Backend API

## المهمة
استبدل جميع بيانات localStorage في الـ Frontend بطلبات API حقيقية.

## الخطوة 1 — إنشاء API Client (src/lib/api.ts)

أنشئ `src/lib/api.ts` يحتوي على:
1. دالة `apiRequest<T>()` مركزية تتعامل مع fetch + auth token + error handling
2. وحدات منفصلة: `inventoryApi`, `salesApi`, `purchasesApi`, `customersApi`, `suppliersApi`, `reportsApi`, `settingsApi`
3. كل وحدة تحتوي: `getAll`, `getById`, `create`, `update`, `delete`
4. معالجة تلقائية لـ 401 → تحويل لصفحة login

## الخطوة 2 — Custom Hooks (src/hooks/)

أنشئ الـ hooks التالية:

### src/hooks/useApi.ts
- `useQuery(fetchFn, deps)` — جلب بيانات مع loading/error/refetch
- `useMutation(mutateFn)` — عمليات الكتابة مع loading/error

### src/hooks/useInventory.ts
```typescript
export function useInventory(params?: InventoryParams) {
  return useQuery(() => inventoryApi.getAll(params), [JSON.stringify(params)]);
}
```

### src/hooks/useSales.ts, usePurchases.ts
بنفس النمط

## الخطوة 3 — Auth System

### src/context/AuthContext.tsx
- حالات: `user`, `token`, `isLoading`, `isAdmin`
- عند بدء التطبيق: قراءة token من localStorage → GET /api/v1/auth/me
- `login(username, password)` → POST /api/v1/auth/login → حفظ token
- `logout()` → حذف token + تحويل لـ login

### src/Login.tsx
- نموذج تسجيل الدخول بتصميم يتناسب مع المشروع (أزرق داكن)
- عرض رسالة خطأ واضحة إذا فشل تسجيل الدخول
- بيانات الدخول الافتراضية: admin / admin123 (للتجربة)

### تعديل src/App.tsx
- إضافة `<AuthContext.Provider>` حول كل شيء
- إضافة `<ToastContext.Provider>`
- إضافة شرط: إذا لم يكن مسجلاً → عرض `<Login />`
- إضافة اسم المستخدم + دوره + زر تسجيل الخروج في الـ header

## الخطوة 4 — ربط الصفحات

### src/Dashboard.tsx
استبدل البيانات الوهمية بـ:
```typescript
const { data: dashboardData, loading } = useQuery(() => reportsApi.getDashboard());
```
- KPI cards: إجمالي المبيعات، المشتريات، الأرباح، الفواتير المعلقة
- قائمة الأصناف منخفضة المخزون (من `dashboardData.lowStockItems`)
- آخر 5 فواتير بيع + 5 فواتير شراء
- Skeleton loader أثناء التحميل

### src/App.tsx (صفحة الأصناف)
استبدل بيانات `inventory_items` من localStorage بـ:
```typescript
const { data: items, loading, refetch } = useInventory({ search, category, status });
```
- بعد كل عملية إضافة/تعديل/حذف → استدعاء `refetch()`
- عرض `showSuccess('تم حفظ الصنف بنجاح')` بعد النجاح

### src/SalesInvoices.tsx
- ربط GET `/api/v1/sales` مع الفلاتر
- ربط POST `/api/v1/sales` لإنشاء فاتورة جديدة
- ربط PUT `/api/v1/sales/:id` للتعديل
- ربط DELETE `/api/v1/sales/:id` للإلغاء
- في نموذج إنشاء الفاتورة: جلب الأصناف من API (بحث حي)

### src/PurchaseInvoices.tsx
نفس SalesInvoices مع Suppliers

### src/Reports.tsx
```typescript
const { data: salesReport } = useQuery(() => reportsApi.getSales({ date_from, date_to }));
const { data: inventoryReport } = useQuery(() => reportsApi.getInventory());
```

### src/Warehouses.tsx
ربط CRUD كامل بـ `/api/v1/warehouses`

### src/Settings.tsx
- جلب الإعدادات من `GET /api/v1/settings`
- تحديث بـ `PUT /api/v1/settings`
- زر نسخ احتياطي → `POST /api/v1/settings/backup`

## الخطوة 5 — Toast Notifications

### src/context/ToastContext.tsx
```typescript
interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
}
```

### src/components/Toast.tsx
- إشعارات في الزاوية العلوية اليسرى (RTL)
- تختفي تلقائياً بعد 3 ثواني
- ألوان: green (success)، red (error)، amber (warning)

## قواعد الربط
- لا تزل كود localStorage القديم دفعةً واحدة — استبدله تدريجياً صفحة بصفحة
- اختبر كل صفحة بعد ربطها قبل الانتقال للتالية
- إذا فشل الـ API → عرض رسالة خطأ واضحة بالعربية
- تأكد أن Vite proxy يوجه `/api` → `http://localhost:3001`

## Vite Config للـ Proxy (vite.config.ts)
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    }
  }
}
```
