import React, { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from './hooks/useApi';
import { useToast } from './context/ToastContext';
import { Button } from './components/ui';
import { WarehouseStatsRow, WarehouseCard, WarehouseFormModal } from './components/warehouses';
import type { WarehouseItem, WarehouseFormState } from './components/warehouses';
import ConfirmDialog from './components/ConfirmDialog';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorState } from './components/ui/ErrorState';

const emptyForm = (): WarehouseFormState => ({ name: '', location: '', capacity: '', is_active: true });

export default function Warehouses() {
  const { warehouses = [], loading, error, refetch } = useWarehouses();
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();
  const { showSuccess, showError } = useToast();

  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<WarehouseFormState>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const filtered = warehouses.filter((w: WarehouseItem) =>
    !search.trim() || w.name.toLowerCase().includes(search.toLowerCase()) || (w.location ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = warehouses.reduce((s: number, w: WarehouseItem) => s + (w.total_items ?? 0), 0);
  const active = warehouses.filter((w: WarehouseItem) => w.is_active).length;

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setIsFormOpen(true); };
  const openEdit = (w: WarehouseItem) => {
    setEditingId(w.id);
    setForm({ name: w.name, location: w.location ?? '', capacity: w.capacity != null ? String(w.capacity) : '', is_active: !!w.is_active });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    const data = { name: form.name, location: form.location || null, capacity: form.capacity ? Number(form.capacity) : null, is_active: form.is_active ? 1 : 0 };
    try {
      if (editingId !== null) {
        const res = await updateMutation.mutateAsync({ id: editingId, warehouse: data });
        if (res?.success) { showSuccess('تم تحديث المستودع'); setIsFormOpen(false); refetch(); }
        else showError(res?.error || 'فشل التحديث');
      } else {
        const res = await createMutation.mutateAsync(data);
        if (res?.success) { showSuccess('تم إضافة المستودع'); setIsFormOpen(false); refetch(); }
        else showError(res?.error || 'فشل الإضافة');
      }
    } catch { showError('حدث خطأ أثناء العملية'); }
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    try {
      const res = await deleteMutation.mutateAsync(deleteTarget);
      if (res?.success) { showSuccess('تم حذف المستودع'); refetch(); }
      else showError(res?.error || 'فشل الحذف');
    } catch { showError('حدث خطأ أثناء الحذف'); }
    setDeleteTarget(null);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            placeholder="بحث عن مستودع..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-surface-container-high rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
          />
          {search && <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error"><X size={14} /></button>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refetch}>تحديث</Button>
          <Button variant="primary" onClick={openAdd}><Plus size={18} />إضافة مستودع</Button>
        </div>
      </div>

      <WarehouseStatsRow total={warehouses.length} totalItems={totalItems} active={active} />

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-on-surface-variant">
          <p className="text-sm font-medium">لا توجد مستودعات مطابقة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((w: WarehouseItem, idx: number) => (
            <WarehouseCard
              key={w.id}
              warehouse={w}
              index={idx}
              onEdit={openEdit}
              onDelete={id => setDeleteTarget(id)}
            />
          ))}
        </div>
      )}

      {isFormOpen && (
        <WarehouseFormModal
          isEditing={editingId !== null}
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => setIsFormOpen(false)}
          isSaving={createMutation.loading || updateMutation.loading}
        />
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          isOpen={deleteTarget !== null}
          message="هل تريد حذف هذا المستودع؟ سيتم إزالة جميع البيانات المرتبطة به."
          confirmLabel="حذف"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
