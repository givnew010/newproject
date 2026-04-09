/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, Package, FileText, Bell, Database, User, Phone, Mail,
  MapPin, Globe, Hash, Percent, AlertTriangle, Save, RotateCcw,
  Download, Upload, Trash2, CheckCircle2, ChevronLeft, ChevronDown,
  Shield, Moon, Sun, Monitor, Camera, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './context/ToastContext';
import { settingsApi } from './lib/api';
import { Button } from './components/ui';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AppSettings {
  // Company
  companyName: string;
  companyTagline: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  companyTaxNumber: string;
  companyWebsite: string;
  // Inventory
  lowStockThreshold: number;
  currency: string;
  // Invoices
  purchaseInvoicePrefix: string;
  salesInvoicePrefix: string;
  taxRate: number;
  defaultInvoiceNotes: string;
  // Notifications
  notifyLowStock: boolean;
  notifyOutOfStock: boolean;
  notifyNewSale: boolean;
  // Display
  theme: 'light' | 'dark' | 'system';
  itemsPerPage: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'المُنسق',
  companyTagline: 'نظام إدارة المخزون',
  companyPhone: '',
  companyEmail: '',
  companyAddress: '',
  companyTaxNumber: '',
  companyWebsite: '',
  lowStockThreshold: 5,
  currency: 'SAR',
  purchaseInvoicePrefix: 'PO',
  salesInvoicePrefix: 'SO',
  taxRate: 15,
  defaultInvoiceNotes: '',
  notifyLowStock: true,
  notifyOutOfStock: true,
  notifyNewSale: false,
  theme: 'light',
  itemsPerPage: 25,
};

type SectionId = 'company' | 'inventory' | 'invoices' | 'notifications' | 'data';

interface SectionProps {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function SectionNav({ id, title, icon, active, onClick }: SectionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all text-right",
        active
          ? "bg-primary-fixed text-primary font-bold shadow-sm"
          : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("transition-colors", active ? "text-primary" : "text-on-surface-variant")}>
          {icon}
        </span>
        <span>{title}</span>
      </div>
      <ChevronLeft size={15} className={cn("transition-transform", active ? "opacity-100" : "opacity-0")} />
    </button>
  );
}

function FieldRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4 border-b border-surface-container-low last:border-0">
      <div className="sm:w-48 flex-shrink-0">
        <p className="text-sm font-bold text-on-surface">{label}</p>
        {sub && <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">{sub}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', dir }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; dir?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      dir={dir}
      className="w-full bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group select-none">
      <span className="text-sm text-on-surface group-hover:text-primary transition-colors">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0",
          checked ? "bg-primary" : "bg-surface-container-high"
        )}
      >
        <motion.div
          layout
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ right: checked ? '4px' : 'calc(100% - 20px)' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </label>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>('company');
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [dataConfirm, setDataConfirm] = useState(false);
  const { showError, showSuccess } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<AppSettings>) => setSettings(s => ({ ...s, ...partial }));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await settingsApi.getAll();
        if (!mounted) return;
        if (res.success && res.data) {
          setSettings({ ...DEFAULT_SETTINGS, ...res.data });
        } else {
          showError(res.error ?? 'فشل جلب إعدادات النظام');
        }
      } catch (err) {
        console.error(err);
        showError('خطأ أثناء تحميل الإعدادات');
      } finally {
        if (mounted) setLoadingSettings(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    try {
      const res = await settingsApi.update(settings as any);
      if (res.success) {
        setSaved(true);
        showSuccess('تم حفظ الإعدادات بنجاح');
        setTimeout(() => setSaved(false), 2500);
      } else {
        showError(res.error ?? 'فشل في حفظ الإعدادات');
      }
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const handleReset = async () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      const res = await settingsApi.update(DEFAULT_SETTINGS as any);
      if (!res.success) showError(res.error ?? 'فشل إعادة ضبط الإعدادات على الخادم');
      else showSuccess('تم إعادة ضبط الإعدادات');
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء إعادة الضبط');
    }
    localStorage.removeItem('app_settings');
    setResetConfirm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExport = async () => {
    try {
      const res = await settingsApi.backup();
      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `almunassiq-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess('تم إنشاء نسخة احتياطية');
        return;
      }
    } catch (err) {
      console.error(err);
      // fallback to local export
    }

    const data = {
      settings: JSON.parse(localStorage.getItem('app_settings') ?? '{}'),
      inventory_items: JSON.parse(localStorage.getItem('inventory_items') ?? '[]'),
      purchase_invoices: JSON.parse(localStorage.getItem('purchase_invoices') ?? '[]'),
      sales_invoices: JSON.parse(localStorage.getItem('sales_invoices') ?? '[]'),
      warehouses: JSON.parse(localStorage.getItem('warehouses') ?? '[]'),
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `almunassiq-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        // try restore via API
        try {
          const res = await settingsApi.restore(data);
          if (res.success) {
            showSuccess('تم استعادة البيانات من الخادم');
            window.location.reload();
            return;
          }
        } catch (err) {
          console.error('restore api failed', err);
        }

        // fallback to local import if server restore not available
        if (data.inventory_items) localStorage.setItem('inventory_items', JSON.stringify(data.inventory_items));
        if (data.purchase_invoices) localStorage.setItem('purchase_invoices', JSON.stringify(data.purchase_invoices));
        if (data.sales_invoices) localStorage.setItem('sales_invoices', JSON.stringify(data.sales_invoices));
        if (data.warehouses) localStorage.setItem('warehouses', JSON.stringify(data.warehouses));
        if (data.settings) localStorage.setItem('app_settings', JSON.stringify(data.settings));
        window.location.reload();
      } catch (err) {
        console.error(err);
        showError('ملف غير صالح. يرجى التحقق من الملف وإعادة المحاولة.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    ['inventory_items', 'purchase_invoices', 'sales_invoices', 'warehouses', 'app_settings']
      .forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  const sections: { id: SectionId; title: string; icon: React.ReactNode }[] = [
    { id: 'company',       title: 'معلومات الشركة',        icon: <Building2 size={18} /> },
    { id: 'inventory',     title: 'إعدادات المخزون',       icon: <Package size={18} /> },
    { id: 'invoices',      title: 'إعدادات الفواتير',      icon: <FileText size={18} /> },
    { id: 'notifications', title: 'الإشعارات والتنبيهات',  icon: <Bell size={18} /> },
    { id: 'data',          title: 'البيانات والنسخ الاحتياطي', icon: <Database size={18} /> },
  ];

  return (
    <div className="p-4 lg:p-8 flex-1">
      <div className="max-w-5xl mx-auto">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-extrabold text-on-surface">الإعدادات</h3>
            <p className="text-sm text-on-surface-variant mt-0.5">إدارة إعدادات النظام والشركة</p>
          </div>
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2.5 rounded-xl text-sm font-bold"
              >
                <CheckCircle2 size={16} /> تم الحفظ بنجاح
              </motion.div>
            ) : (
              <motion.div
                key="save"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Button onClick={handleSave} variant="primary" size="md" className="flex items-center gap-2">
                  <Save size={16} /> حفظ الإعدادات
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">

          {/* Sidebar Navigation */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm p-2 space-y-1">
              {sections.map(s => (
                <SectionNav
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  icon={s.icon}
                  active={activeSection === s.id}
                  onClick={() => setActiveSection(s.id)}
                />
              ))}
            </div>
          </div>

          {/* Content Panel */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden"
              >

                {/* ── Company ─────────────────────────────── */}
                {activeSection === 'company' && (
                  <div>
                    <SectionHeader icon={<Building2 size={20} />} title="معلومات الشركة" sub="البيانات الأساسية التي تظهر على الفواتير والتقارير" />
                    <div className="px-6 pb-6">

                      {/* Logo Placeholder */}
                      <div className="flex items-center gap-4 py-4 border-b border-surface-container-low mb-2">
                        <div className="w-16 h-16 rounded-2xl bg-primary-fixed/40 flex items-center justify-center text-primary flex-shrink-0 text-2xl font-extrabold">
                          {settings.companyName.charAt(0) || 'م'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{settings.companyName || 'اسم الشركة'}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{settings.companyTagline || 'الوصف التعريفي'}</p>
                          <button className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                            <Pencil size={12} /> تغيير الشعار (قريباً)
                          </button>
                        </div>
                      </div>

                      <FieldRow label="اسم الشركة / المتجر" sub="يظهر في رأس الفواتير والتقارير">
                        <TextInput value={settings.companyName} onChange={v => update({ companyName: v })} placeholder="المُنسق" />
                      </FieldRow>
                      <FieldRow label="الوصف التعريفي" sub="سطر صغير أسفل الاسم">
                        <TextInput value={settings.companyTagline} onChange={v => update({ companyTagline: v })} placeholder="نظام إدارة المخزون" />
                      </FieldRow>
                      <FieldRow label="رقم الهاتف" sub="للتواصل وعلى الفواتير">
                        <div className="relative">
                          <Phone size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                          <input
                            type="tel"
                            placeholder="05XXXXXXXX"
                            value={settings.companyPhone}
                            onChange={e => update({ companyPhone: e.target.value })}
                            className="w-full bg-surface-container-high border-none rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                            dir="ltr"
                          />
                        </div>
                      </FieldRow>
                      <FieldRow label="البريد الإلكتروني">
                        <div className="relative">
                          <Mail size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                          <input
                            type="email"
                            placeholder="info@example.com"
                            value={settings.companyEmail}
                            onChange={e => update({ companyEmail: e.target.value })}
                            className="w-full bg-surface-container-high border-none rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                            dir="ltr"
                          />
                        </div>
                      </FieldRow>
                      <FieldRow label="العنوان">
                        <div className="relative">
                          <MapPin size={15} className="absolute right-3 top-3.5 text-on-surface-variant" />
                          <textarea
                            rows={2}
                            placeholder="المدينة، الحي، الشارع..."
                            value={settings.companyAddress}
                            onChange={e => update({ companyAddress: e.target.value })}
                            className="w-full bg-surface-container-high border-none rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                          />
                        </div>
                      </FieldRow>
                      <FieldRow label="الرقم الضريبي" sub="رقم تسجيل ضريبة القيمة المضافة">
                        <div className="relative">
                          <Shield size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                          <input
                            type="text"
                            placeholder="300XXXXXXXXXXXXXXX"
                            value={settings.companyTaxNumber}
                            onChange={e => update({ companyTaxNumber: e.target.value })}
                            className="w-full bg-surface-container-high border-none rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                            dir="ltr"
                          />
                        </div>
                      </FieldRow>
                      <FieldRow label="الموقع الإلكتروني">
                        <div className="relative">
                          <Globe size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                          <input
                            type="url"
                            placeholder="https://example.com"
                            value={settings.companyWebsite}
                            onChange={e => update({ companyWebsite: e.target.value })}
                            className="w-full bg-surface-container-high border-none rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                            dir="ltr"
                          />
                        </div>
                      </FieldRow>
                    </div>
                  </div>
                )}

                {/* ── Inventory ─────────────────────────── */}
                {activeSection === 'inventory' && (
                  <div>
                    <SectionHeader icon={<Package size={20} />} title="إعدادات المخزون" sub="تحكم في حدود التنبيه والعملة الافتراضية" />
                    <div className="px-6 pb-6">
                      <FieldRow label="حد الكمية المنخفضة" sub="عدد الوحدات الذي يُشغّل تنبيه 'كمية منخفضة'">
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={settings.lowStockThreshold}
                            onChange={e => update({ lowStockThreshold: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-28 bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-center font-bold"
                          />
                          <span className="text-sm text-on-surface-variant">وحدة فما دون</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 bg-orange-50 text-orange-700 text-xs rounded-lg px-3 py-2 w-fit border border-orange-100">
                          <AlertTriangle size={13} />
                          الأصناف بكمية أقل من أو تساوي {settings.lowStockThreshold} ستُصنَّف "كمية منخفضة"
                        </div>
                      </FieldRow>

                      <FieldRow label="العملة الافتراضية" sub="تُستخدم في جميع الفواتير والتقارير">
                        <select
                          value={settings.currency}
                          onChange={e => update({ currency: e.target.value })}
                          className="w-full sm:w-48 bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
                        >
                          <option value="SAR">ريال سعودي (ر.س)</option>
                          <option value="AED">درهم إماراتي (د.إ)</option>
                          <option value="KWD">دينار كويتي (د.ك)</option>
                          <option value="BHD">دينار بحريني (د.ب)</option>
                          <option value="QAR">ريال قطري (ر.ق)</option>
                          <option value="OMR">ريال عماني (ر.ع)</option>
                          <option value="EGP">جنيه مصري (ج.م)</option>
                          <option value="USD">دولار أمريكي ($)</option>
                        </select>
                      </FieldRow>

                      <FieldRow label="عدد العناصر في الصفحة" sub="عدد الأصناف المعروضة في كل صفحة من الجدول">
                        <div className="flex flex-wrap gap-2">
                          {[10, 25, 50, 100].map(n => (
                            <button
                              key={n}
                              onClick={() => update({ itemsPerPage: n })}
                              className={cn(
                                "px-5 py-2 rounded-xl text-sm font-bold transition-all border",
                                settings.itemsPerPage === n
                                  ? "bg-primary text-white border-primary shadow-sm"
                                  : "border-surface-container-high text-on-surface-variant hover:bg-surface-container-low"
                              )}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </FieldRow>

                      <FieldRow label="مظهر النظام" sub="اختر بين الوضع الفاتح والداكن">
                        <div className="flex gap-3">
                          {([
                            { value: 'light',  label: 'فاتح',  icon: <Sun size={16} /> },
                            { value: 'dark',   label: 'داكن',  icon: <Moon size={16} /> },
                            { value: 'system', label: 'تلقائي', icon: <Monitor size={16} /> },
                          ] as const).map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => update({ theme: opt.value })}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border",
                                settings.theme === opt.value
                                  ? "bg-primary text-white border-primary shadow-sm"
                                  : "border-surface-container-high text-on-surface-variant hover:bg-surface-container-low"
                              )}
                            >
                              {opt.icon}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {settings.theme === 'dark' && (
                          <p className="text-[11px] text-on-surface-variant mt-2 bg-surface-container-low px-3 py-1.5 rounded-lg w-fit">
                            الوضع الداكن قيد التطوير — سيتوفر في الإصدار القادم
                          </p>
                        )}
                      </FieldRow>
                    </div>
                  </div>
                )}

                {/* ── Invoices ──────────────────────────── */}
                {activeSection === 'invoices' && (
                  <div>
                    <SectionHeader icon={<FileText size={20} />} title="إعدادات الفواتير" sub="تخصيص ترقيم وضريبة الفواتير" />
                    <div className="px-6 pb-6">
                      <FieldRow label="بادئة فواتير المشتريات" sub="تُضاف قبل رقم الفاتورة تلقائياً">
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            maxLength={10}
                            value={settings.purchaseInvoicePrefix}
                            onChange={e => update({ purchaseInvoicePrefix: e.target.value.toUpperCase() })}
                            className="w-28 bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-center font-bold font-mono uppercase"
                            dir="ltr"
                          />
                          <span className="text-sm text-on-surface-variant bg-surface-container-high px-3 py-2 rounded-lg font-mono text-xs">
                            {settings.purchaseInvoicePrefix || 'PO'}-2025-001
                          </span>
                        </div>
                      </FieldRow>
                      <FieldRow label="بادئة فواتير المبيعات">
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            maxLength={10}
                            value={settings.salesInvoicePrefix}
                            onChange={e => update({ salesInvoicePrefix: e.target.value.toUpperCase() })}
                            className="w-28 bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-center font-bold font-mono uppercase"
                            dir="ltr"
                          />
                          <span className="text-sm text-on-surface-variant bg-surface-container-high px-3 py-2 rounded-lg font-mono text-xs">
                            {settings.salesInvoicePrefix || 'SO'}-2025-001
                          </span>
                        </div>
                      </FieldRow>
                      <FieldRow label="نسبة ضريبة القيمة المضافة" sub="تُطبَّق على إجمالي الفواتير">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={settings.taxRate}
                              onChange={e => update({ taxRate: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                              className="w-28 bg-surface-container-high border-none rounded-xl pr-4 pl-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-center font-bold"
                              dir="ltr"
                            />
                          </div>
                          <span className="text-sm text-on-surface-variant">{settings.taxRate}%</span>
                        </div>
                        <div className="mt-2 bg-surface-container-low rounded-lg px-3 py-2 text-xs text-on-surface-variant w-fit">
                          فاتورة بمبلغ 1,000 ر.س → ضريبة: {(1000 * settings.taxRate / 100).toFixed(2)} ر.س → الإجمالي: {(1000 * (1 + settings.taxRate / 100)).toFixed(2)} ر.س
                        </div>
                      </FieldRow>
                      <FieldRow label="ملاحظة افتراضية للفواتير" sub="تظهر في خانة الملاحظات عند إنشاء فاتورة جديدة">
                        <textarea
                          rows={3}
                          placeholder="مثال: شكراً لتعاملكم معنا. يرجى المراجعة خلال 7 أيام."
                          value={settings.defaultInvoiceNotes}
                          onChange={e => update({ defaultInvoiceNotes: e.target.value })}
                          className="w-full bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                        />
                      </FieldRow>
                    </div>
                  </div>
                )}

                {/* ── Notifications ──────────────────────── */}
                {activeSection === 'notifications' && (
                  <div>
                    <SectionHeader icon={<Bell size={20} />} title="الإشعارات والتنبيهات" sub="تحكم في أنواع التنبيهات التي يُظهرها النظام" />
                    <div className="px-6 pb-6">

                      <div className="space-y-1 mt-2">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">تنبيهات المخزون</p>
                        <NotifyRow
                          icon={<AlertTriangle size={16} className="text-orange-500" />}
                          title="تنبيه الكمية المنخفضة"
                          sub={`يُنبّهك عندما تصل كمية صنف إلى ${settings.lowStockThreshold} وحدة أو أقل`}
                          checked={settings.notifyLowStock}
                          onChange={v => update({ notifyLowStock: v })}
                        />
                        <NotifyRow
                          icon={<Package size={16} className="text-error" />}
                          title="تنبيه نفاد المخزون"
                          sub="يُنبّهك فور نفاد مخزون أي صنف (الكمية = 0)"
                          checked={settings.notifyOutOfStock}
                          onChange={v => update({ notifyOutOfStock: v })}
                        />
                      </div>

                      <div className="mt-6 space-y-1">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">تنبيهات الفواتير</p>
                        <NotifyRow
                          icon={<FileText size={16} className="text-green-600" />}
                          title="إشعار فاتورة مبيعات جديدة"
                          sub="يُنبّهك عند إضافة فاتورة مبيعات جديدة"
                          checked={settings.notifyNewSale}
                          onChange={v => update({ notifyNewSale: v })}
                        />
                      </div>

                      <div className="mt-6 p-4 bg-surface-container-low rounded-xl text-xs text-on-surface-variant leading-relaxed">
                        <p className="font-bold text-on-surface mb-1 flex items-center gap-1.5">
                          <Shield size={13} /> ملاحظة
                        </p>
                        التنبيهات حالياً تظهر داخل لوحة التحكم فقط. ميزة الإشعارات الفورية ستُتاح في الإصدار القادم.
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Data ──────────────────────────────── */}
                {activeSection === 'data' && (
                  <div>
                    <SectionHeader icon={<Database size={20} />} title="البيانات والنسخ الاحتياطي" sub="تصدير بياناتك أو استعادتها أو إعادة ضبط النظام" />
                    <div className="px-6 pb-6 space-y-4">

                      {/* Export */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-surface-container-high bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 flex items-center justify-center text-primary flex-shrink-0">
                            <Download size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">تصدير البيانات</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">تحميل نسخة احتياطية من جميع البيانات (JSON)</p>
                          </div>
                        </div>
                        <button
                          onClick={handleExport}
                          className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-primary-fixed/30 text-primary rounded-xl text-sm font-bold hover:bg-primary-fixed/50 transition-colors"
                        >
                          <Download size={16} /> تصدير
                        </button>
                      </div>

                      {/* Import */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-surface-container-high bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 flex-shrink-0">
                            <Upload size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">استيراد البيانات</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">استعادة بيانات من ملف نسخة احتياطية سابقة</p>
                          </div>
                        </div>
                        <div>
                          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
                          >
                            <Upload size={16} /> استيراد
                          </button>
                        </div>
                      </div>

                      {/* Reset Settings */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-orange-100 bg-orange-50">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                            <RotateCcw size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">إعادة ضبط الإعدادات</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">إرجاع جميع إعدادات النظام إلى القيم الافتراضية فقط (البيانات تبقى)</p>
                          </div>
                        </div>
                        {resetConfirm ? (
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => setResetConfirm(false)} className="px-3 py-2 rounded-lg text-xs font-bold border border-surface-container-high text-on-surface-variant hover:bg-white transition-colors">إلغاء</button>
                            <button onClick={handleReset} className="px-3 py-2 rounded-lg text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors">تأكيد الإعادة</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResetConfirm(true)}
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-orange-100 text-orange-700 rounded-xl text-sm font-bold hover:bg-orange-200 transition-colors"
                          >
                            <RotateCcw size={16} /> إعادة ضبط
                          </button>
                        )}
                      </div>

                      {/* Delete All */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-red-100 bg-red-50">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center text-error flex-shrink-0">
                            <Trash2 size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-error">مسح جميع البيانات</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">حذف الأصناف والفواتير والمستودعات والإعدادات نهائياً. لا يمكن التراجع!</p>
                          </div>
                        </div>
                        {dataConfirm ? (
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => setDataConfirm(false)} className="px-3 py-2 rounded-lg text-xs font-bold border border-surface-container-high text-on-surface-variant hover:bg-white transition-colors">إلغاء</button>
                            <button onClick={handleClearAllData} className="px-3 py-2 rounded-lg text-xs font-bold bg-error text-white hover:bg-error/90 transition-colors">تأكيد المسح الكامل</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDataConfirm(true)}
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-error-container text-error rounded-xl text-sm font-bold hover:bg-error/10 transition-colors"
                          >
                            <Trash2 size={16} /> مسح البيانات
                          </button>
                        )}
                      </div>

                      {/* Storage Info */}
                      <div className="mt-2 p-4 bg-surface-container-low rounded-xl">
                        <p className="text-xs font-bold text-on-surface-variant mb-2">معلومات التخزين</p>
                        <StorageInfo />
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Save Button (bottom) */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-white px-6 py-3 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 active:scale-95"
          >
            <Save size={17} /> حفظ جميع الإعدادات
          </button>
        </div>

      </div>
    </div>
  );
}

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="px-6 py-5 border-b border-surface-container-low flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-extrabold text-on-surface">{title}</h4>
        <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function NotifyRow({ icon, title, sub, checked, onChange }: {
  icon: React.ReactNode; title: string; sub: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-xl border cursor-pointer transition-all",
        checked ? "border-primary/20 bg-primary-fixed/10" : "border-surface-container-high hover:bg-surface-container-low"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div>
          <p className="text-sm font-bold text-on-surface">{title}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} label="" />
    </div>
  );
}

function StorageInfo() {
  const keys = ['inventory_items', 'purchase_invoices', 'sales_invoices', 'warehouses', 'app_settings'];
  const labels: Record<string, string> = {
    inventory_items: 'الأصناف',
    purchase_invoices: 'فواتير المشتريات',
    sales_invoices: 'فواتير المبيعات',
    warehouses: 'المستودعات',
    app_settings: 'الإعدادات',
  };

  return (
    <div className="space-y-1.5">
      {keys.map(key => {
        const raw = localStorage.getItem(key) ?? '[]';
        const sizeKB = (new Blob([raw]).size / 1024).toFixed(1);
        let count = 0;
        try { const parsed = JSON.parse(raw); count = Array.isArray(parsed) ? parsed.length : 1; } catch { /* */ }
        return (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">{labels[key]}</span>
            <div className="flex items-center gap-3">
              <span className="text-on-surface-variant">{count > 1 ? `${count} سجل` : count === 1 ? 'سجل واحد' : 'فارغ'}</span>
              <span className="font-mono text-primary font-bold">{sizeKB} KB</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
