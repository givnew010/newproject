# خطة إعادة هيكلة التصميم — المُنسق
> نظام إدارة المخزون والمبيعات | React 19 + TypeScript + Tailwind CSS v4

---

## 📋 ملخص تنفيذي

المشروع الحالي يعمل بشكل صحيح وظيفياً، لكن التصميم موزّع بين 7 صفحات مستقلة (`Dashboard`, `App`, `SalesInvoices`, `PurchaseInvoices`, `Reports`, `Warehouses`, `Settings`) دون نظام تصميم موحّد. كل صفحة تعرّف ألوانها وأنماطها بشكل مستقل مما يؤدي إلى تباين بصري وصعوبة في الصيانة.

**الهدف:** إنشاء Design System مركزي يضمن توحيداً كاملاً في الألوان، الخطوط، المسافات، والـ Components عبر كامل التطبيق.

---

## 1. 🎨 نظام الألوان الموحّد

### الحالة الراهنة (المشكلة)
كل صفحة تستخدم Tailwind classes بشكل مباشر وغير متسق:
- `Dashboard.tsx` → `blue-600`, `indigo-500`, `purple-400`
- `SalesInvoices.tsx` → `emerald-500`, `green-600`
- `PurchaseInvoices.tsx` → `violet-500`, `purple-600`
- `Reports.tsx` → `amber-500`, `orange-400`
- لا يوجد مرجع مركزي للألوان

### الحل: Design Tokens في `src/styles/tokens.ts`

```typescript
// src/styles/tokens.ts

export const colors = {
  // ─── Primary Brand ───────────────────────────────────────
  primary: {
    50:  '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#1a56db',   // ← اللون الرئيسي للتطبيق (محدد في replit.md)
    700: '#1d4ed8',
    800: '#1e3a8a',
    900: '#1e3a8a',
    950: '#172554',
  },

  // ─── Sidebar ─────────────────────────────────────────────
  sidebar: {
    bg:         'from-blue-950 to-blue-900',  // gradient الـ sidebar
    text:       '#e2e8f0',
    textMuted:  '#94a3b8',
    hover:      'rgba(255,255,255,0.08)',
    active:     'rgba(255,255,255,0.15)',
    border:     'rgba(255,255,255,0.1)',
  },

  // ─── Section Themes (لكل قسم لونه المحدد في replit.md) ──
  sections: {
    inventory:  { primary: '#3b82f6', bg: 'blue-50',    badge: 'blue-100',   text: 'blue-700'   },
    sales:      { primary: '#10b981', bg: 'emerald-50', badge: 'emerald-100', text: 'emerald-700'},
    purchases:  { primary: '#8b5cf6', bg: 'violet-50',  badge: 'violet-100', text: 'violet-700' },
    reports:    { primary: '#f59e0b', bg: 'amber-50',   badge: 'amber-100',  text: 'amber-700'  },
    warehouses: { primary: '#06b6d4', bg: 'cyan-50',    badge: 'cyan-100',   text: 'cyan-700'   },
    settings:   { primary: '#64748b', bg: 'slate-50',   badge: 'slate-100',  text: 'slate-700'  },
    dashboard:  { primary: '#1a56db', bg: 'blue-50',    badge: 'blue-100',   text: 'blue-700'   },
  },

  // ─── Status Colors ────────────────────────────────────────
  status: {
    inStock:   { bg: 'emerald-100', text: 'emerald-700', dot: 'emerald-500' },
    lowStock:  { bg: 'amber-100',   text: 'amber-700',   dot: 'amber-500'   },
    outStock:  { bg: 'red-100',     text: 'red-700',     dot: 'red-500'     },
    paid:      { bg: 'emerald-100', text: 'emerald-700', dot: 'emerald-500' },
    partial:   { bg: 'amber-100',   text: 'amber-700',   dot: 'amber-500'   },
    unpaid:    { bg: 'red-100',     text: 'red-700',     dot: 'red-500'     },
  },

  // ─── Neutral / Background ─────────────────────────────────
  surface: {
    body:    '#f1f5f9',   // خلفية التطبيق الكاملة
    card:    '#ffffff',
    border:  '#e2e8f0',
    input:   '#f8fafc',
    overlay: 'rgba(15, 23, 42, 0.6)',
  },

  // ─── Text ─────────────────────────────────────────────────
  text: {
    primary:   '#0f172a',
    secondary: '#475569',
    muted:     '#94a3b8',
    inverse:   '#ffffff',
    link:      '#1a56db',
  },
} as const;

export const gradients = {
  sidebar:     'linear-gradient(180deg, #172554 0%, #1e3a8a 100%)',
  cardBlue:    'linear-gradient(135deg, #1a56db 0%, #3b82f6 100%)',
  cardEmerald: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  cardViolet:  'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
  cardAmber:   'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
  hero:        'linear-gradient(135deg, #1e3a8a 0%, #1a56db 50%, #3b82f6 100%)',
} as const;
```

