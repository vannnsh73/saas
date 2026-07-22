import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api';

interface Customer { id: string; name: string; email: string; }
interface Invoice {
  id: string;
  amount: number;
  status: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  customer: Customer;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT:   'bg-surface-variant text-on-surface-variant',
  SENT:    'bg-secondary-container text-on-secondary-container',
  PAID:    'bg-[#d1fae5] text-[#065f46]',
  OVERDUE: 'bg-error-container text-on-error-container',
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customerId: '', amount: '', dueDate: '', notes: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Detail/action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchData() {
    try {
      const [invRes, custRes] = await Promise.all([
        api.get('/api/invoices'),
        api.get('/api/customers'),
      ]);
      setInvoices(invRes.data);
      setCustomers(custRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await api.post('/api/invoices', form);
      await fetchData();
      setShowModal(false);
      setForm({ customerId: '', amount: '', dueDate: '', notes: '' });
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (invoiceId: string, status: string) => {
    setActionLoading(invoiceId + status);
    try {
      const res = await api.patch(`/api/invoices/${invoiceId}/status`, { status });
      setInvoices(invoices.map(inv => inv.id === invoiceId ? res.data : inv));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    if (!confirm('Mark this invoice as paid? This will record full payment.')) return;
    setActionLoading(invoiceId + 'paid');
    try {
      const res = await api.patch(`/api/invoices/${invoiceId}/status`, { status: 'PAID' });
      setInvoices(invoices.map(inv => inv.id === invoiceId ? res.data : inv));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to mark as paid');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyPaymentLink = async (invoiceId: string) => {
    // Generate a public payment link the admin can copy and send to the customer
    const link = `${window.location.origin}/pay/${invoiceId}`;
    try {
      await navigator.clipboard.writeText(link);
      alert(`Payment link copied!\n\nSend this to your customer:\n${link}`);
    } catch {
      prompt('Copy this payment link and send to your customer:', link);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    setActionLoading(invoiceId + 'delete');
    try {
      await api.delete(`/api/invoices/${invoiceId}`);
      setInvoices(invoices.filter(inv => inv.id !== invoiceId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const isOverdue = (inv: Invoice) =>
    inv.status !== 'PAID' && inv.dueDate && new Date(inv.dueDate) < new Date();

  const filtered = filterStatus === 'ALL'
    ? invoices
    : invoices.filter(inv => inv.status === filterStatus);

  const summary = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    outstanding: invoices.filter(i => i.status !== 'PAID').length,
    totalValue: invoices.reduce((s, i) => s + i.amount, 0),
    paidValue: invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Invoices</h1>
            <p className="text-sm text-on-surface-variant mt-1">Create, manage and track your invoices.</p>
          </div>
          <button
            onClick={() => { setShowModal(true); setFormError(''); }}
            className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            + New Invoice
          </button>
        </div>

        {/* Summary Cards */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Invoices', value: summary.total },
              { label: 'Paid', value: summary.paid },
              { label: 'Outstanding', value: summary.outstanding },
              { label: 'Revenue Collected', value: `$${summary.paidValue.toFixed(2)}` },
            ].map(card => (
              <div key={card.label} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
                <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold text-on-surface mt-1">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-outline-variant pb-0">
          {['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                filterStatus === s
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {s}
              {s !== 'ALL' && (
                <span className="ml-1.5 text-xs bg-surface-container px-1.5 py-0.5 rounded-full">
                  {invoices.filter(i => i.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-outline-variant">
            <thead className="bg-surface-container text-on-surface-variant text-xs uppercase font-medium tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Invoice</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Due Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">Loading invoices...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">No invoices found. Create your first one!</td></tr>
              ) : (
                filtered.map(inv => {
                  const overdue = isOverdue(inv);
                  const effectiveStatus = overdue && inv.status === 'SENT' ? 'OVERDUE' : inv.status;
                  return (
                    <tr key={inv.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-on-surface-variant">#{inv.id.substring(0, 8).toUpperCase()}</span>
                        {inv.notes && <p className="text-xs text-on-surface-variant mt-0.5 truncate max-w-[180px]">{inv.notes}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{inv.customer?.name}</p>
                        <p className="text-xs text-on-surface-variant">{inv.customer?.email}</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold">${inv.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${STATUS_STYLES[effectiveStatus] || STATUS_STYLES.DRAFT}`}>
                          {effectiveStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {inv.dueDate ? (
                          <span className={overdue ? 'text-error font-medium' : 'text-on-surface-variant'}>
                            {new Date(inv.dueDate).toLocaleDateString()}
                            {overdue && ' ⚠ Overdue'}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'DRAFT' && (
                            <button
                              onClick={() => handleStatusChange(inv.id, 'SENT')}
                              disabled={actionLoading === inv.id + 'SENT'}
                              className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary-container/40 text-secondary hover:bg-secondary-container transition-colors disabled:opacity-50"
                            >
                              Mark Sent
                            </button>
                          )}
                          {(inv.status === 'SENT' || inv.status === 'OVERDUE') && (
                            <button
                              onClick={() => handleCopyPaymentLink(inv.id)}
                              disabled={actionLoading === inv.id + 'link'}
                              title="Copy payment link to send to customer"
                              className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[12px]">link</span>
                              Copy Link
                            </button>
                          )}
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={() => handleMarkPaid(inv.id)}
                              disabled={actionLoading === inv.id + 'paid'}
                              className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0] transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[12px]">check_circle</span>
                              {actionLoading === inv.id + 'paid' ? '...' : 'Mark Paid'}
                            </button>
                          )}
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={() => handleDelete(inv.id)}
                              disabled={actionLoading === inv.id + 'delete'}
                              className="text-xs font-medium text-error hover:underline disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-lg w-full max-w-lg mx-4 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-on-surface">New Invoice</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {formError && <div className="p-3 rounded-md bg-error-container text-on-error-container text-sm">{formError}</div>}

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Customer *</label>
                {customers.length === 0 ? (
                  <p className="text-sm text-error">No customers found. Please add a customer first.</p>
                ) : (
                  <select
                    required
                    value={form.customerId}
                    onChange={e => setForm({ ...form, customerId: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">— Select customer —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Amount (USD) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 500.00"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional: project name, description..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-outline-variant text-on-surface text-sm font-medium rounded-md hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || customers.length === 0}
                  className="flex-1 px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {formLoading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

