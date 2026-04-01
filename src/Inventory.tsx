import React, { useMemo, useState } from 'react';
import {
  Search, Filter, Download, Plus, Edit2, Trash2, X,
  TrendingUp, AlertTriangle, XCircle, Layers,
  ChevronDown, SortAsc, SortDesc, ArrowUpDown,
  ChevronRight, ChevronLeft, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InventoryItem, ItemStatus } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: 'primary' | 'green' | 'orange' | 'red';
  onClick?: () => void;
  active?: boolean;
}

function StatCard({ label, value, sub, icon, color, onClick, active }: StatCardProps) {
  const styles = {
    primary: {
      wrapper: 'stat-card-gradient-primary border-blue-200',
      icon: 'bg-blue-100 text-blue-700',
      value: 'text-blue-700',
    },
    green: {
      wrapper: 'stat-card-gradient-green border-emerald-200',
      icon: 'bg-emerald-100 text-emerald-700',
      value: 'text-emerald-700',
    },
    orange: {
      wrapper: 'stat-card-gradient-amber border-amber-200',
      icon: 'bg-amber-100 text-amber-700',
      value: 'text-amber-700',
    },
    red: {
      wrapper: 'stat-card-gradient-red border-red-200',
      icon: 'bg-red-100 text-red-600',
      value: 'text-red-600',
    },
  };

  const s = styles[color];

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={cn(
        'rounded-2xl p-4 border transition-all',
        s.wrapper,
        onClick && 'cursor-pointer',
        active && 'ring-2 ring-primary shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-on-surface-variant/80 mb-1 truncate">{label}</p>
          <p className={cn('text-2xl font-extrabold leading-tight font-mono', s.value)}>{value}</p>
          <p className="text-[11px] text-on-surface-variant/70 mt-1.5">{sub}</p>
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm', s.icon)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

interface InventoryProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

export default function Inventory({ items, setItems, searchQuery, setSearchQuery }: InventoryProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | ItemStatus>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const totalItems = items.length;
  const inStockCount = items.filter(i => i.status === 'in-stock').length;
  const lowStockCount = items.filter(i => i.status === 'low-stock').length;
  const outOfStockCount = items.filter(i => i.status === 'out-of-stock').length;
  const totalValue = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const displayedItems = useMemo(() => {
    let result = items.filter(item => {
      const q = searchQuery.trim().toLowerCase();
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
      else if (sortBy === 'quantity') cmp = a.quantity - b.quantity;
      else if (sortBy === 'price') cmp = a.price - b.price;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [items, searchQuery, filterStatus, sortBy, sortOrder]);

  const getStatus = (quantity: number): ItemStatus => {
    if (quantity <= 0) return 'out-of-stock';
    if (quantity <= 5) return 'low-stock';
    return 'in-stock';
  };

  const handleSave = () => {
    if (!formData.name || !formData.sku) return;
    const quantity = Number(formData.quantity) || 0;
    const price = Number(formData.price) || 0;
    const status = getStatus(quantity);

    if (editingId) {
      setItems(items.map(item =>
        item.id === editingId ? { ...item, ...formData, quantity, price, status } as InventoryItem : item
      ));
    } else {
      const newItem: InventoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name || '',
        category: formData.category || 'غير محدد',
        sku: formData.sku || '',
        quantity,
        price,
        barcode: formData.barcode || '',
        status,
        notes: formData.notes || ''
      };
      setItems([newItem, ...items]);
    }
    setIsDrawerOpen(false);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setItems(items.filter(item => item.id !== itemToDelete));
      setItemToDelete(null);
      if (viewingItem?.id === itemToDelete) setViewingItem(null);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ quantity: 0, price: 0 });
    setIsDrawerOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData(item);
    setIsDrawerOpen(true);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Mobile Search */}
      <div className="flex md:hidden relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
        <input
          type="text"
          placeholder="بحث في الأصناف..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-surface-container-high rounded-xl pr-9 pl-4 py-2.5 focus:ring-2 focus:ring-primary transition-all text-sm outline-none shadow-sm"
        />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="إجمالي الأصناف"
          value={totalItems.toString()}
          sub={`${totalValue.toLocaleString('ar-SA')} ر.س`}
          icon={<Layers size={20} />}
          color="primary"
        />
        <StatCard
          label="متوفر"
          value={inStockCount.toString()}
          sub={`${Math.round((inStockCount / (totalItems || 1)) * 100)}% من الأصناف`}
          icon={<TrendingUp size={20} />}
          color="green"
          onClick={() => setFilterStatus(filterStatus === 'in-stock' ? 'all' : 'in-stock')}
          active={filterStatus === 'in-stock'}
        />
        <StatCard
          label="كمية منخفضة"
          value={lowStockCount.toString()}
          sub="تحتاج إعادة طلب"
          icon={<AlertTriangle size={20} />}
          color="orange"
          onClick={() => setFilterStatus(filterStatus === 'low-stock' ? 'all' : 'low-stock')}
          active={filterStatus === 'low-stock'}
        />
        <StatCard
          label="نفذ المخزون"
          value={outOfStockCount.toString()}
          sub="غير متوفر حالياً"
          icon={<XCircle size={20} />}
          color="red"
          onClick={() => setFilterStatus(filterStatus === 'out-of-stock' ? 'all' : 'out-of-stock')}
          active={filterStatus === 'out-of-stock'}
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 border transition-all shadow-sm',
                filterStatus !== 'all'
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white text-on-surface-variant border-surface-container-high hover:bg-surface-container-low'
              )}
            >
              <Filter size={15} />
              <span>{filterStatus === 'all' ? 'تصفية' : filterStatus === 'in-stock' ? 'متوفر' : filterStatus === 'low-stock' ? 'منخفض' : 'نفذ'}</span>
              <ChevronDown size={13} className={cn('transition-transform', isFilterOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-xl border border-surface-container-high z-20 min-w-[180px] overflow-hidden py-1"
                >
                  {(['all', 'in-stock', 'low-stock', 'out-of-stock'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => { setFilterStatus(status); setIsFilterOpen(false); }}
                      className={cn(
                        'w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center gap-2',
                        filterStatus === status ? 'bg-primary-fixed text-primary font-bold' : 'hover:bg-surface-container-low text-on-surface'
                      )}
                    >
                      {status === 'all' && <><Layers size={14} /> الكل</>}
                      {status === 'in-stock' && <><TrendingUp size={14} className="text-emerald-600" /> متوفر</>}
                      {status === 'low-stock' && <><AlertTriangle size={14} className="text-amber-500" /> كمية منخفضة</>}
                      {status === 'out-of-stock' && <><XCircle size={14} className="text-red-500" /> نفذ المخزون</>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
              className="bg-white px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant flex items-center gap-2 border border-surface-container-high hover:bg-surface-container-low transition-all shadow-sm"
            >
              <ArrowUpDown size={15} />
              <span>ترتيب</span>
              <ChevronDown size={13} className={cn('transition-transform', isSortOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {isSortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-xl border border-surface-container-high z-20 min-w-[180px] overflow-hidden py-1"
                >
                  {([['name', 'الاسم'], ['quantity', 'الكمية'], ['price', 'السعر']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (sortBy === key) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                        else { setSortBy(key); setSortOrder('asc'); }
                        setIsSortOpen(false);
                      }}
                      className={cn(
                        'w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center justify-between',
                        sortBy === key ? 'bg-primary-fixed text-primary font-bold' : 'hover:bg-surface-container-low text-on-surface'
                      )}
                    >
                      <span>{label}</span>
                      {sortBy === key && (sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {(searchQuery || filterStatus !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors"
            >
              <X size={12} />
              مسح
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs py-2 px-4">
            <Download size={15} />
            تصدير
          </button>
          <button
            onClick={openAddModal}
            className="btn-primary text-xs py-2 px-4 bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg shadow-blue-500/20"
          >
            <Plus size={16} />
            إضافة صنف
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-surface-container-high">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-surface-container-low/80 border-b border-surface-container-high">
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">الصنف</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">الرمز (SKU)</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">
                  <button onClick={() => {
                    setSortBy('quantity');
                    setSortOrder(o => sortBy === 'quantity' ? (o === 'asc' ? 'desc' : 'asc') : 'asc');
                  }} className="flex items-center gap-1 hover:text-primary transition-colors">
                    الكمية
                    {sortBy === 'quantity' ? (sortOrder === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />) : <ArrowUpDown size={11} className="opacity-40" />}
                  </button>
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <button onClick={() => {
                    setSortBy('price');
                    setSortOrder(o => sortBy === 'price' ? (o === 'asc' ? 'desc' : 'asc') : 'asc');
                  }} className="flex items-center gap-1 hover:text-primary transition-colors">
                    السعر
                    {sortBy === 'price' ? (sortOrder === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />) : <ArrowUpDown size={11} className="opacity-40" />}
                  </button>
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">الحالة</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center">
                        <Package size={32} className="opacity-30" />
                      </div>
                      <p className="text-sm font-medium">لا توجد أصناف مطابقة</p>
                      {(searchQuery || filterStatus !== 'all') && (
                        <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="text-xs text-primary hover:underline font-bold">
                          مسح الفلاتر
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedItems.map((item, idx) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-surface-container-low last:border-0 hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => setViewingItem(item)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{item.name}</p>
                          <p className="text-[11px] text-on-surface-variant truncate">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs font-mono bg-surface-container-low px-2 py-1 rounded-lg text-on-surface-variant font-medium">
                        {item.sku}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className={cn(
                        'text-sm font-bold font-mono',
                        item.quantity === 0 ? 'text-red-500' : item.quantity <= 5 ? 'text-amber-600' : 'text-on-surface'
                      )}>
                        {item.quantity.toLocaleString('ar-SA')}
                      </span>
                      <span className="text-xs text-on-surface-variant mr-1">وحدة</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-on-surface font-mono">
                        {item.price.toLocaleString('ar-SA')}
                      </span>
                      <span className="text-xs text-on-surface-variant mr-1">ر.س</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {item.status === 'in-stock' && (
                        <span className="badge-in-stock"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />متوفر</span>
                      )}
                      {item.status === 'low-stock' && (
                        <span className="badge-low-stock"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />منخفض</span>
                      )}
                      {item.status === 'out-of-stock' && (
                        <span className="badge-out-of-stock"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />نفذ</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={e => { e.stopPropagation(); openEditModal(item); }}
                          className="p-2 rounded-xl text-on-surface-variant/50 hover:text-primary hover:bg-primary-fixed/50 transition-all"
                          title="تعديل"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setItemToDelete(item.id); }}
                          className="p-2 rounded-xl text-on-surface-variant/50 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="حذف"
                        >
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

        {displayedItems.length > 0 && (
          <div className="px-5 py-3.5 bg-surface-container-low/50 border-t border-surface-container-high flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-medium">
              {displayedItems.length} صنف من أصل {totalItems}
            </span>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-lg border border-surface-container-high hover:bg-white transition-all"><ChevronRight size={16} /></button>
              <button className="p-1.5 rounded-lg border border-surface-container-high bg-white shadow-sm hover:bg-surface-container-low transition-all"><ChevronLeft size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* View Item Modal */}
      <AnimatePresence>
        {viewingItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingItem(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-sm bg-white shadow-2xl rounded-3xl overflow-hidden"
            >
              <div className="bg-gradient-to-l from-primary-fixed to-white px-5 py-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                    <Package size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-base leading-tight">{viewingItem.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{viewingItem.category}</p>
                  </div>
                </div>
                <button onClick={() => setViewingItem(null)} className="p-1.5 hover:bg-black/5 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'الرمز (SKU)', value: viewingItem.sku, mono: true },
                  { label: 'الباركود', value: viewingItem.barcode || '—', mono: true },
                  { label: 'الكمية المتاحة', value: `${viewingItem.quantity} وحدة` },
                  { label: 'سعر الوحدة', value: `${viewingItem.price.toLocaleString('ar-SA')} ر.س` },
                  { label: 'القيمة الإجمالية', value: `${(viewingItem.price * viewingItem.quantity).toLocaleString('ar-SA')} ر.س` },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-surface-container-low last:border-0">
                    <span className="text-xs text-on-surface-variant">{label}</span>
                    <span className={cn('text-sm font-bold text-on-surface', mono && 'font-mono')}>{value}</span>
                  </div>
                ))}
                {viewingItem.notes && (
                  <div className="bg-surface-container-low rounded-xl p-3">
                    <p className="text-xs text-on-surface-variant font-medium mb-1">ملاحظات</p>
                    <p className="text-sm text-on-surface">{viewingItem.notes}</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-surface-container-low flex gap-2">
                <button
                  onClick={() => { setViewingItem(null); openEditModal(viewingItem); }}
                  className="flex-1 btn-primary justify-center py-2.5 text-sm"
                >
                  <Edit2 size={15} /> تعديل
                </button>
                <button
                  onClick={() => { setItemToDelete(viewingItem.id); setViewingItem(null); }}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-bold text-sm"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-lg bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[92vh]"
            >
              <div className="px-6 py-5 border-b border-surface-container-low bg-gradient-to-l from-primary-fixed/50 to-white flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-base font-extrabold text-on-surface">
                    {editingId ? 'تعديل الصنف' : 'إضافة صنف جديد'}
                  </h2>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">أدخل بيانات الصنف بدقة</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">اسم الصنف *</label>
                    <input
                      type="text"
                      placeholder="أدخل اسم الصنف"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">الرمز (SKU) *</label>
                    <input
                      type="text"
                      placeholder="مثال: PROD-001"
                      value={formData.sku || ''}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      className="input-field font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">التصنيف</label>
                    <input
                      type="text"
                      placeholder="مثال: إلكترونيات"
                      value={formData.category || ''}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">الكمية</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.quantity ?? 0}
                      onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">السعر (ر.س)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={formData.price ?? 0}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">الباركود</label>
                    <input
                      type="text"
                      placeholder="أدخل رقم الباركود"
                      value={formData.barcode || ''}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      className="input-field font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">ملاحظات</label>
                    <textarea
                      rows={3}
                      placeholder="أي ملاحظات إضافية..."
                      value={formData.notes || ''}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="input-field resize-none"
                    />
                  </div>
                </div>

                {formData.quantity !== undefined && formData.quantity !== null && (
                  <div className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium border',
                    formData.quantity === 0
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : (formData.quantity as number) <= 5
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  )}>
                    {formData.quantity === 0 ? <><XCircle size={14} /> الصنف سيُصنَّف كـ "نفذ المخزون"</>
                      : (formData.quantity as number) <= 5 ? <><AlertTriangle size={14} /> الصنف سيُصنَّف كـ "كمية منخفضة"</>
                        : <><TrendingUp size={14} /> الصنف سيُصنَّف كـ "متوفر"</>}
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-surface-container-low flex-shrink-0 flex gap-3">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm border border-surface-container-high text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name || !formData.sku}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {editingId ? 'حفظ التعديلات' : 'إضافة الصنف'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="relative z-[80] w-full max-w-sm bg-white shadow-2xl rounded-3xl p-6 text-center"
            >
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={26} className="text-red-600" />
              </div>
              <h3 className="text-base font-extrabold text-on-surface mb-2">حذف الصنف</h3>
              <p className="text-sm text-on-surface-variant mb-6">هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-3 rounded-xl border border-surface-container-high text-on-surface font-bold text-sm hover:bg-surface-container-low transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                >
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
