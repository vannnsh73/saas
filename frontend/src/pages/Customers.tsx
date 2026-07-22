import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  invoiceCount: number;
  totalBilled: number;
  totalPaid: number;
  createdAt: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', email: '', phone: '', company: '', address: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  async function fetchCustomers(search = '') {
    try {
      setLoading(true);
      const response = await api.get(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers(searchQuery);
  }, [searchQuery]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      if (isEditing) {
        await api.patch(`/api/customers/${form.id}`, { name: form.name, email: form.email, phone: form.phone, company: form.company, address: form.address });
      } else {
        await api.post('/api/customers', { name: form.name, email: form.email, phone: form.phone, company: form.company, address: form.address });
      }
      await fetchCustomers(searchQuery);
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save customer');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ id: '', name: '', email: '', phone: '', company: '', address: '' });
    setIsEditing(false);
    setFormError('');
  };

  const handleEdit = (customer: Customer) => {
    setForm({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || '',
      address: customer.address || '',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/api/customers/${id}`);
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete customer');
    }
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="entrance-anim visible flex justify-between items-center">
          <div>
            <h1 className="font-headline-lg-mobile text-[32px] font-black tracking-tighter text-primary">Customers</h1>
            <p className="text-sm text-on-surface-variant mt-1">Manage your tenant database and track billing history.</p>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-label-md text-[14px] rounded-lg hover:opacity-90 transition-all btn-glow"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Add Customer
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Customers', value: customers.length, icon: 'groups', color: 'text-primary' },
            { label: 'Total Billed', value: `$${customers.reduce((s, c) => s + c.totalBilled, 0).toFixed(2)}`, icon: 'receipt_long', color: 'text-secondary' },
            { label: 'Total Collected', value: `$${customers.reduce((s, c) => s + c.totalPaid, 0).toFixed(2)}`, icon: 'check_circle', color: 'text-[#059669]' },
            { label: 'Outstanding', value: `$${(customers.reduce((s, c) => s + c.totalBilled, 0) - customers.reduce((s, c) => s + c.totalPaid, 0)).toFixed(2)}`, icon: 'pending_actions', color: 'text-error' },
          ].map(stat => (
            <div key={stat.label} className="glass-pane rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`material-symbols-outlined text-base ${stat.color}`}>{stat.icon}</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{stat.label}</p>
              </div>
              <p className="text-xl font-bold text-on-surface">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 max-w-md glass-pane rounded-lg px-4 py-2">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
          <input
            type="text"
            placeholder="Search by name, email or company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-outline"
          />
        </div>

        {/* Table */}
        <div className="glass-pane rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-black/5">
            <thead className="bg-black/[0.02] text-outline text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th scope="col" className="px-6 py-4 text-left">Customer</th>
                <th scope="col" className="px-6 py-4 text-left">Company / Phone</th>
                <th scope="col" className="px-6 py-4 text-left">Invoices</th>
                <th scope="col" className="px-6 py-4 text-left">Billed / Paid</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-sm text-on-surface">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-outline animate-pulse">Loading customers...</td></tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline/30 block mb-3">groups</span>
                    <p className="text-on-surface-variant font-medium">No customers yet.</p>
                    <p className="text-outline text-xs mt-1">Click "Add Customer" to get started.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-black/[0.01] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                          {c.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface">{c.name}</p>
                          <p className="text-xs text-outline">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-on-surface">{c.company || '—'}</p>
                      <p className="text-xs text-outline">{c.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full text-xs font-bold">
                        {c.invoiceCount} {c.invoiceCount === 1 ? 'invoice' : 'invoices'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-on-surface">${c.totalBilled.toFixed(2)}</p>
                      <p className="text-xs text-[#059669] font-medium">Paid: ${c.totalPaid.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-xs font-medium text-secondary hover:underline transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="text-xs font-medium text-error hover:underline transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="glass-pane rounded-2xl w-full max-w-lg mx-4 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-headline-lg-mobile text-[28px] font-black tracking-tight text-on-surface">
                  {isEditing ? 'Edit Customer' : 'Add Customer'}
                </h2>
                <p className="text-sm text-outline mt-0.5">{isEditing ? 'Update customer details.' : 'Add a new tenant to your database.'}</p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-outline-variant/60 rounded-lg text-sm text-on-surface bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@company.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-outline-variant/60 rounded-lg text-sm text-on-surface bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">Company</label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={form.company}
                    onChange={e => setForm({ ...form, company: e.target.value })}
                    className="w-full px-3 py-2.5 border border-outline-variant/60 rounded-lg text-sm text-on-surface bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 555 000 0000"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-outline-variant/60 rounded-lg text-sm text-on-surface bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">Address</label>
                <input
                  type="text"
                  placeholder="123 Main St, City, State, ZIP"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2.5 border border-outline-variant/60 rounded-lg text-sm text-on-surface bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-outline-variant/60 text-on-surface text-sm font-medium rounded-lg hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <><span className="material-symbols-outlined text-base animate-spin">refresh</span> Saving...</>
                  ) : (
                    <><span className="material-symbols-outlined text-base">{isEditing ? 'save' : 'person_add'}</span> {isEditing ? 'Save Changes' : 'Add Customer'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
