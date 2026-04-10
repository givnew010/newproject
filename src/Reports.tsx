import React, { useState, useEffect } from 'react';
import { reportsApi } from './lib/api';
import { useInventory, useCustomers, useSuppliers } from './hooks/useApi';
import { useSettings } from './hooks/useApi';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorState } from './components/ui/ErrorState';
import { ReportsTabs, OverviewTab, InventoryTab, ReceivablesTab, PayablesTab } from './components/reports';
import type { ReportTab } from './components/reports';

interface Props {
  inventoryItems?: any[];
}

export default function Reports({ inventoryItems: _inventoryItems }: Props) {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { items: inventoryItems = [] } = useInventory();
  const { customers = [] } = useCustomers();
  const { suppliers = [] } = useSuppliers();
  const { settings } = useSettings();

  const lowStockThreshold = (settings as any)?.low_stock_threshold || 5;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [salesRes, purchasesRes] = await Promise.all([
          import('./lib/api').then(m => m.salesApi.getAll()),
          import('./lib/api').then(m => m.purchasesApi.getAll()),
        ]);
        if (salesRes.success) setSalesInvoices((salesRes.data as any)?.invoices || []);
        if (purchasesRes.success) setPurchaseInvoices((purchasesRes.data as any)?.invoices || []);
      } catch {
        setError('فشل في تحميل بيانات التقارير');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalSales = salesInvoices.reduce((s: number, i: any) => s + (i.totalAmount ?? 0), 0);
  const totalPurchases = purchaseInvoices.reduce((s: number, i: any) => s + (i.totalAmount ?? 0), 0);
  const netProfit = totalSales - totalPurchases;
  const inventoryValue = inventoryItems.reduce((s, i) => s + i.quantity * (i.price ?? i.selling_price ?? 0), 0);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <ReportsTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <OverviewTab data={{
          salesTotal: totalSales,
          purchasesTotal: totalPurchases,
          netProfit,
          inventoryValue,
          totalCustomers: customers.length,
          totalSuppliers: suppliers.length,
          salesCount: salesInvoices.length,
          purchasesCount: purchaseInvoices.length,
        }} />
      )}

      {activeTab === 'inventory' && (
        <InventoryTab items={inventoryItems} lowStockThreshold={lowStockThreshold} />
      )}

      {activeTab === 'receivables' && (
        <ReceivablesTab customers={customers.map((c: any) => ({
          id: c.id,
          name: c.name,
          total_invoices: c.total_invoices ?? 0,
          total_paid: c.total_paid ?? 0,
          total_due: c.total_due ?? 0,
        }))} />
      )}

      {activeTab === 'payables' && (
        <PayablesTab suppliers={suppliers.map((s: any) => ({
          id: s.id,
          name: s.name,
          total_invoices: s.total_invoices ?? 0,
          total_paid: s.total_paid ?? 0,
          total_due: s.total_due ?? 0,
        }))} />
      )}
    </div>
  );
}
