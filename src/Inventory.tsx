import React, { useMemo, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Package } from 'lucide-react';
import { useInventory, useCreateInventory, useUpdateInventory, useDeleteInventory } from './hooks/useApi';
import { useToast } from './context/ToastContext';
import { PageHeader } from './components/ui';
import {
  InventoryStatsRow,
  InventoryToolbar,
  InventoryTable,
  ItemViewModal,
  ItemFormModal,
} from './components/inventory';
import ConfirmDialog from './components/ConfirmDialog';
import type { SortKey, SortOrder, ItemFormData } from './components/inventory';
import type { InventoryItem, ItemStatus } from './types';

interface InventoryProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

export default function Inventory({ searchQuery, setSearchQuery }: InventoryProps) {
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

  const [filterStatus, setFilterStatus] = useState<'all' | ItemStatus>('all');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const stats = useMemo(() => ({
    total: items.length,
    totalValue: items.reduce((s, i) => s + (i.selling_price || 0) * (i.quantity || 0), 0),
    inStock: items.filter(i => i.status === 'in-stock').length,
    lowStock: items.filter(i => i.status === 'low-stock').length,
    outOfStock: items.filter(i => i.status === 'out-of-stock').length,
  }), [items]);

  const displayedItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let result = items.filter(item => {
      const matchSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchSearch && matchStatus;
    });
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name, 'ar');
      else if (sortBy === 'quantity') cmp = (a.quantity || 0) - (b.quantity || 0);
      else if (sortBy === 'selling_price') cmp = (a.selling_price || 0) - (b.selling_price || 0);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [items, debouncedSearch, filterStatus, sortBy, sortOrder]);

  const handleSortChange = (key: SortKey, order: SortOrder) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ quantity: 0, selling_price: 0 });
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
      unit: 'pcs',
      quantity: Number(formData.quantity) || 0,
      min_quantity: 0,
      cost_price: Number(formData.selling_price) || 0,
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

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6">
      {/* <PageHeader
        title="إدارة المخزون"
        subtitle="تتبع وإدارة جميع أصناف المخزون"
        icon={<Package size={20} className="text-primary" />}
        accentColor="blue"
      /> */}

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="mr-3 text-sm text-on-surface-variant">جاري التحميل...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {!loading && (
        <>
          {/* <InventoryStatsRow
            total={stats.total}
            totalValue={stats.totalValue}
            inStock={stats.inStock}
            lowStock={stats.lowStock}
            outOfStock={stats.outOfStock}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
          /> */}

          <div className="flex md:hidden relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              placeholder="بحث في الأصناف..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pr-9 w-full"
            />
          </div>

          <InventoryToolbar
            searchQuery={searchQuery}
            filterStatus={filterStatus}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onClearFilters={handleClearFilters}
            onFilterChange={setFilterStatus}
            onSortChange={handleSortChange}
            onAdd={openAdd}
          />

          <InventoryTable
            items={displayedItems}
            totalCount={stats.total}
            sortBy={sortBy}
            sortOrder={sortOrder}
            searchQuery={searchQuery}
            filterStatus={filterStatus}
            onSortChange={handleSortChange}
            onRowClick={setViewingItem}
            onEdit={openEdit}
            onDelete={setItemToDelete}
            onClearFilters={handleClearFilters}
          />
        </>
      )}

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