### التطبيق في `tailwind.config.ts` أو CSS Variables

```css
/* src/index.css — أضف هذا في :root */
:root {
  --color-primary:        #1a56db;
  --color-primary-dark:   #1e3a8a;
  --color-primary-light:  #3b82f6;

  --color-surface:        #f1f5f9;
  --color-card:           #ffffff;
  --color-border:         #e2e8f0;

  --color-text-primary:   #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted:     #94a3b8;

  /* Section Accent Colors */
  --color-inventory:  #3b82f6;
  --color-sales:      #10b981;
  --color-purchases:  #8b5cf6;
  --color-reports:    #f59e0b;
  --color-warehouses: #06b6d4;
  --color-settings:   #64748b;
}
```

---

## 2. 🔤 نظام الخطوط الموحّد

### الحالة الراهنة (المشكلة)
- خلط بين `text-sm`, `text-base`, `text-lg` بدون نمط واضح
- بعض الصفحات تستخدم `font-semibold` للعناوين وأخرى `font-bold`
- لا يوجد Typography Scale موثق

### الحل: Typography Scale في `src/styles/typography.ts`

```typescript
// src/styles/typography.ts

export const typography = {
  // ─── Font Families ────────────────────────────────────────
  fonts: {
    arabic:  '"Cairo", "Segoe UI", system-ui, sans-serif',  // للنصوص العربية
    numbers: '"JetBrains Mono", "Fira Code", monospace',    // للأرقام والمبالغ
  },

  // ─── Font Sizes (Scale موحّد) ──────────────────────────────
  sizes: {
    xs:   '0.75rem',   // 12px — labels, badges
    sm:   '0.875rem',  // 14px — body text, table cells
    base: '1rem',      // 16px — default body
    lg:   '1.125rem',  // 18px — card titles, section headers
    xl:   '1.25rem',   // 20px — page subtitles
    '2xl':'1.5rem',    // 24px — page titles
    '3xl':'1.875rem',  // 30px — KPI numbers
    '4xl':'2.25rem',   // 36px — hero numbers
  },

  // ─── Font Weights ─────────────────────────────────────────
  weights: {
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
    extrabold:800,
  },

  // ─── Line Heights ─────────────────────────────────────────
  lineHeights: {
    tight:  1.25,
    normal: 1.5,
    relaxed:1.75,
  },
} as const;

// ─── Semantic Aliases (استخدام موحّد في المشروع) ──────────────────
export const textStyles = {
  pageTitle:     'text-2xl font-bold text-slate-800',
  sectionTitle:  'text-lg font-semibold text-slate-700',
  cardTitle:     'text-base font-semibold text-slate-700',
  bodyText:      'text-sm text-slate-600',
  mutedText:     'text-xs text-slate-400',
  kpiNumber:     'text-3xl font-extrabold font-mono',
  tableHeader:   'text-xs font-semibold text-slate-500 uppercase tracking-wider',
  tableCell:     'text-sm text-slate-700',
  badgeText:     'text-xs font-medium',
  labelText:     'text-sm font-medium text-slate-700',
  errorText:     'text-xs text-red-500',
  linkText:      'text-sm font-medium text-blue-600 hover:text-blue-700',
} as const;
```

