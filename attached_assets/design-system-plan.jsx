import { useState } from "react";

const phases = [
  {
    id: 1,
    title: "المرحلة الأولى — نظام التصميم الأساسي (Design Tokens)",
    icon: "🎨",
    color: "#3b82f6",
    duration: "يومان",
    files: ["src/styles/tokens.css", "src/styles/globals.css"],
    description: "إنشاء ملف مركزي واحد يحتوي على كل متغيرات التصميم (CSS Custom Properties)",
    tasks: [
      {
        title: "توحيد لوحة الألوان",
        detail: "إنشاء `src/styles/tokens.css` يحتوي على جميع الألوان كمتغيرات CSS",
        code: `/* src/styles/tokens.css */
:root {
  /* ألوان الهوية الرئيسية */
  --color-primary:       #1a56db;
  --color-primary-light: #3b82f6;
  --color-primary-dark:  #1e40af;

  /* الخلفيات */
  --color-bg-base:    #0f172a;  /* slate-950 */
  --color-bg-surface: #1e293b;  /* slate-800 */
  --color-bg-card:    #1e2a3b;

  /* الحدود */
  --color-border:       rgba(255,255,255,0.08);
  --color-border-hover: rgba(255,255,255,0.15);

  /* الثيمات الأربعة */
  --theme-inventory: #3b82f6;   /* أزرق — الأصناف */
  --theme-sales:     #10b981;   /* أخضر زمردي — المبيعات */
  --theme-purchases: #8b5cf6;   /* بنفسجي — المشتريات */
  --theme-reports:   #f59e0b;   /* كهرماني — التقارير */
  --theme-warehouses:#06b6d4;   /* سماوي — المخازن */
  --theme-settings:  #64748b;   /* رمادي — الإعدادات */

  /* الحالات */
  --status-success: #10b981;
  --status-warning: #f59e0b;
  --status-danger:  #ef4444;
  --status-info:    #3b82f6;

  /* المسافات */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;
  --space-2xl: 48px;

  /* الحجوم */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* الظلال */
  --shadow-card: 0 4px 24px rgba(0,0,0,0.3);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.5);

  /* الخطوط */
  --font-arabic: 'Cairo', sans-serif;
  --font-mono:   'JetBrains Mono', monospace;

  /* حجوم الخطوط */
  --text-xs:   12px;
  --text-sm:   14px;
  --text-base: 16px;
  --text-lg:   18px;
  --text-xl:   20px;
  --text-2xl:  24px;
  --text-3xl:  30px;

  /* الانتقالات */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;
}`
      },
      {
        title: "تحديث index.css",
        detail: "استيراد ملف التوكنز + حذف كل الألوان المتناثرة",
        code: `/* src/index.css */
@import './styles/tokens.css';
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; }

html { direction: rtl; font-family: var(--font-arabic); }
body { background: var(--color-bg-base); color: #f1f5f9; margin: 0; }
`
      }
    ]
  },
  {
    id: 2,
    title: "المرحلة الثانية — مكتبة المكونات الموحدة (UI Library)",
    icon: "🧱",
    color: "#8b5cf6",
    duration: "ثلاثة أيام",
    files: [
      "src/components/ui/Button.tsx",
      "src/components/ui/Card.tsx",
      "src/components/ui/Badge.tsx",
      "src/components/ui/Input.tsx",
      "src/components/ui/Modal.tsx",
      "src/components/ui/Table.tsx",
      "src/components/ui/StatCard.tsx",
      "src/components/ui/PageHeader.tsx",
      "src/components/ui/index.ts",
    ],
    description: "بناء مكونات أساسية مُعاد استخدامها عبر جميع الصفحات",
    tasks: [
      {
        title: "Button.tsx — زر موحد",
        detail: "variant: primary | secondary | ghost | danger | theme — يقبل لون الثيم",
        code: `// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  themeColor?: string; // يستقبل var(--theme-sales) مثلاً
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}
// يُطبّق نمطاً ثابتاً بغض النظر عن الصفحة`
      },
      {
        title: "Card.tsx — بطاقة موحدة",
        detail: "تُقبل خاصية themeColor فتُغيّر حدودها فقط دون تغيير الشكل العام",
        code: `// src/components/ui/Card.tsx
interface CardProps {
  themeColor?: string;  // لون الثيم للصفحة الحالية
  className?: string;
  children: React.ReactNode;
}
// الخلفية دائماً: var(--color-bg-card)
// الحد يتغير فقط مع themeColor`
      },
      {
        title: "StatCard.tsx — بطاقة الإحصاء",
        detail: "مكون واحد يُستخدم في Dashboard + Reports + كل الصفحات",
        code: `// src/components/ui/StatCard.tsx
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; direction: 'up' | 'down' };
  themeColor: string;
}
// الشكل موحد في كل مكان — فقط اللون يتغير`
      },
      {
        title: "PageHeader.tsx — رأس الصفحة",
        detail: "رأس موحد لكل الصفحات: عنوان + وصف + أزرار الإجراء",
        code: `// src/components/ui/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  themeColor: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}`
      }
    ]
  },
  {
    id: 3,
    title: "المرحلة الثالثة — نظام الثيم لكل صفحة (Page Theme)",
    icon: "🎭",
    color: "#10b981",
    duration: "يوم واحد",
    files: ["src/lib/pageThemes.ts"],
    description: "ملف مركزي يربط كل صفحة بلونها وأيقونتها — يُستخدم في الـ Sidebar والصفحات معاً",
    tasks: [
      {
        title: "pageThemes.ts — مصدر الحقيقة الوحيد",
        detail: "كل الألوان المرتبطة بالصفحات تأتي من هنا",
        code: `// src/lib/pageThemes.ts
export const PAGE_THEMES = {
  dashboard: {
    color: '#1a56db',
    colorVar: 'var(--theme-inventory)',
    label: 'لوحة التحكم',
    icon: 'LayoutDashboard',
    gradient: 'from-blue-600 to-blue-800',
  },
  inventory: {
    color: '#3b82f6',
    colorVar: 'var(--theme-inventory)',
    label: 'الأصناف',
    icon: 'Package',
    gradient: 'from-blue-500 to-blue-700',
  },
  sales: {
    color: '#10b981',
    colorVar: 'var(--theme-sales)',
    label: 'فواتير المبيعات',
    icon: 'ShoppingCart',
    gradient: 'from-emerald-500 to-emerald-700',
  },
  purchases: {
    color: '#8b5cf6',
    colorVar: 'var(--theme-purchases)',
    label: 'فواتير المشتريات',
    icon: 'Truck',
    gradient: 'from-violet-500 to-violet-700',
  },
  reports: {
    color: '#f59e0b',
    colorVar: 'var(--theme-reports)',
    label: 'التقارير',
    icon: 'BarChart3',
    gradient: 'from-amber-500 to-amber-700',
  },
  warehouses: {
    color: '#06b6d4',
    colorVar: 'var(--theme-warehouses)',
    label: 'المخازن',
    icon: 'Warehouse',
    gradient: 'from-cyan-500 to-cyan-700',
  },
  settings: {
    color: '#64748b',
    colorVar: 'var(--theme-settings)',
    label: 'الإعدادات',
    icon: 'Settings',
    gradient: 'from-slate-500 to-slate-700',
  },
} as const;`
      }
    ]
  },
  {
    id: 4,
    title: "المرحلة الرابعة — إعادة بناء App.tsx والـ Sidebar",
    icon: "🏗️",
    color: "#f59e0b",
    duration: "يومان",
    files: ["src/App.tsx", "src/components/layout/Sidebar.tsx", "src/components/layout/Header.tsx"],
    description: "فصل هيكل التطبيق الرئيسي عن الصفحات + Sidebar يقرأ من pageThemes",
    tasks: [
      {
        title: "فصل Layout عن App",
        detail: "إنشاء Layout component يحتوي Sidebar + Header + outlet للصفحات",
        code: `// src/components/layout/AppLayout.tsx
export function AppLayout({ children, currentPage, onPageChange }) {
  const theme = PAGE_THEMES[currentPage];
  return (
    <div className="flex h-screen">
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header theme={theme} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}`
      },
      {
        title: "Sidebar — يقرأ من pageThemes",
        detail: "لا ألوان hardcoded — كل شيء من PAGE_THEMES",
        code: `// src/components/layout/Sidebar.tsx
// يمر على Object.entries(PAGE_THEMES)
// عند التحديد يُطبّق لون الثيم النشط
// باقي العناصر: نفس الشكل، نفس الحجم، نفس المسافة`
      }
    ]
  },
  {
    id: 5,
    title: "المرحلة الخامسة — تحديث الصفحات لاستخدام المكونات الموحدة",
    icon: "🔄",
    color: "#06b6d4",
    duration: "ثلاثة أيام",
    files: [
      "src/Dashboard.tsx",
      "src/SalesInvoices.tsx",
      "src/PurchaseInvoices.tsx",
      "src/Reports.tsx",
      "src/Warehouses.tsx",
      "src/Settings.tsx",
    ],
    description: "استبدال كل مكون مكرر في الصفحات بالمكونات الموحدة من src/components/ui",
    tasks: [
      {
        title: "قاعدة التحديث",
        detail: "كل صفحة تستدعي theme = PAGE_THEMES[pageKey] ثم تمرره للمكونات",
        code: `// مثال: SalesInvoices.tsx
import { PAGE_THEMES } from '../lib/pageThemes';
import { PageHeader, StatCard, Button, Card } from '../components/ui';

export function SalesInvoices() {
  const theme = PAGE_THEMES.sales;
  return (
    <>
      <PageHeader
        title={theme.label}
        icon={<ShoppingCart />}
        themeColor={theme.color}
        actions={<Button variant="primary" themeColor={theme.color}>فاتورة جديدة</Button>}
      />
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="إجمالي المبيعات" value="..." themeColor={theme.color} icon={...} />
      </div>
    </>
  );
}`
      },
      {
        title: "توحيد الجداول",
        detail: "كل الصفحات تستخدم <Table> الموحد نفسه مع إمرار columns و data",
        code: `// Table.tsx يقبل:
// columns: { key, label, render? }[]
// data: Record<string, any>[]
// themeColor: string (لون الـ header)
// actions?: (row) => ReactNode`
      }
    ]
  },
  {
    id: 6,
    title: "المرحلة السادسة — توحيد الخطوط والتايبوغرافي",
    icon: "🔤",
    color: "#ec4899",
    duration: "يوم واحد",
    files: ["src/styles/typography.css"],
    description: "نظام خطوط موحد بمستويات واضحة",
    tasks: [
      {
        title: "Typography Scale",
        detail: "class واضح لكل مستوى نصي — يُستخدم في كل الصفحات",
        code: `/* src/styles/typography.css */

.text-display  { font-size: var(--text-3xl); font-weight: 800; }
.text-heading  { font-size: var(--text-2xl); font-weight: 700; }
.text-title    { font-size: var(--text-xl);  font-weight: 600; }
.text-body     { font-size: var(--text-base); font-weight: 400; }
.text-label    { font-size: var(--text-sm);  font-weight: 500; }
.text-caption  { font-size: var(--text-xs);  font-weight: 400; opacity: 0.6; }
.text-mono     { font-family: var(--font-mono); }

/* الأرقام دائماً JetBrains Mono */
.stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: 700;
}`
      }
    ]
  },
  {
    id: 7,
    title: "المرحلة السابعة — توحيد الحالات والـ Feedback",
    icon: "✅",
    color: "#64748b",
    duration: "يوم واحد",
    files: ["src/components/ui/Toast.tsx", "src/components/ui/EmptyState.tsx", "src/components/ui/LoadingSpinner.tsx"],
    description: "مكونات الـ UX الموحدة: رسائل النجاح/الخطأ، الحالات الفارغة، التحميل",
    tasks: [
      {
        title: "Toast notifications موحدة",
        detail: "مكون واحد لكل رسائل النجاح والخطأ في جميع الصفحات",
        code: `// src/components/ui/Toast.tsx
// type: 'success' | 'error' | 'warning' | 'info'
// الألوان تأتي من tokens.css
// --status-success, --status-danger, إلخ`
      },
      {
        title: "EmptyState موحدة",
        detail: "نفس الشكل لكل الحالات الفارغة في الجداول",
        code: `// src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}`
      }
    ]
  }
];

