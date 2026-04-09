---
name: "design-system-instructions"
description: "Use when: refactor UI, standardize design tokens, colors, typography, spacing, and components. Triggers: tokens.ts, typography.ts, spacing.ts, src/components/ui, src/styles, index.css, tailwind.config.ts. Applies to UI source files only."
applyTo:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "src/styles/**"
  - "src/components/**"
  - "index.css"
  - "tailwind.config.ts"
---

# Design System — Workspace Instructions

Purpose: هذه التعليمات توجه الوكيل لإعادة هيكلة التصميم في المشروع طبقاً لخطة `attached_assets/design-restructure-plan.md`.

Use when: أي مهمة تتعلق بتوحيد الألوان، الخطوط، المسافات، أو عند إنشاء/تعديل مكونات واجهة المستخدم في `src/components/ui/`.

Key enforcement rules (apply automatically when refactoring UI files):

- Colors & Tokens:
  - لا تضف ألوان `#hex` داخل ملفات `.tsx` أو `.ts` أو داخل CSS الخاص بالمكونات؛ استخدم `src/styles/tokens.ts` أو متغيرات CSS في `src/index.css`.
  - لإضافة لون جديد، أضفه فقط إلى `src/styles/tokens.ts` و(بعد الموافقة) إلى `tailwind.config.ts` إذا لزم الأمر.

- Typography:
  - استعمل الأنماط الموثقة في `src/styles/typography.ts` (semantic aliases مثل `pageTitle`, `bodyText`).
  - اتّساق الأوزان: `font-semibold` للعناوين، `font-medium` للـ labels.

- Spacing & Radius:
  - استعمل `src/styles/spacing.ts` بدلًا من فوضى `p-4 / p-5 / p-6` في الملفات.
  - البطاقات: `rounded-lg`. Badges: `rounded-full`.

- Components:
  - استبدل الأنماط المكررة بمكونات تحت `src/components/ui/` (الحد الأدنى: `Button`, `Badge`, `Modal`, `PageHeader`, `KPICard`, `Card`).
  - كل مكون جديد يجب أن يُدرج في `src/components/ui/index.ts` للتصدير المركزي.

- Modals & Badges:
  - استخدم مكون `Modal` موحّد لجميع النوافذ المنبثقة.
  - استخدم `Badge` variant المرتبط بـ `tokens.status.*` لشارات الحالة.

- RTL & Accessibility:
  - احترم `dir="rtl"` في المشروع؛ استخدم `ms-`/`me-` في Tailwind عند تعديل الهوامش.
  - تأكد من تباين الألوان (WCAG AA) عند إضافة ألوان جديدة.

- Animations:
  - التزم بالمقاييس: تفاعلات سريعة `duration: 0.2`, ظهور صفحات `duration: 0.4`, easing `ease: [0.25,0.1,0.25,1]`.

Transformation checklist (when refactoring a page):

1. لاحظ واستبدل كل ألوان hex و raw Tailwind color classes بـ tokens في `src/styles/tokens.ts`.
2. استبدل العناصر `<button>` المباشرة بمكون `<Button variant="..." size="..."/>`.
3. استبدل spans/shards الحالة بمكون `<Badge variant="...">`.
4. وفّر spacing aliases من `src/styles/spacing.ts` بدلاً من حالات padding المتكررة.
5. أضف/حدّث `src/components/ui/index.ts` لتصدير أي مكون جديد.
6. قم بفحص نهائي للتأكد من معايير النجاح (Success Criteria).

Success Criteria (required before closing a refactor task):

- لا توجد نصوص `#hex` للألوان داخل `src/`.
- جميع الأزرار في الصفحات المعاد هيكلتها تستخدم `Button` الموحد.
- جميع النوافذ المنبثقة تستخدم `Modal` الموحد.
- جميع شارات الحالة تستخدم `Badge` الموحد.
- `src/components/ui/index.ts` يصدر المكونات الأساسية.
- Typography يستخدم aliases من `src/styles/typography.ts`.

Examples (Before → After):

Before:

```
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg">إضافة</button>
```

After:

```
import { Button } from 'src/components/ui'
<Button variant="primary" size="md">إضافة</Button>
```

Before:

```
<span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">متوفر</span>
```

After:

```
import { Badge } from 'src/components/ui'
<Badge variant="emerald">متوفر</Badge>
```

Notes & next steps (recommended):

- Foundation files to create/update: `src/styles/tokens.ts`, `src/styles/typography.ts`, `src/styles/spacing.ts`, and `src/index.css` (CSS variables).
- Component scaffolding: `src/components/ui/{Button,Badge,Modal,PageHeader,KPICard,Card}` + `index.ts`.
- Decision needed: Enforcement strictness — ban new Tailwind color classes in feature files (strict) OR allow them during prototyping (lenient). Specify preference before bulk automated edits.

Suggested prompts to invoke these instructions:

- "Refactor Dashboard.tsx to use the design system (strict)."
- "Scaffold core UI components and export them."
- "Scan `src/` for inline hex colors and propose token mappings."

Questions for you:

1. Should enforcement be `strict` (ban raw Tailwind color classes) or `lenient` (allow during prototyping)?
2. May the agent propose edits to `tailwind.config.ts`, or should config changes be staged separately?

-- end of instructions --
