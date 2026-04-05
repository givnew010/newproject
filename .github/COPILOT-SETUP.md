# دليل استخدام تكوين GitHub Copilot — مشروع المُنسق

## نظرة عامة على هيكل الملفات

```
.github/
├── copilot-instructions.md          ← تعليمات عامة (تُطبَّق دائماً)
│
├── instructions/                    ← تعليمات موجهة حسب نوع الملف
│   ├── backend.instructions.md      ← تُطبَّق على server/**/*.ts
│   ├── frontend.instructions.md     ← تُطبَّق على src/**/*.tsx
│   └── database.instructions.md     ← تُطبَّق على server/db.ts
│
├── prompts/                         ← مهام جاهزة للتنفيذ (slash commands)
│   ├── build-backend.prompt.md      ← /build-backend
│   ├── connect-frontend.prompt.md   ← /connect-frontend
│   ├── add-features.prompt.md       ← /add-features
│   ├── execute-task.prompt.md       ← /execute-task
│   └── review-and-test.prompt.md    ← /review-and-test
│
├── agents/                          ← وكلاء متخصصون
│   ├── backend-builder.agent.md     ← @backend-builder
│   ├── frontend-builder.agent.md    ← @frontend-builder
│   └── code-reviewer.agent.md       ← @code-reviewer
│
├── skills/                          ← مهارات تُحمَّل تلقائياً
│   ├── backend-setup/SKILL.md       ← إعداد البيئة من الصفر
│   ├── sqlite-api/SKILL.md          ← أنماط SQLite API
│   ├── frontend-connect/SKILL.md    ← ربط Frontend بالـ API
│   └── invoice-logic/SKILL.md       ← منطق الفواتير والمخزون
│
└── hooks/
    └── almunsiq.hooks.json          ← hooks تشغيل تلقائي
```

---

## طريقة الاستخدام في VS Code

### 1. تشغيل مهمة جاهزة (Prompt Files)

افتح Copilot Chat واكتب:

```
/build-backend        ← لبناء الـ Backend الكامل
/connect-frontend     ← لربط React بالـ API
/add-features         ← لإضافة ميزات متقدمة
/execute-task         ← لتنفيذ مهمة محددة برقمها
/review-and-test      ← لمراجعة الكود وإنشاء اختبارات
```

### 2. استخدام وكيل متخصص (Custom Agents)

```
@backend-builder  أضف endpoint للتقارير الشهرية
@frontend-builder  أنشئ صفحة العملاء بثيم أخضر
@code-reviewer  راجع ملف server/routes/sales.ts
```

### 3. المهارات تُحمَّل تلقائياً

عندما تطلب من Copilot:
- "أعدّ قاعدة البيانات" → يحمّل `backend-setup` skill
- "أضف API endpoint" → يحمّل `sqlite-api` skill
- "اربط الصفحة بالـ API" → يحمّل `frontend-connect` skill
- "أضف فاتورة بيع جديدة" → يحمّل `invoice-logic` skill

---

## الترتيب المقترح للبناء

### أسبوع 1 — البنية التحتية
```
1. /build-backend   ← الخطوات 1-3 (env + db + auth)
2. اختبار: curl POST /api/v1/auth/login
```

### أسبوع 2 — الـ APIs الأساسية
```
/execute-task 4-1   ← Inventory list
/execute-task 4-2   ← Inventory create
/execute-task 4-3   ← Inventory update/delete
/execute-task 4-5   ← Warehouses
/execute-task 5-1   ← Customers
/execute-task 5-3   ← Suppliers
```

### أسبوع 3 — الفواتير (الأهم)
```
/execute-task 6-1   ← Sales list
/execute-task 6-2   ← Sales create (⭐ الأصعب)
/execute-task 6-4   ← Sales payments
/execute-task 7-2   ← Purchases create
/execute-task 8-1   ← Dashboard report
```

### أسبوع 4 — ربط Frontend
```
/connect-frontend   ← كل الخطوات
```

### أسبوع 5 — الميزات المتقدمة
```
/add-features       ← العملاء + الموردون + الطباعة + التنبيهات
```

---

## ملاحظات مهمة

### بيانات الدخول الافتراضية
```
Username: admin
Password: admin123
```

### المنافذ
```
Frontend (Vite): http://localhost:5000
Backend (Express): http://localhost:3001
```

### تشغيل المشروع
```bash
# الـ server والـ frontend معاً
npm run dev

# أو منفصلَين
npm run dev:server   # terminal 1
npx vite             # terminal 2
```

### اختبار الـ API مباشرةً
```bash
# تسجيل الدخول
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');console.log(JSON.parse(d).data.token)")

# جلب الأصناف
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/inventory
```

---

## التحقق من الجودة

```bash
# TypeScript check
npx tsc --noEmit

# ESLint
npx eslint src/ server/ --ext .ts,.tsx

# Build test
npm run build
```
