/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus, Filter, ArrowUpDown, Download, Edit2, Trash2, X,
  ChevronRight, ChevronLeft, FileText, Eye, Trash, PackagePlus, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PurchaseInvoice, InvoiceLineItem, InventoryItem, ItemStatus } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getStatus(quantity: number): ItemStatus {
  if (quantity <= 0) return 'out-of-stock';
  if (quantity <= 5) return 'low-stock';
  return 'in-stock';
}

interface Props {
  inventoryItems: InventoryItem[];
  onInventoryUpdate: (items: InventoryItem[]) => void;
}

const TODAY = new Date().toISOString().split('T')[0];

const INITIAL_INVOICES: PurchaseInvoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'PO-2025-001',
    supplier: 'شركة الرياض للإلكترونيات',
    date: '2025-03-10',
    notes: 'دفعة أولى من طلبية الربع الأول',
    items: [
      { id: 'li-1', name: 'آيفون 15 برو ماكس', quantity: 10, price: 5200, total: 52000 },
      { id: 'li-2', name: 'سماعات سوني WH-1000XM5', quantity: 5, price: 1400, total: 7000 },
    ],
    totalAmount: 59000,
  },
  {
    id: 'inv-002',
    invoiceNumber: 'PO-2025-002',
    supplier: 'مؤسسة النور للتجارة',
    date: '2025-03-18',
    notes: '',
    items: [
      { id: 'li-3', name: 'ماك بوك برو M3', quantity: 3, price: 8500, total: 25500 },
    ],
    totalAmount: 25500,
  },
];

function newLineItem(): InvoiceLineItem {
  return { id: Math.random().toString(36).substr(2, 9), name: '', quantity: 1, price: 0, total: 0 };
}

interface FormState {
  invoiceNumber: string;
  supplier: string;
  date: string;
  notes: string;
  items: InvoiceLineItem[];
}

const emptyForm = (): FormState => ({
  invoiceNumber: '',
  supplier: '',
  date: TODAY,
  notes: '',
  items: [newLineItem()],
});

