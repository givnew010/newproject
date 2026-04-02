# 🔐 المرحلة 3 — Auth API: دليل التثبيت والاختبار

## الملفات المُنجزة

```
server/
├── index.ts                  ← نقطة دخول Express (محدَّث)
├── db.ts                     ← قاعدة البيانات (من المرحلة 2)
├── types.ts                  ← أنواع TypeScript المشتركة
├── middleware/
│   └── auth.ts               ← verifyToken + checkRole + generateToken
└── routes/
    ├── auth.ts               ← POST /login, GET /me, POST /logout
    └── users.ts              ← CRUD كامل للمستخدمين (admin فقط)
```

---

## 1. تثبيت الحزم المطلوبة

```bash
npm install better-sqlite3 bcryptjs jsonwebtoken cors
npm install -D @types/better-sqlite3 @types/bcryptjs @types/jsonwebtoken @types/cors
```

---

## 2. إضافة Scripts في package.json

```json
{
  "scripts": {
    "dev":        "vite",
    "server":     "tsx server/index.ts",
    "server:dev": "tsx watch server/index.ts"
  }
}
```

---

## 3. إضافة Proxy في vite.config.ts

```typescript
server: {
  host: "0.0.0.0",
  port: 5000,
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true,
    },
  },
}
```

---

## 4. إضافة JWT_SECRET في .env

```env
JWT_SECRET=your-super-secret-key-change-this-in-production
NODE_ENV=development
```

---

## 5. تشغيل السيرفر

```bash
# في terminal أول: الـ Backend
npm run server:dev

# في terminal ثانٍ: الـ Frontend
npm run dev
```

---

## 6. اختبار الـ Endpoints

### ✅ Health Check
```bash
curl http://localhost:3001/api/v1/health
```

### ✅ تسجيل الدخول
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```
**الاستجابة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5...",
    "user": {
      "id": 1,
      "username": "admin",
      "full_name": "مدير النظام",
      "role": "admin",
      "is_active": 1
    }
  },
  "message": "مرحباً مدير النظام"
}
```

### ✅ GET /me (التحقق من الجلسة)
```bash
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer <TOKEN_HERE>"
```

### ✅ قائمة المستخدمين (admin فقط)
```bash
curl http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer <TOKEN_HERE>"
```

### ✅ إنشاء مستخدم جديد
```bash
curl -X POST http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer <TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ahmed_sales",
    "password": "pass123",
    "full_name": "أحمد المبيعات",
    "role": "sales"
  }'
```

### ✅ تعديل مستخدم
```bash
curl -X PUT http://localhost:3001/api/v1/users/2 \
  -H "Authorization: Bearer <TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{"role": "accountant"}'
```

### ✅ تغيير كلمة المرور
```bash
curl -X PUT http://localhost:3001/api/v1/users/2/password \
  -H "Authorization: Bearer <TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{"new_password": "newpass456", "confirm_password": "newpass456"}'
```

### ✅ تعطيل مستخدم
```bash
curl -X DELETE http://localhost:3001/api/v1/users/2 \
  -H "Authorization: Bearer <TOKEN_HERE>"
```

---

## 7. الأدوار والصلاحيات

| الدور        | الوصف                                    |
|-------------|------------------------------------------|
| `admin`     | وصول كامل لجميع الـ endpoints             |
| `accountant`| المالية والتقارير والفواتير              |
| `sales`     | فواتير البيع والعملاء والمخزون (قراءة)   |
| `warehouse` | المخزن والأصناف فقط                      |

---

## 8. ملاحظات أمنية مهمة

- ⚠️ **غيّر** `admin123` فور تشغيل النظام أول مرة
- ⚠️ **غيّر** `JWT_SECRET` في الـ `.env` بقيمة عشوائية طويلة
- ✅ كلمات المرور مشفّرة بـ `bcrypt` (salt rounds = 10)
- ✅ JWT token صالح لـ 24 ساعة
- ✅ soft delete للمستخدمين (لا حذف فعلي)
- ✅ لا يمكن تعطيل آخر admin نشط في النظام

---

## الخطوة التالية

المرحلة 4 — Backend API: الأصناف والمخازن
- `GET/POST/PUT/DELETE /api/v1/inventory`
- `GET/POST/PUT/DELETE /api/v1/warehouses`
