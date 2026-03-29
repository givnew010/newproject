/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Bell, Settings, LayoutDashboard, Package, Warehouse, 
  BarChart3, Plus, HelpCircle, ShoppingCart,
  Filter, ArrowUpDown, Download, Barcode, Edit2, Trash2, X, 
  ScanBarcode, ChevronRight, ChevronLeft, Menu,
  TrendingUp, AlertTriangle, XCircle, Layers,
  ChevronDown, SortAsc, SortDesc
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InventoryItem, ItemStatus } from './types';
import PurchaseInvoices from './PurchaseInvoices';

type Page = 'inventory' | 'purchases';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: '01',
    name: 'آيفون 15 برو ماكس',
    category: 'إلكترونيات / هواتف',
    sku: 'APP-IP15-PM',
    quantity: 24,
    price: 5200,
    barcode: '123456789',
    status: 'in-stock',
  },
  {
    id: '02',
    name: 'سماعات سوني WH-1000XM5',
    category: 'إلكترونيات / صوتيات',
    sku: 'SONY-WH5-BLK',
    quantity: 5,
    price: 1400,
    barcode: '987654321',
    status: 'low-stock',
  },
  {
    id: '03',
    name: 'ماك بوك برو M3',
    category: 'إجهزة / حواسيب',
    sku: 'APP-MBP-M3',
    quantity: 0,
    price: 8500,
    barcode: '456789123',
    status: 'out-of-stock',
  }
];

