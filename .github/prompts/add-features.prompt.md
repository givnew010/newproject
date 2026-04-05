---
mode: agent
description: إضافة ميزات متقدمة — عملاء، موردون، طباعة فواتير، audit log
---

# إضافة الميزات المتقدمة

## الميزة 1 — صفحة العملاء (src/Customers.tsx)

أنشئ صفحة جديدة `src/Customers.tsx` بالثيم الأخضر/زمردي:

### المحتوى
- جدول العملاء مع: الاسم، الهاتف، الرصيد، عدد الفواتير، حالة النشاط
- فلترة بـ: بحث نصي، has_balance (ذمم فقط)
- Modal إضافة/تعديل عميل: name، phone، email، address، credit_limit
- زر "كشف الحساب" يفتح modal يعرض كل المعاملات
- زر "فواتيره" يعرض فواتير العميل
- Soft delete (تعطيل وليس حذف)

### الربط بالـ API
```typescript
const { data: customers, refetch } = useQuery(() => customersApi.getAll({ search, has_balance }));
```

## الميزة 2 — صفحة الموردين (src/Suppliers.tsx)

أنشئ `src/Suppliers.tsx` بالثيم البرتقالي:
- نفس هيكل Customers مع خصوصية الموردين
- كشف حساب المورد (ما ندفعه لهم)

## الميزة 3 — نظام الطباعة (src/components/InvoicePrint.tsx)

أنشئ مكون `InvoicePrint` لطباعة فواتير احترافية:

### القالب يشمل
- رأس الفاتورة: شعار/اسم الشركة، العنوان، رقم الضريبة (من الإعدادات)
- بيانات العميل/المورد
- رقم الفاتورة والتاريخ والاستحقاق
- جدول الأصناف: الاسم، الكمية، الوحدة، سعر الوحدة، الخصم، الإجمالي
- ملخص: المجموع الفرعي، الخصم، الضريبة 15%، الإجمالي الكلي
- المبلغ المدفوع والمتبقي
- ملاحظات الفاتورة

### CSS للطباعة
```css
@media print {
  .no-print { display: none !important; }
  .invoice-print { background: white !important; color: black !important; }
  @page { margin: 15mm; }
}
```

### زر الطباعة
```typescript
const handlePrint = () => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(invoiceHTML);
  printWindow.print();
};
```

أضف زر الطباعة في:
- صفحة تفاصيل كل فاتورة بيع
- صفحة تفاصيل كل فاتورة شراء

## الميزة 4 — Toast Notifications

إذا لم تكن مُنشأة بعد، أنشئ:

### src/context/ToastContext.tsx
```typescript
export const ToastContext = createContext<ToastContextType | null>(null);
```

### src/components/Toast.tsx
- إشعارات متحركة (Framer Motion) تظهر من اليمين
- أيقونات: ✓ (success)، ✗ (error)، ⚠ (warning)
- تختفي بعد 3 ثواني مع شريط تقدم
- يمكن إغلاقها يدوياً

## الميزة 5 — تنبيهات المخزون المنخفض

في `src/App.tsx` في الـ header:

```typescript
// polling كل دقيقة
useEffect(() => {
  const fetchAlerts = async () => {
    const alerts = await inventoryApi.getAlerts();
    setLowStockCount(alerts.length);
  };
  fetchAlerts();
  const interval = setInterval(fetchAlerts, 60000);
  return () => clearInterval(interval);
}, []);
```

- Badge أحمر بعدد الأصناف المنخفضة على أيقونة التنبيه في الـ header
- Dropdown يعرض أسماء الأصناف + كمياتها الحالية
- رابط "عرض الكل" يذهب لصفحة الأصناف مع فلتر status=low_stock

## الميزة 6 — سجل العمليات (Audit Log)

### إضافة للـ Backend
في كل route يعدل/يحذف بيانات:
```typescript
logAudit(req.user.userId, 'UPDATE', 'inventory_item', id, oldData, newData);
```

### إضافة لـ Settings.tsx
تبويب جديد "سجل العمليات" يعرض:
- الوقت والتاريخ
- اسم المستخدم
- نوع العملية (إضافة/تعديل/حذف)
- الكيان المتأثر (صنف/فاتورة/...)
- بيانات قبل وبعد التعديل

```typescript
const { data: logs } = useQuery(() => fetch('/api/v1/audit-logs').then(r => r.json()));
```

## إضافة الصفحات الجديدة للـ Navigation

في `src/App.tsx`، أضف للـ sidebar:
```typescript
{ key: 'customers', label: 'العملاء', icon: Users, color: 'emerald' },
{ key: 'suppliers', label: 'الموردون', icon: Building2, color: 'orange' },
```

وفي الـ router:
```tsx
{activeSection === 'customers' && <Customers />}
{activeSection === 'suppliers' && <Suppliers />}
```
