/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, Settings, LayoutDashboard, Package, Warehouse, 
  BarChart3, Plus, HelpCircle, 
  Filter, ArrowUpDown, Download, Barcode, Edit2, Trash2, X, 
  Camera, ScanBarcode, ChevronRight, ChevronLeft, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InventoryItem, ItemStatus } from './types';

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

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
          <NavItem icon={<Package size={20} />} label="الأصناف" active />
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
            <h2 className="font-headline font-extrabold text-primary text-xl lg:text-2xl">إدارة الأصناف</h2>
            
            <div className="hidden md:flex relative group mr-4">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input 
                type="text" 
                placeholder="بحث عن صنف..." 
                className="bg-surface-container-high border-none rounded-xl pr-10 pl-4 py-2 w-64 focus:ring-2 focus:ring-primary transition-all text-sm outline-none"
              />
            </div>
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

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8 space-y-8 flex-1">
          {/* Table Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="bg-white px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant flex items-center gap-2 border border-surface-container-high hover:bg-surface-container-low transition-colors shadow-sm">
                <Filter size={18} />
                <span>تصفية</span>
              </button>
              <button className="bg-white px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant flex items-center gap-2 border border-surface-container-high hover:bg-surface-container-low transition-colors shadow-sm">
                <ArrowUpDown size={18} />
                <span>ترتيب</span>
              </button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 py-2.5 bg-white text-on-surface border border-surface-container-high rounded-xl font-bold text-sm hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 shadow-sm">
                <Download size={18} />
                تصدير البيانات
              </button>
              <button 
                onClick={openAddModal}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-container text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 active:scale-95"
              >
                <Plus size={20} />
                <span className="text-sm">إضافة صنف جديد</span>
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-surface-container-low">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-surface-container-low/50 border-b border-surface-container-high">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"># الرقم</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">اسم الصنف</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">الرمز (SKU)</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">الكمية</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">السعر</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">الباركود</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-left">العمليات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {items.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => setViewingItem(item)}
                      className="hover:bg-surface-container-low/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-on-surface-variant/60">{item.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="block text-sm font-bold text-on-surface">{item.name}</span>
                            <span className="block text-[10px] text-on-surface-variant">{item.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant font-mono">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">{item.quantity} وحدة</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{item.price.toLocaleString('ar-SA')} ر.س</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Barcode size={20} className="text-on-surface-variant/40" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(item);
                            }}
                            className="p-2 text-on-surface-variant/60 hover:text-primary hover:bg-primary-fixed/30 rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="p-2 text-on-surface-variant/60 hover:text-error hover:bg-error-container rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 bg-surface-container-low/30 border-t border-surface-container-high flex items-center justify-between">
              <span className="text-xs text-on-surface-variant font-medium">عرض 1-{items.length} من أصل {totalItems.toLocaleString('ar-SA')} صنف</span>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg border border-surface-container-high hover:bg-white transition-all disabled:opacity-50">
                  <ChevronRight size={20} />
                </button>
                <button className="p-2 rounded-lg border border-surface-container-high bg-white shadow-sm hover:bg-surface-container-low transition-all">
                  <ChevronLeft size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
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

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <a 
      href="#" 
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
