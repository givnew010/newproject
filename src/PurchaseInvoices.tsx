import React, { useState, useEffect } from 'react';
import {
  Plus, Filter, ArrowUpDown, Download, Edit2, Trash2, X,
  ChevronRight, ChevronLeft, FileText, Eye, Trash, PackagePlus,
  Package, ShoppingCart, TrendingDown, Calendar, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PurchaseInvoice, InvoiceLineItem, InventoryItem, ItemStatus } from './types';
import { usePurchases, useCreatePurchase, useUpdatePurchase, useDeletePurchase, useCreatePurchasePayment, useSuppliers, useInventory } from './hooks/useApi';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getStatus(quantity: number): ItemStatus {
  if (quantity <= 0) return 'out-of-stock';
  if (quantity <= 5) return 'low-stock';
  return 'in-stock';
}

interface Props {
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

function FieldGroup({ label, placeholder, type = 'text', value, onChange }: {
  label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-on-surface-variant">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
      />
    </div>
  );
}

export default function PurchaseInvoices({}: Props) {
  const { invoices = [], loading, error, refetch } = usePurchases();
  const { suppliers = [] } = useSuppliers();
  const { items: inventoryItems = [] } = useInventory();
  const createMutation = useCreatePurchase();
  const updateMutation = useUpdatePurchase();
  const deleteMutation = useDeletePurchase();
  const paymentMutation = useCreatePurchasePayment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ invoice: PurchaseInvoice | null; amount: string; method: string; notes: string }>({ invoice: null, amount: '', method: 'cash', notes: '' });

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

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setIsModalOpen(true); };
  const openEdit = (inv: PurchaseInvoice) => {
    setEditingId(inv.id);
    setForm({ invoiceNumber: inv.invoiceNumber, supplier: inv.supplier, date: inv.date, notes: inv.notes ?? '', items: inv.items.map(it => ({ ...it })) });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.invoiceNumber || !form.supplier || !form.date) return;
    const items = form.items.map(it => ({ ...it, total: Number(it.quantity) * Number(it.price) }));
    const totalAmount = items.reduce((s, it) => s + it.total, 0);

    const invoiceData = {
      invoiceNumber: form.invoiceNumber,
      supplier: form.supplier,
      date: form.date,
      notes: form.notes,
      items,
      totalAmount,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, purchase: invoiceData });
      } else {
        await createMutation.mutateAsync(invoiceData);
      }
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('حدث خطأ أثناء حفظ الفاتورة');
    }
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await deleteMutation.mutateAsync(invoiceToDelete);
      if (viewingInvoice?.id === invoiceToDelete) setViewingInvoice(null);
      setInvoiceToDelete(null);
      refetch();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('حدث خطأ أثناء حذف الفاتورة');
    }
  };

  const handlePayment = async () => {
    if (!paymentModal.invoice || !paymentModal.amount) return;
    try {
      await paymentMutation.mutateAsync({
        id: paymentModal.invoice.id,
        payment: {
          amount: parseFloat(paymentModal.amount),
          method: paymentModal.method,
          notes: paymentModal.notes,
        }
      });
      setPaymentModal({ invoice: null, amount: '', method: 'cash', notes: '' });
      refetch();
      alert('تم إضافة الدفعة بنجاح');
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('حدث خطأ أثناء إضافة الدفعة');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-semibold text-white/80">إجمالي فواتير المشتريات</p>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-white" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{invoices.length}</p>
          <p className="text-xs text-white/70 mt-1">فاتورة مسجلة</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-semibold text-white/80">إجمالي التكاليف</p>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <TrendingDown size={18} className="text-white" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{totalCost.toLocaleString('ar-SA')}</p>
          <p className="text-xs text-white/70 mt-1">ريال سعودي</p>
        </div>
        <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-semibold text-white/80">متوسط قيمة الفاتورة</p>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShoppingCart size={18} className="text-white" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{avgInvoice.toLocaleString('ar-SA')}</p>
          <p className="text-xs text-white/70 mt-1">ريال سعودي</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="bg-white px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant flex items-center gap-2 border border-surface-container-high hover:bg-surface-container-low transition-colors shadow-sm">
            <Filter size={15} /><span>تصفية</span>
          </button>
          <button className="bg-white px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant flex items-center gap-2 border border-surface-container-high hover:bg-surface-container-low transition-colors shadow-sm">
            <ArrowUpDown size={15} /><span>ترتيب</span>
          </button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="w-full sm:w-auto px-4 py-2 bg-white text-on-surface border border-surface-container-high rounded-xl font-bold text-sm hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 shadow-sm">
            <Download size={15} />تصدير
          </button>
          <button
            onClick={openAdd}
            className="w-full sm:w-auto bg-primary text-white px-5 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Plus size={18} />
            <span className="text-sm">فاتورة جديدة</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-surface-container-high">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-surface-container-low/80 border-b border-surface-container-high">
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">رقم الفاتورة</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">المورد</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">التاريخ</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">الأصناف</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">الإجمالي</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                      <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
                        <ShoppingCart size={28} className="text-violet-400" />
                      </div>
                      <p className="text-sm font-medium">لا توجد فواتير مشتريات بعد</p>
                      <button onClick={openAdd} className="text-xs text-primary hover:underline font-bold">
                        أضف أول فاتورة مشتريات
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv, idx) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => setViewingInvoice(inv)}
                    className="border-b border-surface-container-low last:border-0 hover:bg-violet-50/40 transition-colors group cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                          <FileText size={14} className="text-violet-600" />
                        </div>
                        <span className="text-sm font-bold text-violet-700 font-mono">{inv.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-on-surface">{inv.supplier}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <Calendar size={12} />
                        <span className="text-sm">{inv.date}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 bg-surface-container-low text-on-surface-variant text-xs font-bold px-2.5 py-1 rounded-full">
                        <Package size={11} />{inv.items.length} صنف
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-extrabold text-violet-700 font-mono">{inv.totalAmount.toLocaleString('ar-SA')}</span>
                      <span className="text-xs text-on-surface-variant mr-1">ر.س</span>
                    </td>
                    <td className="px-5 py-3.5 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={e => { e.stopPropagation(); setViewingInvoice(inv); }} className="p-2 text-on-surface-variant/50 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all">
                          <Eye size={15} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setPaymentModal({ invoice: inv, amount: '', method: 'cash', notes: '' }); }} className="p-2 text-on-surface-variant/50 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                          <CreditCard size={15} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); openEdit(inv); }} className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-primary-fixed/50 rounded-xl transition-all">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setInvoiceToDelete(inv.id); }} className="p-2 text-on-surface-variant/50 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {invoices.length > 0 && (
          <div className="px-5 py-3.5 bg-surface-container-low/50 border-t border-surface-container-high flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-medium">
              {invoices.length} فاتورة مشتريات
            </span>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-lg border border-surface-container-high hover:bg-white transition-all"><ChevronRight size={16} /></button>
              <button className="p-1.5 rounded-lg border border-surface-container-high bg-white shadow-sm hover:bg-surface-container-low transition-all"><ChevronLeft size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-2xl max-h-[92vh] bg-white shadow-2xl flex flex-col rounded-3xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-surface-container-low flex items-center justify-between flex-shrink-0 bg-gradient-to-l from-violet-50 to-white">
                <div>
                  <h2 className="text-base font-extrabold text-on-surface">
                    {editingId ? 'تعديل فاتورة المشتريات' : 'فاتورة مشتريات جديدة'}
                  </h2>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">أدخل بيانات الفاتورة والأصناف</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup label="رقم الفاتورة *" placeholder="مثال: PO-2025-003" value={form.invoiceNumber} onChange={v => setForm({ ...form, invoiceNumber: v })} />
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">المورد *</label>
                    <select
                      value={form.supplier}
                      onChange={e => setForm({ ...form, supplier: e.target.value })}
                      className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm outline-none"
                    >
                      <option value="">اختر المورد...</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  <FieldGroup label="تاريخ الفاتورة *" placeholder="" type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} />
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">ملاحظات</label>
                    <textarea
                      rows={2}
                      placeholder="أي ملاحظات تتعلق بالفاتورة..."
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary transition-all text-sm outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-on-surface">جدول الأصناف</h3>
                    <button
                      onClick={addLineItem}
                      className="flex items-center gap-1.5 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition-colors border border-violet-200"
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
                            <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant w-28">السعر</th>
                            <th className="px-3 py-2.5 text-[11px] font-bold text-on-surface-variant w-28">الإجمالي</th>
                            <th className="px-3 py-2.5 w-10" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-low">
                          {form.items.map((item, index) => (
                            <tr key={item.id} className="bg-white hover:bg-surface-container-low/30 transition-colors">
                              <td className="px-3 py-2">
                                <select
                                  value={item.inventoryItemId ?? ''}
                                  onChange={e => {
                                    if (e.target.value === '') {
                                      updateLineItem(index, 'name', '');
                                    } else {
                                      selectInventoryItem(index, e.target.value);
                                    }
                                  }}
                                  className="w-full bg-surface-container-low border border-surface-container-high rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
                                >
                                  <option value="">— اختر صنفاً —</option>
                                  {inventoryItems.map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                      {inv.name} ({inv.sku})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number" min={1} value={item.quantity}
                                  onChange={e => updateLineItem(index, 'quantity', Number(e.target.value))}
                                  className="w-full bg-surface-container-low border border-surface-container-high rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-center"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number" min={0} step={0.01} value={item.price}
                                  onChange={e => updateLineItem(index, 'price', Number(e.target.value))}
                                  className="w-full bg-surface-container-low border border-surface-container-high rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-center"
                                />
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-violet-700 font-mono text-sm">
                                {(Number(item.quantity) * Number(item.price)).toLocaleString('ar-SA')}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => removeLineItem(index)}
                                  disabled={form.items.length === 1}
                                  className="p-1.5 text-on-surface-variant/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
                                >
                                  <Trash size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-violet-50 border-t border-violet-200">
                            <td colSpan={3} className="px-3 py-3 text-xs font-bold text-violet-700">الإجمالي الكلي</td>
                            <td className="px-3 py-3 text-center font-extrabold text-violet-700 font-mono">
                              {form.items.reduce((s, it) => s + Number(it.quantity) * Number(it.price), 0).toLocaleString('ar-SA')} ر.س
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-surface-container-low flex-shrink-0 space-y-3">
                {!editingId && form.items.some(it => it.inventoryItemId) && (
                  <div className="flex items-center gap-2 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl px-3 py-2.5 text-xs font-medium">
                    <Package size={14} />
                    سيتم تحديث كميات الأصناف المرتبطة في المخزون تلقائياً عند الحفظ
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-sm border border-surface-container-high text-on-surface hover:bg-surface-container-low transition-colors">
                    إلغاء
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!form.invoiceNumber || !form.supplier || !form.date}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {editingId ? 'حفظ التعديلات' : 'إضافة الفاتورة'}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingInvoice(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-lg max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col"
            >
              <div className="bg-gradient-to-l from-violet-50 to-white px-5 py-4 border-b border-surface-container-low flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <FileText size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-on-surface font-mono">{viewingInvoice.invoiceNumber}</h3>
                    <p className="text-xs text-on-surface-variant">{viewingInvoice.date}</p>
                  </div>
                </div>
                <button onClick={() => setViewingInvoice(null)} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container-low rounded-xl p-3">
                    <p className="text-[11px] text-on-surface-variant font-medium mb-1">المورد</p>
                    <p className="text-sm font-bold text-on-surface">{viewingInvoice.supplier}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-xl p-3">
                    <p className="text-[11px] text-on-surface-variant font-medium mb-1">الإجمالي</p>
                    <p className="text-sm font-extrabold text-violet-700 font-mono">{viewingInvoice.totalAmount.toLocaleString('ar-SA')} ر.س</p>
                  </div>
                </div>
                {viewingInvoice.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-700 font-medium">{viewingInvoice.notes}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-extrabold text-on-surface mb-3">الأصناف ({viewingInvoice.items.length})</h4>
                  <div className="space-y-2">
                    {viewingInvoice.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2.5 px-3 bg-surface-container-low rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{item.name}</p>
                          <p className="text-xs text-on-surface-variant">{item.quantity} × {item.price.toLocaleString('ar-SA')} ر.س</p>
                        </div>
                        <p className="text-sm font-extrabold text-violet-700 font-mono">{item.total.toLocaleString('ar-SA')} ر.س</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-surface-container-low flex gap-2 flex-shrink-0">
                <button onClick={() => { openEdit(viewingInvoice); setViewingInvoice(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                  <Edit2 size={15} />تعديل
                </button>
                <button onClick={() => { setInvoiceToDelete(viewingInvoice.id); setViewingInvoice(null); }}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-bold">
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModal.invoice && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPaymentModal({ invoice: null, amount: '', method: 'cash', notes: '' })}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="relative z-[80] w-full max-w-md bg-white shadow-2xl rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-surface-container-low">
                <h3 className="text-lg font-extrabold text-on-surface mb-1">إضافة دفعة</h3>
                <p className="text-sm text-on-surface-variant">فاتورة رقم: {paymentModal.invoice.invoiceNumber}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">مبلغ الدفعة *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={paymentModal.amount}
                    onChange={e => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                    className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 transition-all text-sm outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">طريقة الدفع</label>
                  <select
                    value={paymentModal.method}
                    onChange={e => setPaymentModal({ ...paymentModal, method: e.target.value })}
                    className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 transition-all text-sm outline-none"
                  >
                    <option value="cash">نقدي</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="check">شيك</option>
                    <option value="credit_card">بطاقة ائتمان</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">ملاحظات</label>
                  <textarea
                    rows={2}
                    placeholder="أي ملاحظات..."
                    value={paymentModal.notes}
                    onChange={e => setPaymentModal({ ...paymentModal, notes: e.target.value })}
                    className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 transition-all text-sm outline-none resize-none"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-surface-container-low flex gap-2">
                <button onClick={() => setPaymentModal({ invoice: null, amount: '', method: 'cash', notes: '' })} className="flex-1 py-2.5 rounded-xl border border-surface-container-high text-on-surface font-bold text-sm hover:bg-surface-container-low transition-colors">إلغاء</button>
                <button onClick={handlePayment} disabled={!paymentModal.amount} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">إضافة الدفعة</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {invoiceToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setInvoiceToDelete(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="relative z-[80] w-full max-w-sm bg-white shadow-2xl rounded-3xl p-6 text-center"
            >
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={26} className="text-red-600" />
              </div>
              <h3 className="text-base font-extrabold text-on-surface mb-2">حذف الفاتورة</h3>
              <p className="text-sm text-on-surface-variant mb-6">هل أنت متأكد من حذف هذه الفاتورة؟</p>
              <div className="flex gap-3">
                <button onClick={() => setInvoiceToDelete(null)} className="flex-1 py-3 rounded-xl border border-surface-container-high text-on-surface font-bold text-sm hover:bg-surface-container-low transition-colors">إلغاء</button>
                <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors">حذف</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
