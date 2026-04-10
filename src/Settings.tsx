import React, { useState, useEffect } from 'react';
import { settingsApi } from './lib/api';
import { useToast } from './context/ToastContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { SettingsSectionNav, CompanySection, InventorySection, InvoicesSection, NotificationsSection, DataSection } from './components/settings';
import type { SettingsSection } from './components/settings';

export interface AppSettings {
  companyName: string;
  companyTagline: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  companyTaxNumber: string;
  companyWebsite: string;
  taxNumber: string;
  commercialRecord: string;
  lowStockThreshold: number;
  currency: string;
  purchaseInvoicePrefix: string;
  salesInvoicePrefix: string;
  taxRate: number;
  defaultInvoiceNotes: string;
  showTaxOnInvoice: boolean;
  defaultPaymentTerms: number;
  printNotes: string;
  notifyLowStock: boolean;
  notifyOutOfStock: boolean;
  notifyNewSale: boolean;
  emailNotifications: boolean;
  stockAlerts: boolean;
  invoiceReminders: boolean;
  smsNotifications: boolean;
  notificationEmail: string;
  notificationPhone: string;
  enableBarcodes: boolean;
  autoStockUpdate: boolean;
  theme: 'light' | 'dark' | 'system';
  itemsPerPage: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'المُنسق',
  companyTagline: 'نظام إدارة المخزون',
  companyPhone: '',
  companyEmail: '',
  companyAddress: '',
  companyTaxNumber: '',
  companyWebsite: '',
  taxNumber: '',
  commercialRecord: '',
  lowStockThreshold: 5,
  currency: 'SAR',
  purchaseInvoicePrefix: 'PO',
  salesInvoicePrefix: 'SO',
  taxRate: 15,
  defaultInvoiceNotes: '',
  showTaxOnInvoice: true,
  defaultPaymentTerms: 30,
  printNotes: '',
  notifyLowStock: true,
  notifyOutOfStock: true,
  notifyNewSale: false,
  emailNotifications: false,
  stockAlerts: true,
  invoiceReminders: false,
  smsNotifications: false,
  notificationEmail: '',
  notificationPhone: '',
  enableBarcodes: false,
  autoStockUpdate: true,
  theme: 'light',
  itemsPerPage: 25,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SettingsSection>('company');
  const [savedMessage, setSavedMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await settingsApi.getAll();
        if (mounted && res.success && res.data) {
          setSettings({ ...DEFAULT_SETTINGS, ...res.data });
        }
      } catch { /* use defaults */ }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const update = (key: string, val: any) => setSettings(s => ({ ...s, [key]: val }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await settingsApi.update(settings as any);
      if (res.success) {
        showSuccess('تم حفظ الإعدادات بنجاح');
        setSavedMessage('تم الحفظ');
        setTimeout(() => setSavedMessage(''), 2500);
      } else showError(res.error ?? 'فشل في حفظ الإعدادات');
    } catch { showError('حدث خطأ أثناء حفظ الإعدادات'); }
    finally { setIsSaving(false); }
  };

  const handleBackup = async () => {
    const res = await settingsApi.backup();
    if (res.success && res.data) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `almunassiq-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = async () => {
    setSettings(DEFAULT_SETTINGS);
    await settingsApi.update(DEFAULT_SETTINGS as any);
    showSuccess('تم إعادة ضبط الإعدادات');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row gap-5 max-w-5xl mx-auto">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <SettingsSectionNav active={activeSection} onChange={setActiveSection} />
        </div>

        {/* Section Content */}
        <div className="flex-1 min-w-0">
          {activeSection === 'company' && (
            <CompanySection
              settings={{
                companyName: settings.companyName,
                companyPhone: settings.companyPhone,
                companyEmail: settings.companyEmail,
                companyAddress: settings.companyAddress,
                taxNumber: settings.taxNumber || settings.companyTaxNumber,
                commercialRecord: settings.commercialRecord,
              }}
              onChange={update}
              onSave={handleSave}
              isSaving={isSaving}
              savedMessage={savedMessage}
            />
          )}

          {activeSection === 'inventory' && (
            <InventorySection
              settings={{
                lowStockThreshold: settings.lowStockThreshold,
                defaultWarehouseId: '',
                enableBarcodes: settings.enableBarcodes,
                autoStockUpdate: settings.autoStockUpdate,
              }}
              onChange={update}
              onSave={handleSave}
              isSaving={isSaving}
              savedMessage={savedMessage}
            />
          )}

          {activeSection === 'invoices' && (
            <InvoicesSection
              settings={{
                salesInvoicePrefix: settings.salesInvoicePrefix,
                purchaseInvoicePrefix: settings.purchaseInvoicePrefix,
                defaultPaymentTerms: settings.defaultPaymentTerms,
                taxRate: settings.taxRate,
                showTaxOnInvoice: settings.showTaxOnInvoice,
                printNotes: settings.printNotes || settings.defaultInvoiceNotes,
              }}
              onChange={update}
              onSave={handleSave}
              isSaving={isSaving}
              savedMessage={savedMessage}
            />
          )}

          {activeSection === 'notifications' && (
            <NotificationsSection
              settings={{
                emailNotifications: settings.emailNotifications,
                stockAlerts: settings.stockAlerts,
                invoiceReminders: settings.invoiceReminders,
                smsNotifications: settings.smsNotifications,
                notificationEmail: settings.notificationEmail,
                notificationPhone: settings.notificationPhone,
              }}
              onChange={update}
              onSave={handleSave}
              isSaving={isSaving}
              savedMessage={savedMessage}
            />
          )}

          {activeSection === 'data' && (
            <DataSection
              onBackup={handleBackup}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
