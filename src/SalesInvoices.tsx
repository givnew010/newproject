/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus, Filter, ArrowUpDown, Download, Edit2, Trash2, X,
  ChevronRight, ChevronLeft, FileText, Eye, Trash, PackagePlus,
  Package, TrendingUp, AlertCircle, ShoppingBag, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SalesInvoice, InvoiceLineItem, InventoryItem, ItemStatus } from './types';

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

const INITIAL_INVOICES: SalesInvoice[] = [
  {
    id: 'sale-001',
    invoiceNumber: 'SO-2025-001',
    customer: 'أحمد محمد العمري',
    date: '2025-03-15',
    notes: 'عميل منتظم',
    items: [
      { id: 'sli-1', inventoryItemId: '01', name: 'آيفون 15 برو ماكس', quantity: 2, price: 5800, total: 11600 },
    ],
    totalAmount: 11600,
  },
  {
    id: 'sale-002',
    invoiceNumber: 'SO-2025-002',
    customer: 'شركة التقنية المتقدمة',
    date: '2025-03-22',
    notes: '',
    items: [
      { id: 'sli-2', inventoryItemId: '02', name: 'سماعات سوني WH-1000XM5', quantity: 2, price: 1600, total: 3200 },
    ],
    totalAmount: 3200,
  },
];

function newLineItem(): InvoiceLineItem {
  return { id: Math.random().toString(36).substr(2, 9), name: '', quantity: 1, price: 0, total: 0 };
}

interface FormState {
  invoiceNumber: string;
  customer: string;
  date: string;
  notes: string;
  items: InvoiceLineItem[];
}

const emptyForm = (): FormState => ({
  invoiceNumber: '',
  customer: '',
  date: TODAY,
  notes: '',
  items: [newLineItem()],
});

function FieldGroup({
  label, placeholder, type = 'text', value, onChange,
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
        className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 transition-all text-sm outline-none"
      />
    </div>
  );
}

