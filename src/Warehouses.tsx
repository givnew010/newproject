/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, X, Warehouse, MapPin, User, Phone,
  Package, Layers, CheckCircle2, AlertTriangle, Building2,
  MoreVertical, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Warehouse as WarehouseType, InventoryItem } from './types';
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from './hooks/useApi';
import { useToast } from './context/ToastContext';
import { Button, Input } from './components/ui';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  inventoryItems: InventoryItem[];
}

const COLOR_OPTIONS: WarehouseType['color'][] = ['blue', 'green', 'orange', 'purple', 'red', 'teal'];

const COLOR_MAP: Record<WarehouseType['color'], { bg: string; icon: string; badge: string; border: string; ring: string }> = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-700',   badge: 'bg-blue-100 text-blue-700',   border: 'border-blue-200',   ring: 'ring-blue-400' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-700', badge: 'bg-green-100 text-green-700', border: 'border-green-200', ring: 'ring-green-400' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', badge: 'bg-orange-100 text-orange-600', border: 'border-orange-200', ring: 'ring-orange-400' },
  purple: { bg: 'bg-violet-50', icon: 'bg-violet-100 text-violet-700', badge: 'bg-violet-100 text-violet-700', border: 'border-violet-200', ring: 'ring-violet-400' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',    badge: 'bg-red-100 text-red-600',    border: 'border-red-200',    ring: 'ring-red-400' },
  teal:   { bg: 'bg-teal-50',   icon: 'bg-teal-100 text-teal-700',  badge: 'bg-teal-100 text-teal-700',  border: 'border-teal-200',  ring: 'ring-teal-400' },
};

const COLOR_LABELS: Record<WarehouseType['color'], string> = {
  blue: 'أزرق', green: 'أخضر', orange: 'برتقالي',
  purple: 'بنفسجي', red: 'أحمر', teal: 'تيل',
};

const INITIAL_WAREHOUSES: WarehouseType[] = [
  {
    id: 'wh-01',
    name: 'المستودع الرئيسي',
    location: 'الرياض – المنطقة الصناعية',
    manager: 'أحمد العمري',
    phone: '0501234567',
    capacity: 1000,
    notes: 'المستودع الرئيسي للبضائع الواردة والصادرة',
    color: 'blue',
  },
  {
    id: 'wh-02',
    name: 'مستودع جدة',
    location: 'جدة – طريق الملك فهد',
    manager: 'سارة المالكي',
    phone: '0557654321',
    capacity: 600,
    notes: 'فرع المنطقة الغربية',
    color: 'green',
  },
  {
    id: 'wh-03',
    name: 'مستودع الإلكترونيات',
    location: 'الرياض – العليا',
    manager: 'خالد الزهراني',
    phone: '0509876543',
    capacity: 300,
    notes: 'مخصص لتخزين الأجهزة الإلكترونية',
    color: 'purple',
  },
];

interface FormState {
  name: string;
  location: string;
  manager: string;
  phone: string;
  capacity: string;
  notes: string;
  color: WarehouseType['color'];
}

const emptyForm = (): FormState => ({
  name: '', location: '', manager: '', phone: '',
  capacity: '', notes: '', color: 'blue',
});

function FieldGroup({ label, placeholder, type = 'text', value, onChange, required }: {
  label: string; placeholder: string; type?: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <Input
      label={`${label}${required ? ' *' : ''}`}
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={e => onChange((e.target as HTMLInputElement).value)}
      className="space-y-1"
    />
  );
}

