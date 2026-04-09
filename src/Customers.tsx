import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X, Edit2, Trash2, FileText, CreditCard } from 'lucide-react';
import { Button, Badge } from './components/ui';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useCustomers, useMutation } from './hooks/useApi';
import ConfirmDialog from './components/ConfirmDialog';
import { useToast } from './context/ToastContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  credit_limit?: number;
  is_active?: number;
  total_invoices?: number;
  total_paid?: number;
  total_due?: number;
};

type StatementRow = {
  type: string;
  id: number;
  reference: string;
  transaction_date: string;
  debit: number;
  credit: number;
  balance?: number;
  notes?: string | null;
};

const emptyForm = () => ({ name: '', phone: '', email: '', address: '', credit_limit: 0 });

export default function Customers() {
  const [search, setSearch] = useState('');
  const [hasBalance, setHasBalance] = useState(false);
  const params = useMemo(() => {
    const p: any = {};
    if (search.trim()) p.search = search.trim();
    if (hasBalance) p.has_balance = true;
    return p;
  }, [search, hasBalance]);

  const { customers = [], loading, error, refetch } = useCustomers(params);
  const { showSuccess, showError } = useToast();

  const createMutation = useMutation((cust: any) => import('./lib/api').then(m => m.customersApi.create(cust)));
  const updateMutation = useMutation(({ id, cust }: any) => import('./lib/api').then(m => m.customersApi.update(id, cust)));
  const deleteMutation = useMutation((id: number) => import('./lib/api').then(m => m.customersApi.delete(id)));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<any>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const [statementOpen, setStatementOpen] = useState(false);
  const [statementRows, setStatementRows] = useState<StatementRow[]>([]);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!isModalOpen) {
      setEditing(null);
      setForm(emptyForm());
    }
  }, [isModalOpen]);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setIsModalOpen(true); };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', credit_limit: c.credit_limit || 0 });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || form.name.trim() === '') { showError('اسم العميل مطلوب'); return; }
    try {
      if (editing) {
        const res = await updateMutation.mutate({ id: editing.id, cust: { ...form } });
        if (res?.success) {
          showSuccess(res?.message || 'تم تحديث العميل');
          refetch();
          setIsModalOpen(false);
        } else {
          showError(res?.error || 'فشل في تحديث العميل');
        }
      } else {
        const res = await createMutation.mutate(form);
        if (res?.success) {
          showSuccess(res?.message || 'تم إضافة العميل');
          refetch();
          setIsModalOpen(false);
        } else {
          showError(res?.error || 'فشل في إضافة العميل');
        }
      }
    } catch (err) {
      showError('حدث خطأ أثناء العملية');
    }
  };

  const requestDelete = (id: number) => setDeleteTarget(id);

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await deleteMutation.mutate(id);
      if (res?.success) {
        showSuccess(res?.message || 'تم تعطيل العميل');
        refetch();
      } else {
        showError(res?.error || 'فشل في تعطيل العميل');
      }
    } catch (err) {
      showError('حدث خطأ أثناء العملية');
    }
  };

  const openStatement = async (c: Customer) => {
    try {
      const res = await import('./lib/api').then(m => m.customersApi.getStatement(c.id));
      if (res.success) {
        setStatementRows((res.data as any).statement || []);
        setStatementCustomer((res.data as any).customer || c);
        setStatementOpen(true);
      } else {
        showError(res.error || 'فشل في جلب كشف الحساب');
      }
    } catch (err) {
      showError('فشل في الاتصال');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-lg w-full">
          <div className="relative flex-1">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف أو البريد..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-surface-container-high rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-success focus:border-success transition-all shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error">
                <X size={14} />
              </button>
            )}
          </div>

          <Button variant={hasBalance ? 'success' : 'secondary'} size="sm" onClick={() => setHasBalance(h => !h)}>
            كشف الذمم
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="secondary" onClick={() => { refetch(); }}>
            تحديث
          </Button>
          <Button variant="success" size="md" onClick={openAdd}>
            <Plus size={18} />
            إضافة عميل
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-success border-t-transparent"></div>
          <span className="mr-2 text-sm text-on-surface-variant">جاري التحميل...</span>
        </div>
      )}

      {error && (
          <div className="bg-error/10 border border-error/20 rounded-xl p-4 text-center">
          <p className="text-error font-medium">{error}</p>
          <Button onClick={refetch} variant="danger" className="mt-2">إعادة المحاولة</Button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-surface-container-high">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-surface-container-low/80 border-b border-surface-container-high">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase">العميل</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase hidden sm:table-cell">الهاتف</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase">الرصيد</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase hidden md:table-cell">عدد الفواتير</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase">الحالة</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                        <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center">
                          <FileText size={32} className="opacity-25" />
                        </div>
                        <p className="text-sm font-medium">لا يوجد عملاء مطابقون</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((c: any, idx: number) => (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="border-b border-surface-container-low last:border-0 hover:bg-success/40 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{c.name}</p>
                          <p className="text-[12px] text-on-surface-variant mt-0.5">{c.email || '—'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <p className="text-sm text-on-surface">{c.phone || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className={cn('text-sm font-bold', (c.total_due || 0) > 0 ? 'text-error' : 'text-success')}>{(c.total_due || 0).toLocaleString('ar-SA')} ر.س</p>
                        <p className="text-[12px] text-on-surface-variant">مدفوع: {(c.total_paid || 0).toLocaleString('ar-SA')}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <p className="text-sm text-on-surface">{c.total_invoices ?? '—'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {c.is_active ? <Badge variant="in-stock">نشط</Badge> : <Badge variant="slate">معطّل</Badge>}
                      </td>
                      <td className="px-5 py-3.5 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openStatement(c)} title="كشف الحساب" className="p-2 rounded-xl text-on-surface-variant/40 hover:text-success hover:bg-success/10 transition-all">
                            <CreditCard size={15} />
                          </button>
                          <button onClick={() => {/* TODO: show invoices view */}} title="فواتيره" className="p-2 rounded-xl text-on-surface-variant/40 hover:text-success hover:bg-success/10 transition-all">
                            <FileText size={15} />
                          </button>
                          <button onClick={() => openEdit(c)} title="تعديل" className="p-2 rounded-xl text-on-surface-variant/40 hover:text-success hover:bg-success/10 transition-all">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => requestDelete(c.id)} title="تعطيل" className="p-2 rounded-xl text-error/80 hover:text-error hover:bg-error/10 transition-all">
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
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ type: 'spring', damping: 25 }} className="relative z-[70] w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-surface-container-low flex items-center justify-between">
                <h3 className="font-extrabold">{editing ? 'تعديل العميل' : 'إضافة عميل'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-surface-container-low"><X size={16} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="text-xs font-bold mb-1 block">الاسم</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl p-3 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold mb-1 block">الهاتف</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-xl p-3 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold mb-1 block">البريد</label>
                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border rounded-xl p-3 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">العنوان</label>
                  <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full border rounded-xl p-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">الحد الائتماني</label>
                  <input type="number" value={form.credit_limit} onChange={e => setForm({ ...form, credit_limit: Number(e.target.value) })} className="w-full border rounded-xl p-3 text-sm" />
                </div>
              </div>
                <div className="p-4 border-t border-surface-container-low flex items-center justify-end gap-2">
                <Button onClick={() => setIsModalOpen(false)} variant="secondary">إلغاء</Button>
                <Button onClick={handleSave} variant="success">حفظ</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Statement Modal */}
      <AnimatePresence>
        {statementOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setStatementOpen(false)} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ type: 'spring', damping: 25 }} className="relative z-[70] w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-surface-container-low flex items-center justify-between">
                <h3 className="font-extrabold">كشف حساب: {statementCustomer?.name}</h3>
                <button onClick={() => setStatementOpen(false)} className="p-2 rounded-xl hover:bg-surface-container-low"><X size={16} /></button>
              </div>
              <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-xs text-on-surface-variant">
                      <th className="px-3 py-2">التاريخ</th>
                      <th className="px-3 py-2">المرجع</th>
                      <th className="px-3 py-2">مدين</th>
                      <th className="px-3 py-2">دائن</th>
                      <th className="px-3 py-2">الرصيد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementRows.map((r, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-2 text-sm">{r.transaction_date}</td>
                        <td className="px-3 py-2 text-sm">{r.reference}</td>
                        <td className="px-3 py-2 text-sm">{r.debit ? r.debit.toLocaleString('ar-SA') : '—'}</td>
                        <td className="px-3 py-2 text-sm">{r.credit ? r.credit.toLocaleString('ar-SA') : '—'}</td>
                        <td className="px-3 py-2 text-sm font-bold">{r.balance?.toLocaleString('ar-SA') ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-surface-container-low flex items-center justify-end gap-2">
                <button onClick={() => setStatementOpen(false)} className="px-4 py-2 rounded-xl border">إغلاق</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="تعطيل العميل"
        message="هل متأكد أنك تريد تعطيل هذا العميل؟"
        confirmLabel="تعطيل"
        cancelLabel="إلغاء"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
