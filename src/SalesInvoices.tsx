import React, { useState, useMemo } from 'react';
import { Plus, Search, X, Download } from 'lucide-react';
import { SalesInvoice, InvoiceLineItem } from './types';
import { useSales, useCreateSale, useUpdateSale, useDeleteSale, useCreateSalePayment, useCustomers, useInventory } from './hooks/useApi';
import { useToast } from './context/ToastContext';
import { KPICard, Button } from './components/ui';
import { InvoiceStatsRow } from './components/shared/InvoiceStatsRow';
import { InvoiceTable } from './components/shared/InvoiceTable';
import { InvoiceFormModal } from './components/shared/InvoiceFormModal';
import type { InvoiceFormState } from './components/shared/InvoiceFormModal';
import { InvoiceViewModal } from './components/shared/InvoiceViewModal';
import { PaymentModal } from './components/shared/PaymentModal';
import type { PaymentState } from './components/shared/PaymentModal';
import ConfirmDialog from './components/ConfirmDialog';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorState } from './components/ui/ErrorState';

const TODAY = new Date().toISOString().split('T')[0];

function newLineItem(): InvoiceLineItem {
  return { id: Math.random().toString(36).substr(2, 9), name: '', quantity: 1, price: 0, total: 0 };
}

function emptyForm(): InvoiceFormState {
  return { invoiceNumber: '', party: '', date: TODAY, notes: '', items: [newLineItem()] };
}

export default function SalesInvoices() {
  const { invoices = [], loading, error, refetch } = useSales();
  const { customers = [] } = useCustomers();
  const { items: inventoryItems = [] } = useInventory();
  const createMutation = useCreateSale();
  const updateMutation = useUpdateSale();
  const deleteMutation = useDeleteSale();
  const paymentMutation = useCreateSalePayment();
  const { showSuccess, showError } = useToast();

  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceFormState>(emptyForm());
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<SalesInvoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<SalesInvoice | null>(null);
  const [payment, setPayment] = useState<PaymentState>({ amount: '', method: 'cash', notes: '' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv: SalesInvoice) =>
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customer.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const totalRevenue = invoices.reduce((s: number, inv: SalesInvoice) => s + (inv.totalAmount ?? 0), 0);
  const avgInvoice = invoices.length > 0 ? Math.round(totalRevenue / invoices.length) : 0;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setStockWarning(null);
    setIsFormOpen(true);
  };

  const openEdit = (inv: SalesInvoice) => {
    setEditingId(inv.id);
    setForm({
      invoiceNumber: inv.invoiceNumber,
      party: inv.customer,
      date: inv.date,
      notes: inv.notes ?? '',
      items: inv.items.map(it => ({ ...it })),
    });
    setStockWarning(null);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    const items = form.items.map(it => ({ ...it, total: Number(it.quantity) * Number(it.price) }));
    const totalAmount = items.reduce((s, it) => s + it.total, 0);
    const invoiceData = {
      invoiceNumber: form.invoiceNumber,
      customer: form.party,
      date: form.date,
      notes: form.notes,
      items,
      totalAmount,
    };
    try {
      if (editingId) {
        const res = await updateMutation.mutateAsync({ id: editingId as unknown as number, sale: invoiceData });
        if (res?.success) { showSuccess('تم تحديث الفاتورة بنجاح'); setIsFormOpen(false); refetch(); }
        else showError(res?.error || 'فشل التحديث');
      } else {
        const res = await createMutation.mutateAsync(invoiceData);
        if (res?.success) { showSuccess('تم حفظ الفاتورة بنجاح'); setIsFormOpen(false); refetch(); }
        else showError(res?.error || 'فشل الحفظ');
      }
    } catch { showError('حدث خطأ أثناء حفظ الفاتورة'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteMutation.mutateAsync(deleteTarget as unknown as number);
      if (res?.success) { showSuccess('تم حذف الفاتورة'); refetch(); }
      else showError(res?.error || 'فشل الحذف');
    } catch { showError('حدث خطأ أثناء الحذف'); }
    setDeleteTarget(null);
  };

  const handlePayment = async () => {
    if (!paymentInvoice || !payment.amount) return;
    try {
      const res = await paymentMutation.mutateAsync({
        id: paymentInvoice.id as unknown as number,
        payment: { amount: parseFloat(payment.amount), method: payment.method, notes: payment.notes },
      });
      if (res?.success) { showSuccess('تم إضافة الدفعة بنجاح'); setPaymentInvoice(null); setPayment({ amount: '', method: 'cash', notes: '' }); refetch(); }
      else showError(res?.error || 'فشل إضافة الدفعة');
    } catch { showError('حدث خطأ أثناء إضافة الدفعة'); }
  };

  const openPayment = (inv: SalesInvoice) => {
    setPaymentInvoice(inv);
    setPayment({ amount: '', method: 'cash', notes: '' });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-lg w-full">
          <div className="relative flex-1">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              placeholder="بحث بالرقم أو العميل..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-surface-container-high rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refetch}>تحديث</Button>
          <Button variant="success" onClick={openAdd}>
            <Plus size={18} />فاتورة مبيعات جديدة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <InvoiceStatsRow mode="sale" count={invoices.length} total={totalRevenue} avg={avgInvoice} />

      {/* Table */}
      <InvoiceTable
        mode="sale"
        invoices={filtered}
        onView={inv => setViewingInvoice(inv as SalesInvoice)}
        onEdit={inv => openEdit(inv as SalesInvoice)}
        onDelete={id => setDeleteTarget(id)}
        onPayment={inv => openPayment(inv as SalesInvoice)}
      />

      {/* Modals */}
      {isFormOpen && (
        <InvoiceFormModal
          mode="sale"
          isEditing={!!editingId}
          form={form}
          setForm={setForm}
          partyList={customers.map((c: any) => ({ id: c.id, name: c.name }))}
          inventoryItems={inventoryItems}
          stockWarning={stockWarning}
          onSave={handleSave}
          onClose={() => setIsFormOpen(false)}
          isSaving={createMutation.loading || updateMutation.loading}
        />
      )}

      {viewingInvoice && (
        <InvoiceViewModal
          mode="sale"
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onEdit={inv => openEdit(inv as SalesInvoice)}
          onDelete={id => setDeleteTarget(id)}
          onPayment={inv => openPayment(inv as SalesInvoice)}
        />
      )}

      {paymentInvoice && (
        <PaymentModal
          mode="sale"
          invoiceNumber={paymentInvoice.invoiceNumber}
          totalAmount={paymentInvoice.totalAmount}
          payment={payment}
          setPayment={setPayment}
          onSave={handlePayment}
          onClose={() => setPaymentInvoice(null)}
          isSaving={paymentMutation.loading}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          message="هل تريد حذف هذه الفاتورة؟ لا يمكن التراجع."
          confirmLabel="حذف"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