---

## 3. 📐 نظام المسافات والـ Layout

### الحالة الراهنة (المشكلة)
- فجوات متفاوتة: `gap-3`, `gap-4`, `gap-6` بدون منطق واضح
- padding مختلف في كل بطاقة: `p-4`, `p-5`, `p-6`
- border-radius غير متسق: `rounded-lg`, `rounded-xl`, `rounded-2xl`

### الحل: Spacing System

```typescript
// src/styles/spacing.ts

export const spacing = {
  // ─── Component Internal Padding ──────────────────────────
  card: {
    sm:  'p-4',       // بطاقات صغيرة (stat mini cards)
    md:  'p-5',       // بطاقات متوسطة (KPI cards)
    lg:  'p-6',       // بطاقات كبيرة (main content cards)
  },
  modal: {
    header: 'px-6 py-4',
    body:   'px-6 py-5',
    footer: 'px-6 py-4',
  },
  table: {
    header: 'px-4 py-3',
    cell:   'px-4 py-3',
  },
  input:  'px-3 py-2',
  button: {
    sm:  'px-3 py-1.5',
    md:  'px-4 py-2',
    lg:  'px-5 py-2.5',
  },

  // ─── Layout Gaps ─────────────────────────────────────────
  gap: {
    xs:  'gap-2',
    sm:  'gap-3',
    md:  'gap-4',
    lg:  'gap-6',
    xl:  'gap-8',
  },

  // ─── Border Radius ────────────────────────────────────────
  radius: {
    sm:   'rounded',       // 4px  — inputs, tags
    md:   'rounded-lg',    // 8px  — buttons, badges
    lg:   'rounded-xl',    // 12px — cards, modals
    xl:   'rounded-2xl',   // 16px — KPI cards, hero sections
    full: 'rounded-full',  // pills, avatars
  },
} as const;
```

---

## 4. 🧩 مكتبة الـ Components الموحّدة

### الملفات المطلوب إنشاؤها في `src/components/ui/`

```
src/
  components/
    ui/
      Button.tsx          ← زر موحّد بجميع variants
      Badge.tsx           ← شارة الحالة (in-stock, paid, etc.)
      Card.tsx            ← بطاقة المحتوى
      KPICard.tsx         ← بطاقة مؤشر الأداء (gradient)
      Modal.tsx           ← نافذة منبثقة موحّدة
      Table.tsx           ← جدول البيانات
      Input.tsx           ← حقل الإدخال
      Select.tsx          ← قائمة الاختيار
      Textarea.tsx        ← حقل النص المتعدد
      PageHeader.tsx      ← ترويسة الصفحة
      SectionTitle.tsx    ← عنوان القسم
      LoadingSpinner.tsx  ← مؤشر التحميل
      EmptyState.tsx      ← حالة البيانات الفارغة
      SearchBar.tsx       ← شريط البحث
      ActionMenu.tsx      ← قائمة الإجراءات (edit/delete)
      StatusDot.tsx       ← نقطة الحالة الملونة
      Divider.tsx         ← فاصل
```

---

### 4.1 Button Component

```tsx
// src/components/ui/Button.tsx

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize    = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
  danger:    'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  ghost:     'hover:bg-slate-100 text-slate-600',
  outline:   'border border-slate-300 hover:bg-slate-50 text-slate-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2.5',
};

// الاستخدام:
// <Button variant="primary" size="md" icon={<PlusIcon />}>إضافة صنف</Button>
// <Button variant="danger" size="sm">حذف</Button>
// <Button variant="ghost" size="sm" icon={<EditIcon />}>تعديل</Button>
```

### 4.2 Badge Component

```tsx
// src/components/ui/Badge.tsx

type BadgeVariant = 'emerald' | 'amber' | 'red' | 'blue' | 'violet' | 'slate';

// يستبدل كل حالات الـ status badges المتفرقة في المشروع
// الاستخدام:
// <Badge variant="emerald">متوفر</Badge>
// <Badge variant="amber">كمية منخفضة</Badge>
// <Badge variant="red">نفد المخزون</Badge>
```

