import React from 'react';
import { FileText, Check } from 'lucide-react';
import { Button } from '../ui';

interface InvoicesSectionProps {
  settings: {
    salesInvoicePrefix: string;
    purchaseInvoicePrefix: string;
    defaultPaymentTerms: number;
    taxRate: number;
    showTaxOnInvoice: boolean;
    printNotes: string;
  };
  onChange: (key: string, val: string | number | boolean) => void;
  onSave: () => void;
  isSaving?: boolean;
  savedMessage?: string;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3.5 rounded-xl hover:bg-surface-container-low/50 cursor-pointer transition-colors border border-surface-container-high">
      <p className="text-sm font-bold text-on-surface">{label}</p>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 ${checked ? 'bg-primary' : 'bg-surface-container-high'}`}
      >
        <span className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? '-translate-x-5' : 'translate-x-0'}`} />
      </button>
    </label>
  );
}

export function InvoicesSection({ settings, onChange, onSave, isSaving, savedMessage }: InvoicesSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm p-5 space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-surface-container-low">
        <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
          <FileText size={18} />
        </div>
        <div>
          <h3 className="font-extrabold text-on-surface">إعدادات الفواتير</h3>
          <p className="text-[11px] text-on-surface-variant">تخصيص الفواتير والضرائب وشروط الدفع</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { key: 'salesInvoicePrefix', label: 'بادئة فواتير المبيعات', placeholder: 'SO-' },
          { key: 'purchaseInvoicePrefix', label: 'بادئة فواتير المشتريات', placeholder: 'PO-' },
        ].map(f => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant block">{f.label}</label>
            <input
              value={(settings as any)[f.key]}
              onChange={e => onChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              dir="ltr"
            />
          </div>
        ))}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant block">شروط الدفع (أيام)</label>
          <input
            type="number"
            min={0}
            value={settings.defaultPaymentTerms}
            onChange={e => onChange('defaultPaymentTerms', Number(e.target.value))}
            className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant block">نسبة الضريبة (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={settings.taxRate}
            onChange={e => onChange('taxRate', Number(e.target.value))}
            className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-on-surface-variant block mb-1.5">ملاحظات الطباعة</label>
          <textarea
            rows={2}
            value={settings.printNotes}
            onChange={e => onChange('printNotes', e.target.value)}
            placeholder="مثال: شكراً لتعاملكم معنا"
            className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
          />
        </div>

        <div className="sm:col-span-2">
          <Toggle
            label="إظهار الضريبة في الفواتير"
            checked={settings.showTaxOnInvoice}
            onChange={v => onChange('showTaxOnInvoice', v)}
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

export default InvoicesSection;
