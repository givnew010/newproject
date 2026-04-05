# تعليمات مشروع المُنسق — نظام إدارة المخزون والمبيعات

## نظرة عامة على المشروع
المُنسق هو نظام متكامل لإدارة المخزون والمبيعات والمشتريات مبني بـ:
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Framer Motion
- **Backend**: Express.js + SQLite (better-sqlite3) + JWT Authentication
- **اللغة**: عربي كامل (RTL)، خط Cairo

## القواعد العامة

### اللغة والترميز
- جميع متغيرات الـ TypeScript وتعليقات الكود بالإنجليزية
- جميع النصوص الظاهرة للمستخدم بالعربية الفصحى
- اتجاه الصفحة RTL دائماً
- استخدم دائماً `dir="rtl"` في HTML وخاصية `direction: rtl` في CSS

### TypeScript
- استخدم TypeScript الصارم (strict mode) دائماً
- لا تستخدم `any` — استخدم أنواعاً صريحة أو `unknown`
- ضع الأنواع المشتركة في `src/types.ts` (frontend) أو `server/types.ts` (backend)
- استخدم Zod للتحقق من بيانات الـ API في الـ server

### هيكل المشروع
```
/
├── .github/           ← ملفات تكوين Copilot (هذا المجلد)
├── src/               ← React Frontend
│   ├── lib/api.ts     ← API client مركزي
│   ├── hooks/         ← Custom React hooks
│   ├── context/       ← React Context (Auth, Toast)
│   ├── components/    ← مكونات مشتركة قابلة لإعادة الاستخدام
│   └── *.tsx          ← صفحات التطبيق الرئيسية
├── server/            ← Express Backend
│   ├── index.ts       ← نقطة دخول Express
│   ├── db.ts          ← اتصال SQLite وإنشاء الجداول
│   ├── middleware/    ← auth.ts, errorHandler.ts
│   ├── routes/        ← route handlers منظمة حسب الكيان
│   └── schemas/       ← Zod schemas للتحقق
└── package.json
```

## قواعد الـ Backend (server/)

### Express + SQLite
- استخدم `better-sqlite3` وليس `sqlite3` (متزامن وأسرع)
- **كل عملية تعدل بيانات متعددة يجب أن تكون داخل `db.transaction()`**
- استخدم `db.prepare()` دائماً — لا تبني SQL بالنص مباشرةً (SQL injection)
- عند إضافة فاتورة بيع: خصم المخزون + تسجيل في stock_movements داخل transaction واحدة
- عند إضافة فاتورة شراء: زيادة المخزون + تحديث cost_price بالمتوسط المرجح

### نمط الـ Routes
```typescript
// ✅ الأسلوب الصحيح
router.get('/', authenticate, (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM inventory_items WHERE is_active = 1').all();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});
```

### استجابات الـ API
- النجاح: `{ success: true, data: ... }`
- الخطأ: `{ success: false, message: '...' }` مع كود HTTP مناسب
- القوائم: `{ success: true, data: [...], total, page, totalPages }`
- كل رسائل الخطأ بالعربية

### المصادقة (Authentication)
- جميع routes (عدا /api/v1/auth/login) تتطلب `authenticate` middleware
- استخدم `checkRole('admin')` لحماية عمليات الإدارة
- الـ JWT يحتوي: `{ userId, username, role }` مع انتهاء 24 ساعة

## قواعد الـ Frontend (src/)

### React + TypeScript
- استخدم functional components مع hooks فقط — لا class components
- كل component له ملف `.tsx` خاص به
- استخدم `useApi` hook للتعامل مع الـ API — لا تستخدم fetch مباشرةً في المكونات
- استخدم `AuthContext` للوصول للمستخدم الحالي

### نمط API Calls
```typescript
// ✅ الأسلوب الصحيح - استخدم hooks
const { data, loading, error, refetch } = useInventory();

// ❌ الأسلوب الخاطئ - لا تستخدم fetch مباشرةً
const [items, setItems] = useState([]);
useEffect(() => { fetch('/api/...').then(...) }, []);
```

### التصميم والألوان
- **Primary**: `#1a56db` (bright blue)
- **Sidebar**: تدرج `blue-950 → blue-900` (navy dark)
- **الأصناف**: ثيم أزرق | **المبيعات**: ثيم زمردي | **المشتريات**: ثيم بنفسجي | **التقارير**: ثيم كهرماني
- حالات المخزون: `emerald` (كافٍ)، `amber` (منخفض)، `red` (نفد)
- لا تستخدم Tailwind classes خارج القائمة المتاحة (لا compiler)

### المكونات
- استخدم `ToastContext` لإشعارات النجاح والخطأ — لا `alert()`
- كل العمليات تظهر skeleton loader أثناء التحميل
- الـ modals لإنشاء/تعديل البيانات تُغلق تلقائياً بعد النجاح

## localStorage Keys (البيانات القديمة)
```
inventory_items    → Array<InventoryItem>
purchase_invoices  → Array<PurchaseInvoice>
sales_invoices     → Array<SalesInvoice>
warehouses         → Array<Warehouse>
app_settings       → AppSettings
```
> ملاحظة: هذه مرحلة انتقالية — نهدف لاستبدال localStorage بالـ API الحقيقي

## ترقيم الفواتير
- فواتير البيع: `INV-2026-0001` (متسلسل)
- فواتير الشراء: `PO-2026-0001` (متسلسل)
- الأصناف: `ITM-XXXX` (إذا لم يُدخَل sku يدوياً)

## أولويات العمل
1. 🔴 **عاجل**: Backend API (المراحل 1-8) + Auth + ربط الـ Frontend
2. 🟡 **مهم**: ربط باقي صفحات الـ Frontend بالـ API الحقيقي
3. 🟢 **تحسين**: ميزات متقدمة (طباعة، audit log، toast notifications)