### 4.3 KPICard Component

```tsx
// src/components/ui/KPICard.tsx

// يوحّد بطاقات الإحصاءات في Dashboard.tsx و Reports.tsx
// Props:
interface KPICardProps {
  title:     string;
  value:     string | number;
  subtitle?: string;
  icon:      ReactNode;
  gradient:  'blue' | 'emerald' | 'violet' | 'amber' | 'cyan';
  trend?:    { value: number; direction: 'up' | 'down' };
}
// الاستخدام:
// <KPICard title="إجمالي المبيعات" value="45,230 ر.س" icon={<TrendingUp />} gradient="emerald" />
```

### 4.4 Modal Component

```tsx
// src/components/ui/Modal.tsx

// يوحّد جميع النوافذ المنبثقة في:
// - SalesInvoices.tsx (إنشاء/تعديل فاتورة)
// - PurchaseInvoices.tsx
// - Warehouses.tsx
// - App.tsx (إضافة/تعديل صنف)
// Props:
interface ModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  title:    string;
  size?:    'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?:  ReactNode;
}
```

### 4.5 PageHeader Component

```tsx
// src/components/ui/PageHeader.tsx

// يوحّد ترويسة كل صفحة
// Props:
interface PageHeaderProps {
  title:       string;
  subtitle?:   string;
  icon:        ReactNode;
  accentColor: 'blue' | 'emerald' | 'violet' | 'amber' | 'cyan' | 'slate';
  actions?:    ReactNode;    // أزرار العمليات (إضافة، تصدير، إلخ)
  breadcrumb?: string[];
}

// الاستخدام في SalesInvoices.tsx:
// <PageHeader
//   title="فواتير المبيعات"
//   subtitle="إدارة ومتابعة فواتير البيع"
//   icon={<ShoppingCart />}
//   accentColor="emerald"
//   actions={<Button variant="primary" icon={<Plus />}>فاتورة جديدة</Button>}
// />
```

---

## 5. 🏗 هيكل الملفات المقترح

```
src/
├── components/
│   ├── ui/                      ← 🆕 مكتبة UI الموحّدة
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── KPICard.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── PageHeader.tsx
│   │   ├── SectionTitle.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── SearchBar.tsx
│   │   ├── ActionMenu.tsx
│   │   ├── StatusDot.tsx
│   │   ├── Divider.tsx
│   │   └── index.ts            ← barrel export
│   └── layout/                  ← 🆕 مكونات الـ Layout
│       ├── Sidebar.tsx          ← مستخرج من App.tsx
│       ├── Header.tsx           ← مستخرج من App.tsx
│       └── AppShell.tsx         ← الهيكل الكلي للتطبيق
├── styles/                      ← 🆕 نظام التصميم
│   ├── tokens.ts                ← الألوان، الـ Gradients
│   ├── typography.ts            ← الخطوط والأحجام
│   ├── spacing.ts               ← المسافات والـ Radius
│   └── theme.ts                 ← تجميع كل الـ tokens
├── hooks/                       ← 🆕 Custom Hooks مستخرجة
│   ├── useInventory.ts          ← منطق المخزون
│   ├── useSalesInvoices.ts
│   ├── usePurchaseInvoices.ts
│   └── useLocalStorage.ts
├── App.tsx                      ← يُبقى لكن يُبسَّط
├── Dashboard.tsx
├── SalesInvoices.tsx
├── PurchaseInvoices.tsx
├── Reports.tsx
├── Warehouses.tsx
├── Settings.tsx
├── types.ts
├── main.tsx
└── index.css                    ← يحتوي CSS Variables + Tailwind
```

---

## 6. 📋 خطة التنفيذ المرحلية

### المرحلة 1 — Foundation (الأساس) | الأولوية: عالية جداً ⚡

