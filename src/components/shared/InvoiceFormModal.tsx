import React from 'react';
import { X, PackagePlus, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InvoiceLineItem, InventoryItem } from '../../types';
import { Input, Button } from '../ui';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InvoiceFormState {
  invoiceNumber: string;
  party: string;
  date: string;
  notes: string;
  items: InvoiceLineItem[];
}

interface InvoiceFormModalProps {
  mode: 'sale' | 'purchase';
  isEditing: boolean;
  form: InvoiceFormState;
  setForm: (form: InvoiceFormState) => void;
  partyList: { id: number | string; name: string }[];
  inventoryItems: InventoryItem[];
  stockWarning?: string | null;
  onSave: () => void;
  onClose: () => void;
  isSaving?: boolean;
}

function newLineItem(): InvoiceLineItem {
  return { id: Math.random().toString(36).substr(2, 9), name: '', quantity: 1, price: 0, total: 0 };
}

export function InvoiceFormModal({
  mode, isEditing, form, setForm, partyList, inventoryItems,
  stockWarning, onSave, onClose, isSaving,
}: InvoiceFormModalProps) {
  const isSale = mode === 'sale';
  const color = isSale ? 'emerald' : 'violet';
  const partyLabel = isSale ? 'العميل' : 'المورد';
  const partyPlaceholder = isSale ? 'اختر العميل...' : 'اختر المورد...';
  const title = isEditing
    ? (isSale ? 'تعديل فاتورة المبيعات' : 'تعديل فاتورة المشتريات')
    : (isSale ? 'فاتورة مبيعات جديدة' : 'فاتورة مشتريات جديدة');
  const subtitle = isSale ? 'أدخل بيانات العميل والأصناف المباعة' : 'أدخل بيانات الفاتورة والأصناف';
  const itemsLabel = isSale ? 'الأصناف المباعة' : 'جدول الأصناف';
  const priceLabel = isSale ? 'سعر البيع' : 'السعر';

  const colorCls = {
    emerald: {
      header: 'from-emerald-50',
      focus: 'focus:ring-emerald-500 focus:border-emerald-500',
      addBtn: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
      total: 'text-emerald-700',
    },
    violet: {
      header: 'from-violet-50',
      focus: 'focus:ring-primary',
      addBtn: 'text-violet-700 bg-violet-50 hover:bg-violet-100 border-violet-200',
      total: 'text-violet-700',
    },
  }[color];

  const updateItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const updated = form.items.map((it, i) => {
      if (i !== index) return it;
      const next = { ...it, [field]: value };
      if (field === 'quantity' || field === 'price') {
        next.total = Number(next.quantity) * Number(next.price);
      }
      return next;
    });
    setForm({ ...form, items: updated });
  };

  const selectInventoryItem = (index: number, itemId: string) => {
    const inv = inventoryItems.find(it => it.id === itemId);
    const updated = form.items.map((it, i) => {
      if (i !== index) return it;
      if (!inv) return { ...it, inventoryItemId: undefined };
      const invPrice = inv.price ?? inv.selling_price ?? 0;
      return { ...it, inventoryItemId: itemId, name: inv.name, price: invPrice, total: Number(it.quantity) * invPrice };
    });
    setForm({ ...form, items: updated });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, newLineItem()] });
  const removeItem = (index: number) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const total = form.items.reduce((s, it) => s + Number(it.quantity) * Number(it.price), 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-[70] w-full max-w-2xl max-h-[92vh] bg-white shadow-2xl flex flex-col rounded-3xl overflow-hidden"
        >
          {/* Header */}
          <div className={cn('px-5 py-4 border-b border-surface-container-low flex items-center justify-between flex-shrink-0 bg-gradient-to-l to-white', colorCls.header)}>
            <div>
              <h2 className="text-base font-extrabold text-on-surface">{title}</h2>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{subtitle}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="رقم الفاتورة *"
                placeholder={isSale ? 'مثال: SO-2025-001' : 'مثال: PO-2025-001'}
                value={form.invoiceNumber}
                onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant">{partyLabel} *</label>
                <select
                  value={form.party}
                  onChange={e => setForm({ ...form, party: e.target.value })}
                  className={cn('w-full bg-surface-container-low border border-surface-container-high rounded-xl px-3 py-2.5 focus:ring-2 transition-all text-sm outline-none', colorCls.focus)}
                >
                  <option value="">{partyPlaceholder}</option>
                  {partyList.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <Input
                label="تاريخ الفاتورة *"
                type="date"
                placeholder=""
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant">ملاحظات</label>
                <textarea
                  rows={2}
                  placeholder="أي ملاحظات تتعلق بالفاتورة..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className={cn('w-full bg-surface-container-low border border-surface-container-high rounded-xl px-3 py-2.5 focus:ring-2 transition-all text-sm outline-none resize-none', colorCls.focus)}
                />
              </div>
            </div>

            {stockWarning && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 rounded-xl px-3 py-2.5 text-xs font-medium border border-amber-200">
                <AlertCircle size={14} />{stockWarning}
              </div>
            )}

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-on-surface">{itemsLabel}</h3>
                <button
                  onClick={addItem}
                  className={cn('flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors border', colorCls.addBtn)}
                >
                  <PackagePlus size={14} />إضافة صنف
                </button>
              </div>

              <div className="rounded-xl border border-surface-container-high overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="bg-surface-container-low/80 border-b border-surface-container-high">
                        <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant">الصنف</th>
                        <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant w-24">الكمية</th>
                        <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant w-28">{priceLabel}</th>
                        <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant w-28">الإجمالي</th>
                        <th className="px-3 py-2.5 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                      {form.items.map((item, index) => {
                        const invItem = inventoryItems.find(it => it.id === item.inventoryItemId);
                        const overStock = isSale && invItem ? Number(item.quantity) > invItem.quantity : false;
                        return (
                          <tr key={item.id} className={cn('bg-white hover:bg-surface-container-low/30 transition-colors', overStock && 'bg-red-50')}>
                            <td className="px-3 py-2">
                              <select
                                value={item.inventoryItemId ?? ''}
                                onChange={e => {
                                  if (e.target.value === '') {
                                    updateItem(index, 'name', '');
                                  } else {
                                    selectInventoryItem(index, e.target.value);
                                  }
                                }}
                                className="w-full bg-surface-container-low border border-surface-container-high rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all appearance-none min-w-[160px]"
                              >
                                <option value="">— اختر صنفاً —</option>
                                {inventoryItems.map(inv => (
                                  <option key={inv.id} value={inv.id} disabled={isSale && inv.quantity === 0}>
                                    {inv.name} ({inv.sku}){isSale && inv.quantity === 0 ? ' - نفذ' : ''}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number" min={1} value={item.quantity}
                                onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                                className="w-full bg-surface-container-low border border-surface-container-high rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number" min={0} step={0.01} value={item.price}
                                onChange={e => updateItem(index, 'price', Number(e.target.value))}
                                className="w-full bg-surface-container-low border border-surface-container-high rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <span className={cn('text-sm font-bold', colorCls.total)}>
                                {(Number(item.quantity) * Number(item.price)).toLocaleString('ar-SA')}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => removeItem(index)}
                                disabled={form.items.length === 1}
                                className="p-1.5 text-error/50 hover:text-error hover:bg-error-container rounded-lg transition-all disabled:opacity-20"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-surface-container-low/50 border-t border-surface-container-high">
                      <tr>
                        <td colSpan={3} className="px-3 py-2.5 text-left text-xs font-bold text-on-surface-variant">الإجمالي الكلي</td>
                        <td className={cn('px-3 py-2.5 text-sm font-extrabold', colorCls.total)}>
                          {total.toLocaleString('ar-SA')} ر.س
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-surface-container-low flex gap-3 flex-shrink-0 bg-surface-container-lowest">
            <Button variant="outline" className="flex-1" onClick={onClose}>إلغاء</Button>
            <Button
              variant={isSale ? 'success' : 'primary'}
              className="flex-1"
              onClick={onSave}
              disabled={!form.invoiceNumber || !form.party || !form.date || isSaving}
            >
              {isEditing ? 'حفظ التعديلات' : (isSale ? 'حفظ فاتورة المبيعات' : 'حفظ فاتورة المشتريات')}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default InvoiceFormModal;