export default function SalesInvoices({ inventoryItems, onInventoryUpdate }: Props) {
  const [invoices, setInvoices] = useState<SalesInvoice[]>(() => {
    const saved = localStorage.getItem('sales_invoices');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_INVOICES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<SalesInvoice | null>(null);
  const [stockWarning, setStockWarning] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('sales_invoices', JSON.stringify(invoices));
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
    setStockWarning(null);
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

    if (field === 'quantity') {
      const item = form.items[index];
      if (item.inventoryItemId) {
        const invItem = inventoryItems.find(it => it.id === item.inventoryItemId);
        if (invItem && Number(value) > invItem.quantity) {
          setStockWarning(`الكمية المطلوبة (${value}) تتجاوز المخزون المتاح (${invItem.quantity}) لـ "${invItem.name}"`);
          return;
        }
      }
      setStockWarning(null);
    }
  };

  const addLineItem = () => setForm({ ...form, items: [...form.items, newLineItem()] });
  const removeLineItem = (index: number) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setStockWarning(null);
    setIsModalOpen(true);
  };

  const openEdit = (inv: SalesInvoice) => {
    setEditingId(inv.id);
    setForm({
      invoiceNumber: inv.invoiceNumber,
      customer: inv.customer,
      date: inv.date,
      notes: inv.notes ?? '',
      items: inv.items.map(it => ({ ...it })),
    });
    setStockWarning(null);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.invoiceNumber || !form.customer || !form.date) return;
    const items = form.items.map(it => ({
      ...it,
      total: Number(it.quantity) * Number(it.price),
    }));
    const totalAmount = computeTotal(items);

    if (editingId) {
      setInvoices(invoices.map(inv =>
        inv.id === editingId
          ? { ...inv, invoiceNumber: form.invoiceNumber, customer: form.customer, date: form.date, notes: form.notes, items, totalAmount }
          : inv
      ));
    } else {
      const newInv: SalesInvoice = {
        id: Math.random().toString(36).substr(2, 9),
        invoiceNumber: form.invoiceNumber,
        customer: form.customer,
        date: form.date,
        notes: form.notes,
        items,
        totalAmount,
      };
      setInvoices([newInv, ...invoices]);

      const linkedItems = items.filter(it => it.inventoryItemId);
      if (linkedItems.length > 0) {
        const updatedInventory = inventoryItems.map(invItem => {
          const sold = linkedItems
            .filter(it => it.inventoryItemId === invItem.id)
            .reduce((sum, it) => sum + Number(it.quantity), 0);
          if (sold === 0) return invItem;
          const newQty = Math.max(0, invItem.quantity - sold);
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

  const totalRevenue = invoices.reduce((s, inv) => s + inv.totalAmount, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6 flex-1">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-surface-container-high shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-on-surface-variant font-semibold mb-1">إجمالي فواتير المبيعات</p>
              <p className="text-3xl font-extrabold text-green-700">{invoices.length}</p>
              <p className="text-[11px] text-on-surface-variant mt-1">فاتورة مسجلة</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
              <FileText size={22} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-surface-container-high shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-on-surface-variant font-semibold mb-1">إجمالي الإيرادات</p>
              <p className="text-3xl font-extrabold text-green-700">{totalRevenue.toLocaleString('ar-SA')}</p>
              <p className="text-[11px] text-on-surface-variant mt-1">ريال سعودي</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-surface-container-high shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-on-surface-variant font-semibold mb-1">متوسط قيمة الفاتورة</p>
              <p className="text-3xl font-extrabold text-green-700">
                {invoices.length > 0 ? Math.round(totalRevenue / invoices.length).toLocaleString('ar-SA') : '0'}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-1">ريال سعودي</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
              <ShoppingBag size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="bg-white px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant flex items-center gap-2 border border-surface-container-high hover:bg-surface-container-low transition-colors shadow-sm">
            <Filter size={16} />
            <span>تصفية</span>
          </button>
          <button className="bg-white px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant flex items-center gap-2 border border-surface-container-high hover:bg-surface-container-low transition-colors shadow-sm">
            <ArrowUpDown size={16} />
            <span>ترتيب</span>
          </button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="w-full sm:w-auto px-5 py-2.5 bg-white text-on-surface border border-surface-container-high rounded-xl font-bold text-sm hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 shadow-sm">
            <Download size={16} />
            تصدير
          </button>
          <button
            onClick={openAdd}
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-green-500/20 active:scale-95"
          >
            <Plus size={20} />
            <span className="text-sm">إضافة فاتورة مبيعات</span>
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
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">العميل</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">عدد الأصناف</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">إجمالي الفاتورة</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-left">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                      <ShoppingBag size={40} className="opacity-30" />
                      <p className="text-sm font-medium">لا توجد فواتير مبيعات بعد</p>
                      <button onClick={openAdd} className="text-xs text-green-600 hover:underline font-bold">أضف أول فاتورة</button>
                    </div>
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
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <FileText size={15} className="text-green-600" />
                      </div>
                      <span className="text-sm font-bold text-green-700 font-mono">{inv.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center">
                        <User size={13} className="text-on-surface-variant" />
                      </div>
                      <span className="text-sm font-medium text-on-surface">{inv.customer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">{inv.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full">
                      {inv.items.length} صنف
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-green-700">{inv.totalAmount.toLocaleString('ar-SA')}</span>
                    <span className="text-xs text-on-surface-variant mr-1">ر.س</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setViewingInvoice(inv); }}
                        className="p-2 text-on-surface-variant/60 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(inv); }}
                        className="p-2 text-on-surface-variant/60 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setInvoiceToDelete(inv.id); }}
                        className="p-2 text-on-surface-variant/60 hover:text-error hover:bg-error-container rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
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
            عرض {invoices.length} من أصل {invoices.length.toLocaleString('ar-SA')} فاتورة
          </span>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-surface-container-high hover:bg-white transition-all"><ChevronRight size={18} /></button>
            <button className="p-2 rounded-lg border border-surface-container-high bg-white shadow-sm hover:bg-surface-container-low transition-all"><ChevronLeft size={18} /></button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
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
              <div className="px-5 py-4 border-b border-surface-container-low flex items-center justify-between flex-shrink-0 bg-gradient-to-l from-green-50 to-white">
                <div>
                  <h2 className="text-lg font-bold text-on-surface">
                    {editingId ? 'تعديل فاتورة المبيعات' : 'إضافة فاتورة مبيعات جديدة'}
                  </h2>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">أدخل بيانات العميل والأصناف المباعة</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-surface-container-low rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup
                    label="رقم الفاتورة *"
                    placeholder="مثال: SO-2025-003"
                    value={form.invoiceNumber}
                    onChange={v => setForm({ ...form, invoiceNumber: v })}
                  />
                  <FieldGroup
                    label="العميل *"
                    placeholder="اسم العميل أو الشركة"
                    value={form.customer}
                    onChange={v => setForm({ ...form, customer: v })}
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
                      className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 transition-all text-sm outline-none resize-none"
                    />
                  </div>
                </div>

                {stockWarning && (
                  <div className="flex items-center gap-2 bg-orange-50 text-orange-700 rounded-lg px-3 py-2 text-xs font-medium border border-orange-200">
                    <AlertCircle size={14} />
                    {stockWarning}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-on-surface">جدول الأصناف المباعة</h3>
                    <button
                      onClick={addLineItem}
                      className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
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
                            <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant">الصنف</th>
                            <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant w-24">الكمية</th>
                            <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant w-28">سعر البيع (ر.س)</th>
                            <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant w-28">الإجمالي</th>
                            <th className="px-3 py-2.5 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-low">
                          {form.items.map((item, index) => {
                            const invItem = inventoryItems.find(it => it.id === item.inventoryItemId);
                            const overStock = invItem ? Number(item.quantity) > invItem.quantity : false;
                            return (
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
                                    className="w-full bg-surface-container-high rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all border-none appearance-none"
                                  >
                                    <option value="">— اختر صنفاً من المخزون —</option>
                                    {inventoryItems.map(inv => (
                                      <option key={inv.id} value={inv.id}>
                                        {inv.name} ({inv.sku}) — متاح: {inv.quantity}
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
                                    className={cn(
                                      "w-full rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 transition-all border-none text-center",
                                      overStock
                                        ? "bg-orange-50 focus:ring-orange-400 text-orange-700 font-bold"
                                        : "bg-surface-container-high focus:ring-green-500"
                                    )}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={item.price}
                                    onChange={e => updateLineItem(index, 'price', Number(e.target.value))}
                                    className="w-full bg-surface-container-high rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all border-none text-center"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <span className="block text-center font-bold text-green-700 text-sm">
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
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-surface-container-low/40 border-t border-surface-container-high">
                          <tr>
                            <td colSpan={3} className="px-3 py-2.5 text-left text-xs font-bold text-on-surface-variant">الإجمالي الكلي</td>
                            <td className="px-3 py-2.5 text-center font-bold text-green-700">
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

              <div className="p-4 sm:p-5 border-t border-surface-container-low flex-shrink-0 space-y-3">
                {!editingId && form.items.some(it => it.inventoryItemId) && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-lg px-3 py-2 text-xs font-medium border border-green-200">
                    <Package size={14} />
                    سيتم خصم الكميات المباعة من المخزون تلقائياً عند الحفظ
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm border border-surface-container-high text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!form.invoiceNumber || !form.customer || !form.date}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {editingId ? 'حفظ التعديلات' : 'حفظ الفاتورة'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Invoice Modal */}
      <AnimatePresence>
        {viewingInvoice && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-on-background/20 backdrop-blur-sm"
              onClick={() => setViewingInvoice(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-lg max-h-[92vh] bg-surface-container-lowest shadow-2xl flex flex-col rounded-3xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-surface-container-low flex items-center justify-between flex-shrink-0 bg-gradient-to-l from-green-50 to-white">
                <div>
                  <p className="text-[10px] text-on-surface-variant font-medium mb-0.5">فاتورة مبيعات</p>
                  <h2 className="text-lg font-bold text-green-700 font-mono">{viewingInvoice.invoiceNumber}</h2>
                </div>
                <button onClick={() => setViewingInvoice(null)} className="p-1.5 hover:bg-surface-container-low rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase">العميل</p>
                    <p className="font-bold text-on-surface">{viewingInvoice.customer}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase">التاريخ</p>
                    <p className="font-medium text-on-surface">{viewingInvoice.date}</p>
                  </div>
                </div>

                {viewingInvoice.notes && (
                  <div className="bg-surface-container-low rounded-xl p-3 text-sm text-on-surface-variant">
                    {viewingInvoice.notes}
                  </div>
                )}

                <div className="rounded-xl border border-surface-container-high overflow-hidden">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-surface-container-low/60 border-b border-surface-container-high">
                      <tr>
                        <th className="px-4 py-2.5 text-[11px] font-bold text-on-surface-variant">الصنف</th>
                        <th className="px-4 py-2.5 text-[11px] font-bold text-on-surface-variant text-center w-16">الكمية</th>
                        <th className="px-4 py-2.5 text-[11px] font-bold text-on-surface-variant text-center">السعر</th>
                        <th className="px-4 py-2.5 text-[11px] font-bold text-on-surface-variant text-center">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                      {viewingInvoice.items.map((it) => (
                        <tr key={it.id} className="bg-white">
                          <td className="px-4 py-2.5 font-medium text-on-surface">{it.name}</td>
                          <td className="px-4 py-2.5 text-center text-on-surface-variant">{it.quantity}</td>
                          <td className="px-4 py-2.5 text-center text-on-surface-variant">{it.price.toLocaleString('ar-SA')}</td>
                          <td className="px-4 py-2.5 text-center font-bold text-green-700">{it.total.toLocaleString('ar-SA')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-green-50 border-t-2 border-green-200">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-left text-sm font-bold text-green-700">إجمالي الفاتورة</td>
                        <td className="px-4 py-3 text-center font-extrabold text-green-700 text-base">
                          {viewingInvoice.totalAmount.toLocaleString('ar-SA')} ر.س
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="p-5 border-t border-surface-container-low flex gap-3">
                <button
                  onClick={() => { setViewingInvoice(null); openEdit(viewingInvoice); }}
                  className="flex-1 bg-green-50 text-green-700 py-3 rounded-xl font-bold hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} />تعديل
                </button>
                <button
                  onClick={() => setInvoiceToDelete(viewingInvoice.id)}
                  className="flex-1 bg-error-container text-error py-3 rounded-xl font-bold hover:bg-error-container/80 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />حذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {invoiceToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setInvoiceToDelete(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-xl relative z-10"
            >
              <h3 className="text-xl font-bold text-on-surface mb-2">تأكيد الحذف</h3>
              <p className="text-on-surface-variant text-sm mb-6">هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setInvoiceToDelete(null)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors">إلغاء</button>
                <button onClick={confirmDelete} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-error text-white hover:bg-error/90 transition-colors shadow-lg shadow-error/20">تأكيد الحذف</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