| # | المهمة | الملف | الوقت المقدر |
|---|--------|-------|--------------|
| 1 | إنشاء `src/styles/tokens.ts` بالألوان الكاملة | جديد | 1 ساعة |
| 2 | تحديث `src/index.css` بـ CSS Variables | index.css | 30 دقيقة |
| 3 | إنشاء `src/styles/typography.ts` | جديد | 45 دقيقة |
| 4 | إنشاء `src/styles/spacing.ts` | جديد | 30 دقيقة |

### المرحلة 2 — Core Components | الأولوية: عالية ⚠️

| # | المهمة | الملف | الوقت المقدر |
|---|--------|-------|--------------|
| 5 | بناء `Button.tsx` مع جميع variants | جديد | 1 ساعة |
| 6 | بناء `Badge.tsx` لحالات المخزون والفواتير | جديد | 45 دقيقة |
| 7 | بناء `Modal.tsx` موحّد | جديد | 1.5 ساعة |
| 8 | بناء `PageHeader.tsx` | جديد | 1 ساعة |
| 9 | بناء `KPICard.tsx` | جديد | 1 ساعة |

### المرحلة 3 — Layout Extraction | الأولوية: متوسطة

| # | المهمة | الملف | الوقت المقدر |
|---|--------|-------|--------------|
| 10 | استخراج `Sidebar.tsx` من `App.tsx` | App.tsx | 1 ساعة |
| 11 | استخراج `Header.tsx` من `App.tsx` | App.tsx | 45 دقيقة |
| 12 | إنشاء `AppShell.tsx` للهيكل الكلي | جديد | 30 دقيقة |

### المرحلة 4 — Page Refactoring | الأولوية: متوسطة

| # | المهمة | الملف | الوقت المقدر |
|---|--------|-------|--------------|
| 13 | تحديث `Dashboard.tsx` باستخدام `KPICard` و `PageHeader` | Dashboard.tsx | 1 ساعة |
| 14 | تحديث `SalesInvoices.tsx` | SalesInvoices.tsx | 1.5 ساعة |
| 15 | تحديث `PurchaseInvoices.tsx` | PurchaseInvoices.tsx | 1.5 ساعة |
| 16 | تحديث `Reports.tsx` | Reports.tsx | 1 ساعة |
| 17 | تحديث `Warehouses.tsx` | Warehouses.tsx | 1 ساعة |
| 18 | تحديث `Settings.tsx` | Settings.tsx | 45 دقيقة |

### المرحلة 5 — Form Components | الأولوية: منخفضة

| # | المهمة | الملف | الوقت المقدر |
|---|--------|-------|--------------|
| 19 | بناء `Input.tsx`, `Select.tsx`, `Textarea.tsx` | جديد | 1.5 ساعة |
| 20 | تحديث جميع النماذج (Forms) في المشروع | متعدد | 2 ساعة |

---

## 7. 🔧 مشاكل التصميم الحالية المحددة

### 7.1 تعدد أنماط الأزرار (Button Inconsistency)

**المشكلة:** يوجد على الأقل 6 أنماط مختلفة للأزرار في المشروع:
```html
<!-- في Dashboard.tsx -->
<button class="bg-blue-600 text-white px-4 py-2 rounded-lg">...</button>

<!-- في SalesInvoices.tsx -->
<button class="bg-emerald-500 text-white px-3 py-1.5 rounded-md">...</button>

<!-- في App.tsx -->
<button class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm">...</button>
```
**الحل:** استخدام `<Button variant="primary">` موحّد في كل مكان.

### 7.2 تعدد أنماط الـ Modals

**المشكلة:** كل صفحة تبني النافذة المنبثقة بشكل مستقل مع اختلاف في:
- حجم الـ overlay
- padding الهيكل الداخلي
- طريقة عرض العنوان
- أزرار الإغلاق

**الحل:** Component واحد `<Modal>` يُستخدم في كل صفحة.

### 7.3 تعدد أنماط الـ Status Badges