const problems = [
  { issue: "ألوان hardcoded في كل ملف", example: "bg-blue-600 في App.tsx و bg-emerald-500 في Sales", fix: "توكنز CSS + pageThemes.ts" },
  { issue: "StatCard مكرر في 4 صفحات", example: "Dashboard, Reports, Sales, Purchases تعرّف بطاقاتها بشكل مختلف", fix: "مكون StatCard.tsx واحد" },
  { issue: "Modal مختلف في كل صفحة", example: "كل صفحة لديها modal بتصميم مختلف قليلاً", fix: "Modal.tsx موحد" },
  { issue: "Button بأشكال متعددة", example: "أزرار بأشكال وأحجام وألوان مختلفة عبر الصفحات", fix: "Button.tsx مع variants" },
  { issue: "Table structure مكررة", example: "كل صفحة تبني جدولها من الصفر", fix: "Table.tsx موحد" },
  { issue: "Typography غير متسقة", example: "حجوم وأوزان خطوط مختلفة لعناصر متشابهة", fix: "typography.css + text-* classes" },
];

const fileStructure = `src/
├── styles/
│   ├── tokens.css          ← المصدر الوحيد للألوان والمتغيرات  ⭐
│   ├── typography.css      ← نظام الخطوط الموحد
│   └── globals.css         ← استيراد كل شيء
│
├── lib/
│   ├── pageThemes.ts       ← ثيم كل صفحة (لون، أيقونة، تدرج)  ⭐
│   ├── api.ts              ← (موجود)
│   └── utils.ts            ← cn helper
│
├── components/
│   ├── ui/                 ← مكتبة المكونات الموحدة  ⭐
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── StatCard.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Toast.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── index.ts        ← barrel export
│   │
│   └── layout/             ← هيكل التطبيق
│       ├── AppLayout.tsx
│       ├── Sidebar.tsx
│       └── Header.tsx
│
├── pages/                  ← الصفحات (تستخدم فقط ui/ components)
│   ├── Dashboard.tsx
│   ├── Inventory.tsx
│   ├── SalesInvoices.tsx
│   ├── PurchaseInvoices.tsx
│   ├── Reports.tsx
│   ├── Warehouses.tsx
│   └── Settings.tsx
│
├── hooks/
├── types.ts
└── main.tsx`;

