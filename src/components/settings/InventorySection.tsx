import React from 'react';
import { Package, Check } from 'lucide-react';
import { Button } from '../ui';

interface InventorySectionProps {
  settings: {
    lowStockThreshold: number;
    defaultWarehouseId: string;
    enableBarcodes: boolean;
    autoStockUpdate: boolean;
  };
  onChange: (key: string, val: string | number | boolean) => void;
  onSave: () => void;
  isSaving?: boolean;
  savedMessage?: string;
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3.5 rounded-xl hover:bg-surface-container-low/50 cursor-pointer transition-colors">
      <div>
        <p className="text-sm font-bold text-on-surface">{label}</p>
        {sub && <p className="text-[11px] text-on-surface-variant">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 ${checked ? 'bg-primary' : 'bg-surface-container-high'}`}
      >
        <span className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? '-translate-x-5' : 'translate-x-0'}`} />
      </button>
    </label>
  );
}

export function InventorySection({ settings, onChange, onSave, isSaving, savedMessage }: InventorySectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm p-5 space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-surface-container-low">
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
          <Package size={18} />
        </div>
        <div>
          <h3 className="font-extrabold text-on-surface">إعدادات المخزون</h3>
          <p className="text-[11px] text-on-surface-variant">حدود التنبيه وخيارات متابعة المخزون</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant block">حد المخزون المنخفض</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={settings.lowStockThreshold}
              onChange={e => onChange('lowStockThreshold', Number(e.target.value))}
              className="w-32 border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all text-center"
            />
            <span className="text-sm text-on-surface-variant">وحدة</span>
          </div>
          <p className="text-[11px] text-on-surface-variant">يُعرض تنبيه عند وصول المخزون إلى هذا الحد</p>
        </div>

        <div className="divide-y divide-surface-container-low border border-surface-container-high rounded-xl overflow-hidden">
          <Toggle
            label="تفعيل الباركود"
            sub="طباعة وقراءة الباركود للأصناف"
            checked={settings.enableBarcodes}
            onChange={v => onChange('enableBarcodes', v)}
          />
          <Toggle
            label="تحديث المخزون تلقائياً"
            sub="تعديل الكميات عند حفظ الفواتير"
            checked={settings.autoStockUpdate}
            onChange={v => onChange('autoStockUpdate', v)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-surface-container-low">
        <Button variant="primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
        </Button>
        {savedMessage && (
          <span className="flex items-center gap-1.5 text-xs text-success font-bold"><Check size={14} />{savedMessage}</span>
        )}
      </div>
    </div>
  );
}

export default InventorySection;