**المشكلة:**
```html
<!-- في App.tsx (المخزون) -->
<span class="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">متوفر</span>

<!-- في SalesInvoices.tsx (الفواتير) -->
<span class="px-2 py-1 text-xs rounded-md bg-green-100 text-green-800">مدفوعة</span>
```
نفس الحالة (متوفر/مدفوع) لكن بـ classes مختلفة: `rounded-full` vs `rounded-md`، `py-0.5` vs `py-1`.

**الحل:** `<Badge variant="emerald">متوفر</Badge>` موحّد.

### 7.4 تباين ترويسات الصفحات

**المشكلة:** كل صفحة تبني ترويستها بشكل مختلف:
- بعضها يضع الأيقونة يسار العنوان
- بعضها يضع الوصف بأحجام نص مختلفة
- بعضها يضع الأزرار في مكان مختلف

**الحل:** `<PageHeader>` موحّد لكل الصفحات.

---

## 8. 🎯 معايير قياس النجاح

بعد الانتهاء من إعادة الهيكلة، يجب أن يتحقق التالي:

- [ ] **لا يوجد لون مكرر:** كل الألوان تأتي من `tokens.ts` فقط
- [ ] **زر واحد:** جميع الأزرار في المشروع تستخدم `<Button>` component
- [ ] **modal واحد:** جميع النوافذ المنبثقة تستخدم `<Modal>` component  
- [ ] **badge واحد:** جميع شارات الحالة تستخدم `<Badge>` component
- [ ] **pageHeader واحد:** كل صفحة تستخدم `<PageHeader>` component
- [ ] **لا يوجد inline color:** لا يوجد `#hex` مباشرة في ملفات TSX
- [ ] **اتساق الـ border-radius:** فقط `rounded-lg` للبطاقات، `rounded-full` للـ badges
- [ ] **اتساق الخطوط:** فقط `font-semibold` للعناوين، `font-medium` للـ labels

---

## 9. 📦 ملف التصدير المركزي

```typescript
// src/components/ui/index.ts
export { Button }        from './Button';
export { Badge }         from './Badge';
export { Card }          from './Card';
export { KPICard }       from './KPICard';
export { Modal }         from './Modal';
export { Table }         from './Table';
export { Input }         from './Input';
export { Select }        from './Select';
export { Textarea }      from './Textarea';
export { PageHeader }    from './PageHeader';
export { SectionTitle }  from './SectionTitle';
export { LoadingSpinner} from './LoadingSpinner';
export { EmptyState }    from './EmptyState';
export { SearchBar }     from './SearchBar';
export { ActionMenu }    from './ActionMenu';
export { StatusDot }     from './StatusDot';

// الاستخدام في أي صفحة:
// import { Button, Badge, Modal, KPICard, PageHeader } from '@/components/ui';
```

---

## 10. 📝 ملاحظات إضافية

### الـ RTL (اليمين لليسار)
المشروع عربي بالكامل، يجب التأكد من:
- `dir="rtl"` موجود في `<html>` (محدد في `main.tsx` ✅)
- جميع الـ margins/paddings تعمل صح مع RTL
- استخدام `ms-` و `me-` بدلاً من `ml-` و `mr-` في Tailwind للاستجابة لـ RTL
- الأيقونات في الأزرار تظهر في الجانب الصحيح

### الـ Animations
المشروع يستخدم `motion` (Framer Motion). يجب توحيد:
- مدة الـ animation: `duration: 0.2` للتفاعلات السريعة، `duration: 0.4` لظهور الصفحات
- نوع الـ easing: `ease: [0.25, 0.1, 0.25, 1]` (ease-out)
- تأثيرات الـ hover تكون `scale: 1.02` فقط وليس أكثر

### الـ Responsive
حالياً المشروع ليس fully responsive. عند إعادة الهيكلة يُنصح بإضافة:
- Sidebar يتحول لـ drawer في الشاشات الصغيرة
- الجداول تتحول لـ cards في الموبايل
- Grid الـ KPI cards يتغير من 4 أعمدة → 2 أعمدة → 1 عمود

---

*تاريخ إنشاء الخطة: أبريل 2026 | المشروع: المُنسق v1.0*