export default function DesignPlan() {
  const [activePhase, setActivePhase] = useState(null);
  const [activeTab, setActiveTab] = useState("phases");

  return (
    <div style={{
      fontFamily: "'Cairo', 'Segoe UI', sans-serif",
      background: "#0f172a",
      color: "#e2e8f0",
      minHeight: "100vh",
      direction: "rtl",
      padding: "24px"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a56db 0%, #8b5cf6 50%, #06b6d4 100%)",
        borderRadius: "20px",
        padding: "32px",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.1,
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
          backgroundSize: "30px 30px"
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginBottom: "8px", letterSpacing: "2px", textTransform: "uppercase" }}>
            خطة إعادة الهيكلة التصميمية
          </div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "white" }}>
            🎨 المُنسق — نظام التصميم الموحد
          </h1>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.8)", fontSize: "15px" }}>
            7 مراحل لتوحيد الألوان، المكونات، الخطوط، وكل عناصر الواجهة
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
            {[
              { label: "7 مراحل", color: "#60a5fa" },
              { label: "9 ملفات UI جديدة", color: "#a78bfa" },
              { label: "~12 يوم عمل", color: "#34d399" }
            ].map(b => (
              <span key={b.label} style={{
                background: "rgba(255,255,255,0.15)",
                border: `1px solid ${b.color}40`,
                color: b.color,
                padding: "6px 16px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: "600"
              }}>{b.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {[
          { id: "phases", label: "📋 المراحل" },
          { id: "problems", label: "🔍 المشاكل الحالية" },
          { id: "structure", label: "📁 هيكل الملفات" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "1px solid",
            borderColor: activeTab === tab.id ? "#1a56db" : "rgba(255,255,255,0.1)",
            background: activeTab === tab.id ? "rgba(26,86,219,0.2)" : "rgba(255,255,255,0.04)",
            color: activeTab === tab.id ? "#60a5fa" : "#94a3b8",
            cursor: "pointer",
            fontSize: "14px",
            fontFamily: "inherit",
            fontWeight: activeTab === tab.id ? "600" : "400",
            transition: "all 0.2s"
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Phases Tab */}
      {activeTab === "phases" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {phases.map(phase => (
            <div key={phase.id} style={{
              background: "rgba(30, 41, 59, 0.6)",
              border: `1px solid ${activePhase === phase.id ? phase.color : "rgba(255,255,255,0.08)"}`,
              borderRadius: "16px",
              overflow: "hidden",
              transition: "border-color 0.2s"
            }}>
              {/* Phase Header */}
              <div
                onClick={() => setActivePhase(activePhase === phase.id ? null : phase.id)}
                style={{
                  padding: "20px 24px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px"
                }}
              >
                <div style={{
                  width: "48px", height: "48px",
                  background: `${phase.color}20`,
                  border: `1px solid ${phase.color}40`,
                  borderRadius: "12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", flexShrink: 0
                }}>{phase.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "700", fontSize: "16px", color: "white" }}>{phase.title}</div>
                  <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>{phase.description}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                  <span style={{
                    background: `${phase.color}20`,
                    color: phase.color,
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>{phase.duration}</span>
                  <span style={{ color: "#64748b", fontSize: "18px" }}>
                    {activePhase === phase.id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {activePhase === phase.id && (
                <div style={{ borderTop: `1px solid ${phase.color}30`, padding: "20px 24px" }}>
                  {/* Files */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>الملفات المتأثرة</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {phase.files.map(f => (
                        <span key={f} style={{
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontFamily: "'JetBrains Mono', monospace",
                          color: "#94a3b8"
                        }}>{f}</span>
                      ))}
                    </div>
                  </div>

                  {/* Tasks */}
                  {phase.tasks.map((task, i) => (
                    <div key={i} style={{
                      background: "rgba(0,0,0,0.25)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px",
                      padding: "16px",
                      marginBottom: "12px"
                    }}>
                      <div style={{ fontWeight: "600", color: "white", marginBottom: "6px" }}>
                        <span style={{ color: phase.color }}>◆</span> {task.title}
                      </div>
                      <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "12px" }}>{task.detail}</div>
                      <pre style={{
                        background: "#0d1117",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "8px",
                        padding: "16px",
                        fontSize: "11px",
                        fontFamily: "'JetBrains Mono', monospace",
                        overflowX: "auto",
                        color: "#a5f3fc",
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.7"
                      }}>{task.code}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Problems Tab */}
      {activeTab === "problems" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "8px",
            fontSize: "14px",
            color: "#fca5a5"
          }}>
            ⚠️ هذه المشاكل تؤدي إلى عدم اتساق التصميم وصعوبة الصيانة مستقبلاً
          </div>
          {problems.map((p, i) => (
            <div key={i} style={{
              background: "rgba(30, 41, 59, 0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              padding: "20px 24px",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "16px",
              alignItems: "start"
            }}>
              <div>
                <div style={{ fontWeight: "600", color: "#f87171", marginBottom: "6px" }}>
                  ❌ {p.issue}
                </div>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  مثال: {p.example}
                </div>
              </div>
              <div style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "12px",
                color: "#34d399",
                textAlign: "center",
                whiteSpace: "nowrap"
              }}>✅ {p.fix}</div>
            </div>
          ))}
        </div>
      )}

      {/* Structure Tab */}
      {activeTab === "structure" && (
        <div style={{
          background: "rgba(13, 17, 23, 0.9)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "24px"
        }}>
          <div style={{ marginBottom: "16px", color: "#94a3b8", fontSize: "14px" }}>
            الهيكل المقترح بعد إعادة البناء — النجمة ⭐ تعني ملف جديد أو مُعاد بناؤه بالكامل
          </div>
          <pre style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "13px",
            color: "#a5f3fc",
            lineHeight: "1.8",
            margin: 0,
            whiteSpace: "pre-wrap"
          }}>{fileStructure}</pre>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: "24px",
        padding: "16px 24px",
        background: "rgba(30,41,59,0.4)",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ fontSize: "13px", color: "#64748b" }}>
          📌 ابدأ بالمرحلة الأولى — كل مرحلة مستقلة ويمكن تطبيقها تدريجياً
        </div>
        <div style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
          {["tokens.css ← المصدر الوحيد", "pageThemes.ts ← ثيم الصفحات", "components/ui/ ← اعد الاستخدام"].map(t => (
            <span key={t} style={{
              background: "rgba(26,86,219,0.15)",
              border: "1px solid rgba(26,86,219,0.3)",
              color: "#93c5fd",
              padding: "4px 10px",
              borderRadius: "6px"
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