export default function Warehouses({ inventoryItems }: Props) {
  const { warehouses = [], loading, error, refetch } = useWarehouses();
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();
  const { showSuccess, showError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingWh, setViewingWh] = useState<WarehouseType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Click outside to close menu
  useEffect(() => {
    const handler = () => setMenuOpen(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];
  const safeInventoryItems = Array.isArray(inventoryItems) ? inventoryItems : [];

  const totalCapacity = safeWarehouses.reduce((s, w) => s + (w.capacity || 0), 0);
  const totalItems = safeInventoryItems.reduce((s, i) => s + (i.quantity || 0), 0);
  const utilizationPercent = totalCapacity > 0 ? Math.min(100, Math.round((totalItems / totalCapacity) * 100)) : 0;

  const displayed = warehouses.filter(w => {
    const q = searchQuery.trim().toLowerCase();
    return !q || w.name.toLowerCase().includes(q) || w.location.toLowerCase().includes(q) || w.manager.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (wh: WarehouseType) => {
    setEditingId(wh.id);
    setForm({
      name: wh.name, location: wh.location, manager: wh.manager,
      phone: wh.phone, capacity: wh.capacity.toString(),
      notes: wh.notes ?? '', color: wh.color,
    });
    setIsModalOpen(true);
    setMenuOpen(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.location) return;

    const warehouseData = {
      name: form.name,
      location: form.location,
      manager_name: form.manager,
      phone: form.phone,
      capacity: Math.max(0, parseInt(form.capacity) || 0),
      notes: form.notes,
      color: form.color,
    };

    try {
      if (editingId) {
        await updateMutation.mutate({ id: parseInt(editingId), warehouse: warehouseData });
        if (updateMutation.success) {
          showSuccess('تم تحديث المستودع بنجاح');
          refetch();
        } else {
          showError('فشل في تحديث المستودع: ' + updateMutation.error);
        }
      } else {
        await createMutation.mutate(warehouseData);
        if (createMutation.success) {
          showSuccess('تم إضافة المستودع بنجاح');
          refetch();
        } else {
          showError('فشل في إضافة المستودع: ' + createMutation.error);
        }
      }
      setIsModalOpen(false);
      setForm(emptyForm());
      setEditingId(null);
    } catch (error) {
      showError('حدث خطأ غير متوقع');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMutation.mutate(parseInt(deleteId));
      if (deleteMutation.success) {
        showSuccess('تم حذف المستودع بنجاح');
        refetch();
      } else {
        showError('فشل في حذف المستودع: ' + deleteMutation.error);
      }
      if (viewingWh?.id === deleteId) setViewingWh(null);
      setDeleteId(null);
    } catch (error) {
      showError('حدث خطأ غير متوقع');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 flex-1">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="mr-2 text-sm text-on-surface-variant">جاري التحميل...</span>
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 text-center">
          <p className="text-error font-medium">{error}</p>
          <button
            onClick={refetch}
            className="mt-2 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="عدد المستودعات" value={warehouses.length.toString()} icon={<Building2 size={20} />} color="text-primary bg-primary-fixed" bg="bg-primary-fixed/20" />
        <StatCard label="إجمالي الطاقة الاستيعابية" value={`${totalCapacity.toLocaleString('ar-SA')} وحدة`} icon={<Layers size={20} />} color="text-blue-700 bg-blue-100" bg="bg-blue-50" />
        <StatCard label="إجمالي الأصناف المخزنة" value={`${totalItems.toLocaleString('ar-SA')} وحدة`} icon={<Package size={20} />} color="text-green-700 bg-green-100" bg="bg-green-50" />
        <StatCard
          label="نسبة الإشغال"
          value={`${utilizationPercent}%`}
          icon={utilizationPercent >= 80 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
          color={utilizationPercent >= 80 ? "text-orange-600 bg-orange-100" : "text-emerald-700 bg-emerald-100"}
          bg={utilizationPercent >= 80 ? "bg-orange-50" : "bg-emerald-50"}
          sub={utilizationPercent >= 80 ? "المستودعات شبه ممتلئة" : "طاقة إضافية متاحة"}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="بحث باسم المستودع أو الموقع..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-surface-container-high rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        <Button onClick={openAdd} variant="primary" size="md" className="w-full sm:w-auto flex items-center justify-center gap-2">
          <Plus size={20} />
          <span className="text-sm">إضافة مستودع</span>
        </Button>
      </div>

      {/* Warehouses Grid */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant gap-3">
          <Warehouse size={48} className="opacity-20" />
          <p className="text-sm font-medium">
            {searchQuery ? 'لا توجد مستودعات تطابق البحث' : 'لا توجد مستودعات بعد'}
          </p>
          {!searchQuery && (
            <Button variant="ghost" size="sm" onClick={openAdd} className="text-primary hover:underline font-bold">
              أضف أول مستودع
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map(wh => {
            const c = COLOR_MAP[wh.color] || COLOR_MAP.blue;
            const capPercent = wh.capacity > 0 ? Math.min(100, Math.round((totalItems / (warehouses.length || 1) / wh.capacity) * 100)) : 0;
            return (
              <motion.div
                key={wh.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer",
                  c.border
                )}
                onClick={() => setViewingWh(wh)}
              >
                {/* Card Header */}
                <div className={cn("px-5 py-4 flex items-start justify-between gap-3", c.bg)}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm", c.icon)}>
                      <Warehouse size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-on-surface text-sm leading-tight">{wh.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-on-surface-variant flex-shrink-0" />
                        <p className="text-[11px] text-on-surface-variant truncate max-w-[140px]">{wh.location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Button */}
                  <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === wh.id ? null : wh.id); }}
                      className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"
                    >
                      <MoreVertical size={16} className="text-on-surface-variant" />
                    </button>
                    <AnimatePresence>
                      {menuOpen === wh.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-surface-container-high z-20 min-w-[130px] overflow-hidden"
                        >
                          <button
                            onClick={() => openEdit(wh)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                          >
                            <Edit2 size={14} className="text-primary" /> تعديل
                          </button>
                          <button
                            onClick={() => { setDeleteId(wh.id); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error-container transition-colors"
                          >
                            <Trash2 size={14} /> حذف
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-5 py-4 space-y-3">
                  {/* Manager & Phone */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <User size={12} className="flex-shrink-0" />
                      <span className="truncate">{wh.manager || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <Phone size={12} className="flex-shrink-0" />
                      <span className="truncate font-mono">{wh.phone || '—'}</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant font-medium">الطاقة الاستيعابية</span>
                      <span className={cn("font-bold", c.icon.split(' ')[1])}>{wh.capacity.toLocaleString('ar-SA')} وحدة</span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", c.icon.replace('text-', 'bg-').split(' ')[0])}
                        initial={{ width: 0 }}
                        animate={{ width: `${capPercent}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <p className="text-[10px] text-on-surface-variant">{capPercent}% مشغول</p>
                  </div>

                  {wh.notes && (
                    <p className="text-[11px] text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 leading-relaxed line-clamp-2">
                      {wh.notes}
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 border-t border-surface-container-low flex items-center justify-between bg-surface-container-lowest/50">
                  <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold", c.badge)}>
                    {COLOR_LABELS[wh.color]}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(wh); }}
                      className={cn("p-1.5 rounded-lg transition-all hover:bg-surface-container-high", c.icon.split(' ')[1])}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteId(wh.id); }}
                      className="p-1.5 rounded-lg text-error hover:bg-error-container transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Add New Card */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAdd}
            className="rounded-2xl border-2 border-dashed border-surface-container-high bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/30 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px] text-on-surface-variant group"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-container-high group-hover:bg-primary-fixed/30 flex items-center justify-center transition-colors">
              <Plus size={24} className="group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-bold group-hover:text-primary transition-colors">إضافة مستودع جديد</span>
          </motion.button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-on-background/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-lg max-h-[92vh] bg-surface-container-lowest shadow-2xl flex flex-col rounded-3xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-surface-container-low flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-on-surface">
                    {editingId ? 'تعديل بيانات المستودع' : 'إضافة مستودع جديد'}
                  </h2>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">أدخل بيانات المستودع بدقة</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-surface-container-low rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup label="اسم المستودع" placeholder="مثال: المستودع الرئيسي" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
                  <FieldGroup label="الموقع / العنوان" placeholder="المدينة – المنطقة" value={form.location} onChange={v => setForm({ ...form, location: v })} required />
                  <FieldGroup label="مدير المستودع" placeholder="الاسم الكامل" value={form.manager} onChange={v => setForm({ ...form, manager: v })} />
                  <FieldGroup label="رقم الهاتف" placeholder="05XXXXXXXX" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
                  <FieldGroup label="الطاقة الاستيعابية (وحدة)" placeholder="مثال: 500" type="number" value={form.capacity} onChange={v => setForm({ ...form, capacity: v })} />

                  {/* Color Picker */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant">لون المستودع</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_OPTIONS.map(color => {
                        const c = COLOR_MAP[color];
                        return (
                          <button
                            key={color}
                            onClick={() => setForm({ ...form, color })}
                            title={COLOR_LABELS[color]}
                            className={cn(
                              "w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center",
                              c.icon,
                              form.color === color ? `border-current ring-2 ${c.ring} scale-110` : "border-transparent opacity-60 hover:opacity-100"
                            )}
                          >
                            {form.color === color && <CheckCircle2 size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant">ملاحظات</label>
                  <textarea
                    rows={2}
                    placeholder="وصف المستودع أو أي ملاحظات..."
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary transition-all text-sm outline-none resize-none"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-surface-container-low flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm border border-surface-container-high text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name || !form.location}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {editingId ? 'حفظ التعديلات' : 'إضافة المستودع'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewingWh && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-on-background/20 backdrop-blur-sm"
              onClick={() => setViewingWh(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-md bg-surface-container-lowest shadow-2xl flex flex-col rounded-3xl overflow-hidden"
            >
              {(() => {
                const c = COLOR_MAP[viewingWh.color];
                return (
                  <>
                    <div className={cn("px-6 py-5 flex items-center gap-4", c.bg)}>
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm", c.icon)}>
                        <Warehouse size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-extrabold text-on-surface leading-tight">{viewingWh.name}</h2>
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin size={13} className="text-on-surface-variant flex-shrink-0" />
                          <p className="text-xs text-on-surface-variant truncate">{viewingWh.location}</p>
                        </div>
                      </div>
                      <button onClick={() => setViewingWh(null)} className="p-1.5 hover:bg-black/5 rounded-full transition-colors flex-shrink-0">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <InfoBlock icon={<User size={14} />} label="المدير" value={viewingWh.manager || '—'} />
                        <InfoBlock icon={<Phone size={14} />} label="الهاتف" value={viewingWh.phone || '—'} mono />
                        <InfoBlock icon={<Layers size={14} />} label="الطاقة الاستيعابية" value={`${viewingWh.capacity.toLocaleString('ar-SA')} وحدة`} />
                        <InfoBlock icon={<Package size={14} />} label="الأصناف المخزنة" value={`${inventoryItems.reduce((s, i) => s + i.quantity, 0).toLocaleString('ar-SA')} وحدة`} />
                      </div>
                      {viewingWh.notes && (
                        <div className="bg-surface-container-low rounded-xl p-4 text-sm text-on-surface-variant leading-relaxed">
                          {viewingWh.notes}
                        </div>
                      )}
                    </div>

                    <div className="px-6 pb-6 flex gap-3">
                      <button
                        onClick={() => { setViewingWh(null); openEdit(viewingWh); }}
                        className={cn("flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors", c.bg, c.icon.split(' ')[1], `hover:opacity-80`)}
                      >
                        <Edit2 size={16} />تعديل
                      </button>
                      <button
                        onClick={() => { setDeleteId(viewingWh.id); setViewingWh(null); }}
                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-error-container text-error flex items-center justify-center gap-2 hover:bg-error-container/80 transition-colors"
                      >
                        <Trash2 size={16} />حذف
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-xl relative z-10"
            >
              <div className="w-12 h-12 bg-error-container rounded-xl flex items-center justify-center mb-4">
                <Trash2 size={22} className="text-error" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">تأكيد الحذف</h3>
              <p className="text-on-surface-variant text-sm mb-6">هل أنت متأكد من حذف هذا المستودع؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-on-surface border border-surface-container-high hover:bg-surface-container-low transition-colors">
                  إلغاء
                </button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-error text-white hover:bg-error/90 transition-colors shadow-lg shadow-error/20">
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, bg, sub }: {
  label: string; value: string; icon: React.ReactNode;
  color: string; bg: string; sub?: string;
}) {
  return (
    <div className={cn("rounded-2xl p-5 border border-surface-container-high shadow-sm", bg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-on-surface-variant mb-1 truncate">{label}</p>
          <p className={cn("text-xl font-extrabold leading-tight", color.split(' ')[0])}>{value}</p>
          {sub && <p className="text-[11px] text-on-surface-variant mt-1">{sub}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ icon, label, value, mono }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-on-surface-variant">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-sm font-bold text-on-surface", mono && "font-mono")}>{value}</p>
    </div>
  );
}
