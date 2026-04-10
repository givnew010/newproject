import React from 'react';
import { Building2, Upload, Check } from 'lucide-react';
import { Button } from '../ui';

interface CompanySectionProps {
  settings: {
    companyName: string;
    companyPhone: string;
    companyEmail: string;
    companyAddress: string;
    taxNumber: string;
    commercialRecord: string;
  };
  onChange: (key: string, val: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  savedMessage?: string;
}

function FieldRow({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-on-surface-variant block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
      />
    </div>
  );
}

export function CompanySection({ settings, onChange, onSave, isSaving, savedMessage }: CompanySectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm p-5 space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-surface-container-low">
        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
          <Building2 size={18} />
        </div>
        <div>
          <h3 className="font-extrabold text-on-surface">معلومات الشركة</h3>
          <p className="text-[11px] text-on-surface-variant">معلومات أساسية تظهر في الفواتير والتقارير</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldRow label="اسم الشركة *" value={settings.companyName} onChange={v => onChange('companyName', v)} placeholder="مثال: شركة المنسق للتجارة" />
        <FieldRow label="هاتف الشركة" value={settings.companyPhone} onChange={v => onChange('companyPhone', v)} placeholder="0112345678" />
        <FieldRow label="البريد الإلكتروني" value={settings.companyEmail} onChange={v => onChange('companyEmail', v)} placeholder="info@company.com" type="email" />
        <FieldRow label="الرقم الضريبي" value={settings.taxNumber} onChange={v => onChange('taxNumber', v)} placeholder="300xxxxxxxxx" />
        <FieldRow label="السجل التجاري" value={settings.commercialRecord} onChange={v => onChange('commercialRecord', v)} placeholder="1010XXXXXX" />
        <div className="sm:col-span-2">
          <FieldRow label="عنوان الشركة" value={settings.companyAddress} onChange={v => onChange('companyAddress', v)} placeholder="المدينة، الحي، الشارع..." />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-surface-container-low">
        <Button variant="primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'جارٍ الحفظ...' : 'حفظ المعلومات'}
        </Button>
        {savedMessage && (
          <span className="flex items-center gap-1.5 text-xs text-success font-bold"><Check size={14} />{savedMessage}</span>
        )}
      </div>
    </div>
  );
}

export default CompanySection;