export default function PurchaseInvoices({ inventoryItems, onInventoryUpdate }: Props) {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(() => {
    const saved = localStorage.getItem('purchase_invoices');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_INVOICES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);

  useEffect(() => {
    localStorage.setItem('purchase_invoices', JSON.stringify(invoices));
  }, [invoices]);

  const computeTotal = (items: InvoiceLineItem[]) =>
    items.reduce((sum, it) => sum + it.total, 0);

  const selectInventoryItem = (index: number, inventoryItemId: string) => {
    const invItem = inventoryItems.find(it => it.id === inventoryItemId);
    const updated = form.items.map((it, i) => {
      if (i !== index) return it;
      const price = invItem ? invItem.price : it.price;
      const name = invItem ? invItem.name : it.name;
      return { ...it, inventoryItemId, name, price, total: Number(it.quantity) * price };
    });
    setForm({ ...form, items: updated });
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
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

  const addLineItem = () => setForm({ ...form, items: [...form.items, newLineItem()] });

  const removeLineItem = (index: number) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (inv: PurchaseInvoice) => {
    setEditingId(inv.id);
    setForm({
      invoiceNumber: inv.invoiceNumber,
      supplier: inv.supplier,
      date: inv.date,
      notes: inv.notes ?? '',
      items: inv.items.map(it => ({ ...it })),
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.invoiceNumber || !form.supplier || !form.date) return;
    const items = form.items.map(it => ({
      ...it,
      total: Number(it.quantity) * Number(it.price),
    }));
    const totalAmount = computeTotal(items);

    if (editingId) {
      setInvoices(invoices.map(inv =>
        inv.id === editingId
          ? { ...inv, invoiceNumber: form.invoiceNumber, supplier: form.supplier, date: form.date, notes: form.notes, items, totalAmount }
          : inv
      ));
    } else {
      const newInv: PurchaseInvoice = {
        id: Math.random().toString(36).substr(2, 9),
        invoiceNumber: form.invoiceNumber,
        supplier: form.supplier,
        date: form.date,
        notes: form.notes,
        items,
        totalAmount,
      };
      setInvoices([newInv, ...invoices]);

      // Update inventory quantities for linked items
      const itemsWithInventoryLink = items.filter(it => it.inventoryItemId);
      if (itemsWithInventoryLink.length > 0) {
        const updatedInventory = inventoryItems.map(invItem => {
          const purchased = itemsWithInventoryLink
            .filter(it => it.inventoryItemId === invItem.id)
            .reduce((sum, it) => sum + Number(it.quantity), 0);
          if (purchased === 0) return invItem;
          const newQty = invItem.quantity + purchased;
          return { ...invItem, quantity: newQty, status: getStatus(newQty) };
        });
        onInventoryUpdate(updatedInventory);
      }
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (!invoiceToDelete) return;
    setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete));
    if (viewingInvoice?.id === invoiceToDelete) setViewingInvoice(null);
    setInvoiceToDelete(null);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 flex-1">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="bg-white px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant flex items-center gap-2 border border-surface-container-high hover:bg-surface-container-low transition-colors shadow-sm">
            <Filter size={18} />
            <span>تصفية</span>
          </button>
          <button className="bg-white px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant flex items-center gap-2 border border-surface-container-high hover:bg-surface-container-low transition-colors shadow-sm">
            <ArrowUpDown size={18} />
            <span>ترتيب</span>
          </button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="w-full sm:w-auto px-6 py-2.5 bg-white text-on-surface border border-surface-container-high rounded-xl font-bold text-sm hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 shadow-sm">
            <Download size={18} />
            تصدير البيانات
          </button>
          <button
            onClick={openAdd}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-container text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus size={20} />
            <span className="text-sm">إضافة فاتورة جديدة</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-surface-container-low">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-surface-container-low/50 border-b border-surface-container-high">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">رقم الفاتورة</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">المورد</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">عدد الأصناف</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">إجمالي الفاتورة</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-left">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-on-surface-variant text-sm">
                    لا توجد فواتير مشتريات بعد. اضغط "إضافة فاتورة جديدة" للبدء.
                  </td>
                </tr>
              )}
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setViewingInvoice(inv)}
                  className="hover:bg-surface-container-low/30 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-fixed/40 flex items-center justify-center">
                        <FileText size={15} className="text-primary" />
                      </div>
                      <span className="text-sm font-bold text-primary font-mono">{inv.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-on-surface">{inv.supplier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">{inv.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full">
                      {inv.items.length} صنف
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-on-surface">
                    {inv.totalAmount.toLocaleString('ar-SA')} ر.س
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setViewingInvoice(inv); }}
                        className="p-2 text-on-surface-variant/60 hover:text-primary hover:bg-primary-fixed/30 rounded-lg transition-all"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(inv); }}
                        className="p-2 text-on-surface-variant/60 hover:text-primary hover:bg-primary-fixed/30 rounded-lg transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setInvoiceToDelete(inv.id); }}
                        className="p-2 text-on-surface-variant/60 hover:text-error hover:bg-error-container rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-surface-container-low/30 border-t border-surface-container-high flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-medium">
            عرض 1-{invoices.length} من أصل {invoices.length.toLocaleString('ar-SA')} فاتورة
          </span>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-surface-container-high hover:bg-white transition-all disabled:opacity-50">
              <ChevronRight size={20} />
            </button>
            <button className="p-2 rounded-lg border border-surface-container-high bg-white shadow-sm hover:bg-surface-container-low transition-all">
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-on-background/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-2xl max-h-[92vh] bg-surface-container-lowest shadow-2xl flex flex-col rounded-3xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-surface-container-low flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-on-surface">
                    {editingId ? 'تعديل فاتورة المشتريات' : 'إضافة فاتورة مشتريات جديدة'}
                  </h2>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">أدخل بيانات الفاتورة والأصناف بدقة</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-surface-container-low rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                {/* Invoice Header Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup
                    label="رقم الفاتورة *"
                    placeholder="مثال: PO-2025-003"
                    value={form.invoiceNumber}
                    onChange={v => setForm({ ...form, invoiceNumber: v })}
                  />
                  <FieldGroup
                    label="المورد *"
                    placeholder="اسم الشركة أو المورد"
                    value={form.supplier}
                    onChange={v => setForm({ ...form, supplier: v })}
                  />
                  <FieldGroup
                    label="تاريخ الفاتورة *"
                    placeholder=""
                    type="date"
                    value={form.date}
                    onChange={v => setForm({ ...form, date: v })}
                  />
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant">ملاحظة</label>
                    <textarea
                      rows={2}
                      placeholder="أي ملاحظات تتعلق بالفاتورة..."
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary transition-all text-sm outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-on-surface">جدول الأصناف</h3>
                    <button
                      onClick={addLineItem}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary-fixed/30 hover:bg-primary-fixed/50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <PackagePlus size={15} />
                      إضافة صنف
                    </button>
                  </div>

                  <div className="rounded-xl border border-surface-container-high overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-surface-container-low/60 border-b border-surface-container-high">
                          <tr>
                            <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant">اسم الصنف</th>
                            <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant w-24">الكمية</th>
                            <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant w-28">السعر (ر.س)</th>
                            <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant w-28">الإجمالي</th>
                            <th className="px-3 py-2.5 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-low">
                          {form.items.map((item, index) => (
                            <tr key={item.id} className="bg-white">
                              <td className="px-3 py-2">
                                <select
                                  value={item.inventoryItemId ?? ''}
                                  onChange={e => {
                                    if (e.target.value === '') {
                                      updateLineItem(index, 'name', '');
                                      updateLineItem(index, 'inventoryItemId' as keyof InvoiceLineItem, '');
                                    } else {
                                      selectInventoryItem(index, e.target.value);
                                    }
                                  }}
                                  className="w-full bg-surface-container-high rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all border-none appearance-none"
                                >
                                  <option value="">— اختر صنفاً من المخزون —</option>
                                  {inventoryItems.map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                      {inv.name} ({inv.sku}) — متوفر: {inv.quantity}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={e => updateLineItem(index, 'quantity', Number(e.target.value))}
                                  className="w-full bg-surface-container-high rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all border-none text-center"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={item.price}
                                  onChange={e => updateLineItem(index, 'price', Number(e.target.value))}
                                  className="w-full bg-surface-container-high rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all border-none text-center"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <span className="block text-center font-bold text-primary text-sm">
                                  {(item.quantity * item.price).toLocaleString('ar-SA')}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => removeLineItem(index)}
                                  disabled={form.items.length === 1}
                                  className="p-1 text-on-surface-variant/40 hover:text-error hover:bg-error-container rounded-lg transition-all disabled:opacity-30"
                                >
                                  <Trash size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-surface-container-low/40 border-t border-surface-container-high">
                          <tr>
                            <td colSpan={3} className="px-3 py-2.5 text-left text-xs font-bold text-on-surface-variant">
                              الإجمالي الكلي
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-primary">
                              {form.items.reduce((s, it) => s + it.quantity * it.price, 0).toLocaleString('ar-SA')} ر.س
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-surface-container-low flex-shrink-0 space-y-3">
                {!editingId && form.items.some(it => it.inventoryItemId) && (
                  <div className="flex items-center gap-2 bg-primary-fixed/30 text-primary rounded-lg px-3 py-2 text-xs font-medium">
                    <Package size={14} />
                    سيتم تحديث كميات الأصناف المرتبطة في المخزون تلقائياً عند الحفظ
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-gradient-to-r from-primary to-primary-container text-white py-2.5 rounded-lg font-bold hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"
                  >
                    حفظ الفاتورة
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-surface-container-high text-on-surface py-2.5 rounded-lg font-bold hover:bg-surface-container-highest transition-all active:scale-95 text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {invoiceToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setInvoiceToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-xl relative z-10"
            >
              <h3 className="text-xl font-bold text-on-surface mb-2">تأكيد الحذف</h3>
              <p className="text-on-surface-variant text-sm mb-6">
                هل أنت متأكد من رغبتك في حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setInvoiceToDelete(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-error text-white hover:bg-error/90 transition-colors shadow-lg shadow-error/20"
                >
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Invoice Modal */}
      <AnimatePresence>
        {viewingInvoice && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setViewingInvoice(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-surface-container-lowest rounded-3xl max-w-xl w-full shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-surface-container-low flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">تفاصيل الفاتورة</h3>
                  <span className="text-xs text-on-surface-variant font-mono">{viewingInvoice.invoiceNumber}</span>
                </div>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-5">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard label="المورد" value={viewingInvoice.supplier} />
                  <InfoCard label="التاريخ" value={viewingInvoice.date} />
                  <InfoCard label="عدد الأصناف" value={`${viewingInvoice.items.length} صنف`} />
                  <InfoCard label="إجمالي الفاتورة" value={`${viewingInvoice.totalAmount.toLocaleString('ar-SA')} ر.س`} highlight />
                </div>

                {/* Items Table */}
                <div>
                  <h4 className="text-xs font-bold text-on-surface-variant mb-2">أصناف الفاتورة</h4>
                  <div className="rounded-xl border border-surface-container-high overflow-hidden">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-surface-container-low/60 border-b border-surface-container-high">
                        <tr>
                          <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant">اسم الصنف</th>
                          <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant text-center w-20">الكمية</th>
                          <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant text-center w-24">السعر</th>
                          <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant text-center w-28">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-low">
                        {viewingInvoice.items.map(it => (
                          <tr key={it.id} className="hover:bg-surface-container-low/20">
                            <td className="px-3 py-2.5 font-medium text-on-surface">{it.name}</td>
                            <td className="px-3 py-2.5 text-center text-on-surface-variant">{it.quantity}</td>
                            <td className="px-3 py-2.5 text-center text-on-surface-variant">{it.price.toLocaleString('ar-SA')}</td>
                            <td className="px-3 py-2.5 text-center font-bold text-primary">{it.total.toLocaleString('ar-SA')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-surface-container-low/40 border-t border-surface-container-high">
                        <tr>
                          <td colSpan={3} className="px-3 py-2.5 text-left text-xs font-bold text-on-surface-variant">الإجمالي</td>
                          <td className="px-3 py-2.5 text-center font-bold text-primary">
                            {viewingInvoice.totalAmount.toLocaleString('ar-SA')} ر.س
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {viewingInvoice.notes && (
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant mb-2">ملاحظات</p>
                    <p className="text-sm text-on-surface bg-surface-container-low/50 p-4 rounded-2xl border border-surface-container-low leading-relaxed">
                      {viewingInvoice.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-surface-container-low bg-surface-container-lowest flex gap-3">
                <button
                  onClick={() => { setViewingInvoice(null); openEdit(viewingInvoice); }}
                  className="flex-1 bg-primary-container text-on-primary-container py-3 rounded-xl font-bold hover:bg-primary-container/80 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 size={18} />
                  تعديل الفاتورة
                </button>
                <button
                  onClick={() => setInvoiceToDelete(viewingInvoice.id)}
                  className="flex-1 bg-error-container text-error py-3 rounded-xl font-bold hover:bg-error-container/80 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  حذف الفاتورة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldGroup({
  label, placeholder, type = 'text', value, onChange
}: {
  label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-on-surface-variant">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary transition-all text-sm outline-none"
      />
    </div>
  );
}

function InfoCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-surface-container-low/50 p-4 rounded-2xl border border-surface-container-low">
      <p className="text-xs font-bold text-on-surface-variant mb-1.5">{label}</p>
      <p className={cn('text-sm font-bold', highlight ? 'text-primary' : 'text-on-surface')}>{value}</p>
    </div>
  );
}
