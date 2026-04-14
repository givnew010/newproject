import React, { useMemo, useState } from 'react';
import { useInventory, useCreateInventory, useUpdateInventory, useDeleteInventory } from './hooks/useApi';
import { useToast } from './context/ToastContext';
import {
  InventoryStatsRow,
  InventoryToolbar,
  InventoryTable,
  ItemViewModal,
  ItemFormModal,
} from './components/inventory';
import ConfirmDialog from './components/ConfirmDialog';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorState } from './components/ui/ErrorState';
import type { SortKey, SortOrder, ItemFormData } from './components/inventory';
import type { InventoryItem, ItemStatus } from './types';

export default function Inventory() {
  const { items = [], loading, error, refetch } = useInventory();
  const createMutation = useCreateInventory();
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();
  const { showSuccess, showError } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<ItemFormData>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ItemStatus>('all');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const stats = useMemo(() => ({
    total: items.length,
    totalValue: items.reduce((s, i) => s + (i.selling_price || 0) * (i.quantity || 0), 0),
    inStock: items.filter(i => i.status === 'in-stock').length,
    lowStock: items.filter(i => i.status === 'low-stock').length,
    outOfStock: items.filter(i => i.status === 'out-of-stock').length,
  }), [items]);

  const displayedItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = items.filter(item => {
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchSearch = !q || item.name.toLowerCase().includes(q) || (item.sku || '').toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name, 'ar');
      else if (sortBy === 'quantity') cmp = (a.quantity || 0) - (b.quantity || 0);
      else if (sortBy === 'selling_price') cmp = (a.selling_price || 0) - (b.selling_price || 0);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [items, filterStatus, sortBy, sortOrder]);

  const handleSortChange = (key: SortKey, order: SortOrder) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleClearFilters = () => {
    setFilterStatus('all');
    setSearch('');
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ quantity: 0, selling_price: 0, cost_price: 0, unit: '', expiry_date: '' });
    setFormOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData(item);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormData({});
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sku) return;

    const payload = {
      name: formData.name,
      sku: formData.sku,
      category: formData.category || 'غير محدد',
      unit: formData.unit || 'pcs',
      expiry_date: formData.expiry_date || '',
      quantity: Number(formData.quantity) || 0,
      min_quantity: 0,
      cost_price: Number(formData.cost_price) || 0,
      selling_price: Number(formData.selling_price) || 0,
      barcode: formData.barcode || '',
      notes: formData.notes || '',
    };

    try {
      if (editingId) {
        const res = await updateMutation.mutate({ id: parseInt(editingId), item: payload });
        if (res?.success) {
          showSuccess('تم تحديث الصنف بنجاح');
          refetch();
          closeForm();
        } else {
          showError('فشل في تحديث الصنف: ' + (res?.error || ''));
        }
      } else {
        const res = await createMutation.mutate(payload);
        if (res?.success) {
          showSuccess('تم إضافة الصنف بنجاح');
          refetch();
          closeForm();
        } else {
          showError('فشل في إضافة الصنف: ' + (res?.error || ''));
        }
      }
    } catch {
      showError('حدث خطأ غير متوقع');
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await deleteMutation.mutate(parseInt(itemToDelete));
      if (res?.success) {
        showSuccess('تم حذف الصنف بنجاح');
        refetch();
        if (viewingItem?.id === itemToDelete) setViewingItem(null);
      } else {
        showError('فشل في حذف الصنف: ' + (res?.error || ''));
      }
    } catch {
      showError('حدث خطأ غير متوقع');
    } finally {
      setItemToDelete(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6">
      <InventoryToolbar
        search={search}
        onSearchChange={setSearch}
        filterStatus={filterStatus}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onClearFilters={handleClearFilters}
        onFilterChange={setFilterStatus}
        onSortChange={handleSortChange}
        onAdd={openAdd}
        onRefresh={refetch}
      />

      <InventoryTable
        items={displayedItems}
        totalCount={stats.total}
        sortBy={sortBy}
        sortOrder={sortOrder}
        filterStatus={filterStatus}
        onSortChange={handleSortChange}
        onRowClick={setViewingItem}
        onEdit={openEdit}
        onDelete={setItemToDelete}
        onClearFilters={handleClearFilters}
      />

      <ItemViewModal
        item={viewingItem}
        onClose={() => setViewingItem(null)}
        onEdit={openEdit}
        onDelete={setItemToDelete}
      />

      <ItemFormModal
        isOpen={formOpen}
        isEditing={!!editingId}
        formData={formData}
        isSaving={createMutation.loading || updateMutation.loading}
        onChange={setFormData}
        onSave={handleSave}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={!!itemToDelete}
        title="حذف الصنف"
        message="هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="تأكيد الحذف"
        cancelLabel="إلغاء"
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