export default function App() {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('inventory_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse inventory from local storage', e);
      }
    }
    return INITIAL_ITEMS;
  });
  const [currentPage, setCurrentPage] = useState<Page>('inventory');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

  // Search / Filter / Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ItemStatus>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Set document direction to RTL
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  // Save items to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('inventory_items', JSON.stringify(items));
  }, [items]);

  const totalItems = items.length;

  // Stats
  const inStockCount = items.filter(i => i.status === 'in-stock').length;
  const lowStockCount = items.filter(i => i.status === 'low-stock').length;
  const outOfStockCount = items.filter(i => i.status === 'out-of-stock').length;
  const totalValue = items.reduce((s, i) => s + i.price * i.quantity, 0);

  // Filtered + sorted items
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
    if (!formData.name || !formData.sku) return; // Basic validation

    const quantity = Number(formData.quantity) || 0;
    const price = Number(formData.price) || 0;
    const status = getStatus(quantity);

    if (editingId) {
      setItems(items.map(item => item.id === editingId ? { ...item, ...formData, quantity, price, status } as InventoryItem : item));
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

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setItems(items.filter(item => item.id !== itemToDelete));
      setItemToDelete(null);
      if (viewingItem?.id === itemToDelete) {
        setViewingItem(null);
      }
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
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-fixed">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-surface-container-low border-l border-surface-container-high flex flex-col transition-transform duration-300",
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Package size={24} />
            </div>
            <div>
              <h1 className="font-headline font-bold text-primary text-lg">المُنسق</h1>
              <p className="text-[10px] text-on-surface-variant font-medium">نظام إدارة المخزون</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-surface-container-high rounded-lg transition-colors"
          >
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="لوحة التحكم" />
          <NavItem icon={<Package size={20} />} label="الأصناف" active={currentPage === 'inventory'} onClick={() => setCurrentPage('inventory')} />
          <NavItem icon={<ShoppingCart size={20} />} label="فواتير المشتريات" active={currentPage === 'purchases'} onClick={() => setCurrentPage('purchases')} />
          <NavItem icon={<Warehouse size={20} />} label="المخازن" />
          <NavItem icon={<BarChart3 size={20} />} label="التقارير" />
          <NavItem icon={<Settings size={20} />} label="الإعدادات" />
        </nav>

        <div className="p-4 mt-auto space-y-4">
          <div className="pt-4 border-t border-surface-container-high">
            <NavItem icon={<HelpCircle size={20} />} label="الدعم الفني" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen flex flex-col transition-all duration-300",
        isSidebarOpen ? "lg:mr-64" : "mr-0"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-surface-container-high px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-surface-container-low rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="font-headline font-extrabold text-primary text-xl lg:text-2xl">
              {currentPage === 'inventory' ? 'إدارة الأصناف' : 'فواتير المشتريات'}
            </h2>
            
            {currentPage === 'inventory' && (
              <div className="hidden md:flex relative group mr-4">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="بحث بالاسم، الرمز، القسم..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-surface-container-high border-none rounded-xl pr-10 pl-4 py-2 w-72 focus:ring-2 focus:ring-primary transition-all text-sm outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors">
                    <X size={15} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <IconButton icon={<Bell size={20} />} />
            <IconButton icon={<Settings size={20} />} />
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary-fixed cursor-pointer hover:opacity-80 transition-opacity">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6vd9ZV2aFatLkoPrulu79xjiH12hzluUUjYAWWywbwiHMC3vO_olFhuGVQ8EWF-dIZU3IQSpMyIGWcUzvf2fLSM2SGp02dj74EwKHJVNujNvs-jVq3iLyD1EMwTAbX5dU7LlwvZn3F8ApX4k0Ckm90oHTRZJTItQ4nOYF_SW7LtINXu6_QjVIOpW_k9Dhle8Ckml6U5wFGP-RwBVQVa8rwRhxV5J5T4wlFoGhP3DCBXUealose9K3EnldHNvCxPUwVkIIytLmCwk" 
                alt="User Profile"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Purchases Page */}
        {currentPage === 'purchases' && (
          <PurchaseInvoices
            inventoryItems={items}
            onInventoryUpdate={setItems}
          />
        )}

        {/* Inventory Content */}
        {currentPage === 'inventory' && <div className="p-4 lg:p-8 space-y-6 flex-1">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="إجمالي الأصناف"
              value={totalItems.toString()}
              sub={`قيمة: ${totalValue.toLocaleString('ar-SA')} ر.س`}
              icon={<Layers size={22} />}
              color="primary"
            />
            <StatCard
              label="متوفر"
              value={inStockCount.toString()}
              sub={`${Math.round((inStockCount / (totalItems || 1)) * 100)}% من الأصناف`}
              icon={<TrendingUp size={22} />}
              color="green"
              onClick={() => setFilterStatus(filterStatus === 'in-stock' ? 'all' : 'in-stock')}
              active={filterStatus === 'in-stock'}
            />
            <StatCard
              label="كمية منخفضة"
              value={lowStockCount.toString()}
              sub="تحتاج إعادة طلب"
              icon={<AlertTriangle size={22} />}
              color="orange"
              onClick={() => setFilterStatus(filterStatus === 'low-stock' ? 'all' : 'low-stock')}
              active={filterStatus === 'low-stock'}
            />
            <StatCard
              label="نفذ المخزون"
              value={outOfStockCount.toString()}
              sub="غير متوفر حالياً"
              icon={<XCircle size={22} />}
              color="red"
              onClick={() => setFilterStatus(filterStatus === 'out-of-stock' ? 'all' : 'out-of-stock')}
              active={filterStatus === 'out-of-stock'}
            />
          </div>

          {/* Mobile Search */}
          <div className="flex md:hidden relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="بحث بالاسم، الرمز، القسم..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-high border-none rounded-xl pr-10 pl-4 py-2.5 focus:ring-2 focus:ring-primary transition-all text-sm outline-none"
            />
          </div>

          {/* Table Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border transition-colors shadow-sm",
                    filterStatus !== 'all'
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-on-surface-variant border-surface-container-high hover:bg-surface-container-low"
                  )}
                >
                  <Filter size={16} />
                  <span>{filterStatus === 'all' ? 'تصفية' : filterStatus === 'in-stock' ? 'متوفر' : filterStatus === 'low-stock' ? 'كمية منخفضة' : 'نفذ المخزون'}</span>
                  <ChevronDown size={14} className={cn("transition-transform", isFilterOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-surface-container-high z-20 min-w-[160px] overflow-hidden"
                    >
                      {(['all', 'in-stock', 'low-stock', 'out-of-stock'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => { setFilterStatus(status); setIsFilterOpen(false); }}
                          className={cn(
                            "w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center gap-2",
                            filterStatus === status ? "bg-primary-fixed text-primary font-bold" : "hover:bg-surface-container-low text-on-surface"
                          )}
                        >
                          {status === 'all' && <><Layers size={14} />الكل</>}
                          {status === 'in-stock' && <><TrendingUp size={14} className="text-green-600" />متوفر</>}
                          {status === 'low-stock' && <><AlertTriangle size={14} className="text-orange-500" />كمية منخفضة</>}
                          {status === 'out-of-stock' && <><XCircle size={14} className="text-error" />نفذ المخزون</>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
                  className="bg-white px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant flex items-center gap-2 border border-surface-container-high hover:bg-surface-container-low transition-colors shadow-sm"
                >
                  <ArrowUpDown size={16} />
                  <span>ترتيب</span>
                  <ChevronDown size={14} className={cn("transition-transform", isSortOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isSortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-surface-container-high z-20 min-w-[180px] overflow-hidden"
                    >
                      {([['name','الاسم'],['quantity','الكمية'],['price','السعر']] as const).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => {
                            if (sortBy === key) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                            else { setSortBy(key); setSortOrder('asc'); }
                            setIsSortOpen(false);
                          }}
                          className={cn(
                            "w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center justify-between",
                            sortBy === key ? "bg-primary-fixed text-primary font-bold" : "hover:bg-surface-container-low text-on-surface"
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

              {/* Active Filter Badge */}
              {(searchQuery || filterStatus !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-error-container text-error text-xs font-bold rounded-xl hover:bg-error/10 transition-colors"
                >
                  <X size={13} />
                  مسح الفلاتر
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="w-full sm:w-auto px-5 py-2.5 bg-white text-on-surface border border-surface-container-high rounded-xl font-bold text-sm hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 shadow-sm">
                <Download size={16} />
                تصدير
              </button>
              <button
                onClick={openAddModal}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-container text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 active:scale-95"
              >
                <Plus size={20} />
                <span className="text-sm">إضافة صنف</span>
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-surface-container-low">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-surface-container-low/50 border-b border-surface-container-high">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">اسم الصنف</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">الرمز (SKU)</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      <button onClick={() => { setSortBy('quantity'); setSortOrder(o => sortBy === 'quantity' ? (o === 'asc' ? 'desc' : 'asc') : 'asc'); }} className="flex items-center gap-1 hover:text-primary transition-colors">
                        الكمية {sortBy === 'quantity' && (sortOrder === 'asc' ? <SortAsc size={13}/> : <SortDesc size={13}/>)}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      <button onClick={() => { setSortBy('price'); setSortOrder(o => sortBy === 'price' ? (o === 'asc' ? 'desc' : 'asc') : 'asc'); }} className="flex items-center gap-1 hover:text-primary transition-colors">
                        السعر {sortBy === 'price' && (sortOrder === 'asc' ? <SortAsc size={13}/> : <SortDesc size={13}/>)}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">الباركود</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-left">العمليات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {displayedItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                          <Package size={40} className="opacity-30" />
                          <p className="text-sm font-medium">لا توجد أصناف تطابق البحث</p>
                          <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="text-xs text-primary hover:underline">مسح الفلاتر</button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {displayedItems.map((item) => (
                    <motion.tr
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setViewingItem(item)}
                      className="hover:bg-surface-container-low/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                            item.status === 'in-stock' ? "bg-primary-fixed/60" :
                            item.status === 'low-stock' ? "bg-tertiary-fixed/60" : "bg-error-container"
                          )}>
                            <Package size={17} className={cn(
                              item.status === 'in-stock' ? "text-primary" :
                              item.status === 'low-stock' ? "text-on-tertiary-fixed-variant" : "text-error"
                            )} />
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-on-surface">{item.name}</span>
                            <span className="block text-[10px] text-on-surface-variant">{item.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant font-mono">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-sm font-bold",
                            item.quantity === 0 ? "text-error" : item.quantity <= 5 ? "text-on-tertiary-fixed-variant" : "text-primary"
                          )}>{item.quantity}</span>
                          <span className="text-xs text-on-surface-variant">وحدة</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-on-surface">{item.price.toLocaleString('ar-SA')} <span className="text-on-surface-variant font-normal text-xs">ر.س</span></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.barcode
                          ? <span className="font-mono text-xs text-on-surface-variant">{item.barcode}</span>
                          : <Barcode size={18} className="text-on-surface-variant/30" />}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                            className="p-2 text-on-surface-variant/60 hover:text-primary hover:bg-primary-fixed/30 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            className="p-2 text-on-surface-variant/60 hover:text-error hover:bg-error-container rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-surface-container-low/30 border-t border-surface-container-high flex items-center justify-between">
              <span className="text-xs text-on-surface-variant font-medium">
                عرض {displayedItems.length} من أصل {totalItems.toLocaleString('ar-SA')} صنف
                {(searchQuery || filterStatus !== 'all') && <span className="text-primary mr-1">(مصفى)</span>}
              </span>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg border border-surface-container-high hover:bg-white transition-all disabled:opacity-50">
                  <ChevronRight size={18} />
                </button>
                <button className="p-2 rounded-lg border border-surface-container-high bg-white shadow-sm hover:bg-surface-container-low transition-all">
                  <ChevronLeft size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>}
      </main>

      {/* Add Item Modal */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-on-background/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-lg max-h-[90vh] bg-surface-container-lowest shadow-2xl flex flex-col rounded-3xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-surface-container-low flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-on-surface">{editingId ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h2>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">أدخل بيانات الصنف بدقة ليتم حفظها في النظام</p>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 hover:bg-surface-container-low rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div className="space-y-3">
                  <InputGroup 
                    label="اسم الصنف *" 
                    placeholder="مثال: آيفون 15 برو" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputGroup 
                      label="الرمز (SKU) *" 
                      placeholder="SKU-000" 
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    />
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-on-surface-variant">الباركود</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="رقم الباركود"
                          value={formData.barcode || ''}
                          onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                          className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary transition-all text-sm outline-none"
                        />
                        <ScanBarcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <InputGroup 
                      label="الكمية" 
                      placeholder="0" 
                      type="number" 
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                    />
                    <InputGroup 
                      label="السعر (ر.س)" 
                      placeholder="0.00" 
                      type="number" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    />
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-on-surface-variant">القسم</label>
                      <select 
                        value={formData.category || ''}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary transition-all text-sm outline-none appearance-none"
                      >
                        <option value="">اختر القسم...</option>
                        <option value="إلكترونيات / هواتف">إلكترونيات / هواتف</option>
                        <option value="إلكترونيات / صوتيات">إلكترونيات / صوتيات</option>
                        <option value="إجهزة / حواسيب">إجهزة / حواسيب</option>
                        <option value="أدوات منزلية">أدوات منزلية</option>
                        <option value="ملابس">ملابس</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant">ملاحظات إضافية</label>
                    <textarea 
                      rows={2}
                      placeholder="اكتب أي ملاحظات تتعلق بالصنف هنا..."
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary transition-all text-sm outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 border-t border-surface-container-low flex items-center gap-3">
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-primary to-primary-container text-white py-2.5 rounded-lg font-bold hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"
                >
                  حفظ البيانات
                </button>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 bg-surface-container-high text-on-surface py-2.5 rounded-lg font-bold hover:bg-surface-container-highest transition-all active:scale-95 text-sm"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setItemToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-xl relative z-10"
            >
              <h3 className="text-xl font-bold text-on-surface mb-2">تأكيد الحذف</h3>
              <p className="text-on-surface-variant text-sm mb-6">
                هل أنت متأكد من رغبتك في حذف هذا الصنف؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setItemToDelete(null)} 
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

      {/* Item Details Modal */}
      <AnimatePresence>
        {viewingItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setViewingItem(null)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-surface-container-lowest rounded-3xl max-w-lg w-full shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-surface-container-low flex items-center justify-between bg-surface-container-lowest">
                <h3 className="text-xl font-bold text-on-surface">تفاصيل الصنف</h3>
                <button 
                  onClick={() => setViewingItem(null)} 
                  className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex items-start gap-5">
                  {viewingItem.imageUrl ? (
                    <img 
                      src={viewingItem.imageUrl} 
                      alt={viewingItem.name} 
                      className="w-24 h-24 rounded-2xl object-cover border border-surface-container-low shadow-sm" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface-variant shadow-inner">
                      <Package size={32} />
                    </div>
                  )}
                  <div className="pt-1">
                    <h4 className="text-xl font-bold text-on-surface mb-2">{viewingItem.name}</h4>
                    <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-surface-container-high text-on-surface-variant">
                      {viewingItem.category}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-low/50 p-4 rounded-2xl border border-surface-container-low">
                    <p className="text-xs font-bold text-on-surface-variant mb-1.5">الرمز (SKU)</p>
                    <p className="font-mono text-sm font-medium text-on-surface">{viewingItem.sku}</p>
                  </div>
                  <div className="bg-surface-container-low/50 p-4 rounded-2xl border border-surface-container-low">
                    <p className="text-xs font-bold text-on-surface-variant mb-1.5">الباركود</p>
                    <p className="font-mono text-sm font-medium text-on-surface">{viewingItem.barcode || 'لا يوجد'}</p>
                  </div>
                  <div className="bg-surface-container-low/50 p-4 rounded-2xl border border-surface-container-low">
                    <p className="text-xs font-bold text-on-surface-variant mb-1.5">الكمية المتوفرة</p>
                    <p className="text-sm font-bold text-primary">{viewingItem.quantity} وحدة</p>
                  </div>
                  <div className="bg-surface-container-low/50 p-4 rounded-2xl border border-surface-container-low">
                    <p className="text-xs font-bold text-on-surface-variant mb-1.5">سعر البيع</p>
                    <p className="text-sm font-bold text-on-surface">{viewingItem.price.toLocaleString('ar-SA')} ر.س</p>
                  </div>
                </div>

                {viewingItem.notes && (
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant mb-2">ملاحظات إضافية</p>
                    <p className="text-sm text-on-surface bg-surface-container-low/50 p-4 rounded-2xl border border-surface-container-low leading-relaxed">
                      {viewingItem.notes}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-surface-container-low bg-surface-container-lowest flex gap-3">
                <button 
                  onClick={() => {
                    setViewingItem(null);
                    openEditModal(viewingItem);
                  }}
                  className="flex-1 bg-primary-container text-on-primary-container py-3 rounded-xl font-bold hover:bg-primary-container/80 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 size={18} />
                  تعديل الصنف
                </button>
                <button 
                  onClick={() => {
                    setItemToDelete(viewingItem.id);
                  }}
                  className="flex-1 bg-error-container text-error py-3 rounded-xl font-bold hover:bg-error-container/80 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  حذف الصنف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <a 
      href="#"
      onClick={(e) => { e.preventDefault(); onClick?.(); }}
      className={cn(
        "px-4 py-3 flex items-center gap-3 rounded-xl transition-all group active:scale-95",
        active 
          ? "bg-white text-primary shadow-sm border border-primary-fixed font-bold" 
          : "text-on-surface-variant hover:text-primary hover:bg-white/50"
      )}
    >
      <span className={cn("transition-colors", active ? "text-primary" : "text-on-surface-variant group-hover:text-primary")}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

function IconButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-2.5 rounded-full hover:bg-surface-container-low transition-colors active:scale-90 duration-200 text-on-surface-variant">
      {icon}
    </button>
  );
}

function StatusBadge({ status }: { status: ItemStatus }) {
  const configs = {
    'in-stock': { label: 'متوفر', classes: 'bg-primary-fixed text-on-primary-fixed-variant' },
    'low-stock': { label: 'كمية منخفضة', classes: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
    'out-of-stock': { label: 'نفذ المخزون', classes: 'bg-error-container text-on-error-container' }
  };

  const config = configs[status];

  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap", config.classes)}>
      {config.label}
    </span>
  );
}

function InputGroup({ label, placeholder, type = "text", value, onChange }: { label: string, placeholder: string, type?: string, value?: string | number, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-on-surface-variant">{label}</label>
      <input 
        type={type} 
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
        className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary transition-all text-sm outline-none"
      />
    </div>
  );
}

function StatCard({
  label, value, sub, icon, color, onClick, active
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: 'primary' | 'green' | 'orange' | 'red';
  onClick?: () => void;
  active?: boolean;
}) {
  const colorMap = {
    primary: {
      bg: 'bg-primary-fixed/40',
      icon: 'text-primary bg-primary-fixed',
      value: 'text-primary',
      ring: 'ring-primary',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-700 bg-green-100',
      value: 'text-green-700',
      ring: 'ring-green-400',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600 bg-orange-100',
      value: 'text-orange-600',
      ring: 'ring-orange-400',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-error bg-error-container',
      value: 'text-error',
      ring: 'ring-error',
    },
  };
  const c = colorMap[color];
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl p-5 border transition-all shadow-sm",
        onClick ? "cursor-pointer" : "",
        active ? `ring-2 ${c.ring} border-transparent` : "border-surface-container-high",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-on-surface-variant mb-1">{label}</p>
          <p className={cn("text-3xl font-extrabold", c.value)}>{value}</p>
          <p className="text-[11px] text-on-surface-variant mt-1.5">{sub}</p>
        </div>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", c.icon)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
