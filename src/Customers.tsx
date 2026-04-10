import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useCustomers, useMutation } from './hooks/useApi';
import ConfirmDialog from './components/ConfirmDialog';
import { useToast } from './context/ToastContext';
import { Button } from './components/ui';
import { ContactTable } from './components/shared/ContactTable';
import { ContactFormModal } from './components/shared/ContactFormModal';
import type { ContactFormState } from './components/shared/ContactFormModal';
import { StatementModal } from './components/shared/StatementModal';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorState } from './components/ui/ErrorState';

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

const emptyForm = (): ContactFormState => ({ name: '', phone: '', email: '', address: '', credit_limit: 0 });

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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<ContactFormState>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [statementOpen, setStatementOpen] = useState(false);
  const [statementRows, setStatementRows] = useState<any[]>([]);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!isFormOpen) { setEditing(null); setForm(emptyForm()); }
  }, [isFormOpen]);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setIsFormOpen(true); };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', credit_limit: c.credit_limit || 0 });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showError('اسم العميل مطلوب'); return; }
    try {
      if (editing) {
        const res = await updateMutation.mutate({ id: editing.id, cust: { ...form } });
        if (res?.success) { showSuccess('تم تحديث العميل'); refetch(); setIsFormOpen(false); }
        else showError(res?.error || 'فشل في تحديث العميل');
      } else {
        const res = await createMutation.mutate(form);
        if (res?.success) { showSuccess('تم إضافة العميل'); refetch(); setIsFormOpen(false); }
        else showError(res?.error || 'فشل في إضافة العميل');
      }
    } catch { showError('حدث خطأ أثناء العملية'); }
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await deleteMutation.mutate(id);
      if (res?.success) { showSuccess('تم تعطيل العميل'); refetch(); }
      else showError(res?.error || 'فشل في تعطيل العميل');
    } catch { showError('حدث خطأ أثناء العملية'); }
  };

  const openStatement = async (c: Customer) => {
    try {
      const res = await import('./lib/api').then(m => m.customersApi.getStatement(c.id));
      if (res.success) {
        setStatementRows((res.data as any).statement || []);
        setStatementCustomer((res.data as any).customer || c);
        setStatementOpen(true);
      } else showError(res.error || 'فشل في جلب كشف الحساب');
    } catch { showError('فشل في الاتصال'); }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

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
              className="w-full bg-white border border-surface-container-high rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
            />
            {search && <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error"><X size={14} /></button>}
          </div>
          <Button variant={hasBalance ? 'success' : 'secondary'} size="sm" onClick={() => setHasBalance(h => !h)}>كشف الذمم</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()}>تحديث</Button>
          <Button variant="success" onClick={openAdd}><Plus size={18} />إضافة عميل</Button>
        </div>
      </div>

      <ContactTable
        mode="customer"
        rows={customers}
        onEdit={openEdit}
        onDelete={id => setDeleteTarget(id)}
        onStatement={c => openStatement(c as Customer)}
      />

      {isFormOpen && (
        <ContactFormModal
          mode="customer"
          isEditing={!!editing}
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => setIsFormOpen(false)}
          isSaving={createMutation.loading || updateMutation.loading}
        />
      )}

      {statementOpen && statementCustomer && (
        <StatementModal
          mode="customer"
          entityName={statementCustomer.name}
          rows={statementRows}
          onClose={() => setStatementOpen(false)}
        />
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          isOpen={deleteTarget !== null}
          message="هل تريد تعطيل هذا العميل؟"
          confirmLabel="تعطيل"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
