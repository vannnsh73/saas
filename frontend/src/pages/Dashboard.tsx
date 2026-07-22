import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, outstandingInvoices: 0, activeCustomers: 0 });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, invoicesRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/invoices')
        ]);
        setStats(statsRes.data);
        // Take the 5 most recent invoices
        setRecentInvoices(invoicesRes.data.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    
    // Trigger entrance animations
    setTimeout(() => {
        const elements = document.querySelectorAll('.entrance-anim');
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 100);
        });
    }, 100);
  }, []);

  return (
    <DashboardLayout>
      {/* Dashboard Welcome Section */}
      <div className="entrance-anim delay-75 opacity-0 translate-y-5 transition-all duration-700 ease-out">
        <h2 className="font-headline-lg text-[48px] text-on-surface mb-2 tracking-tight">Welcome back</h2>
        <p className="text-on-surface-variant font-body-md max-w-2xl">Your portfolio is performing at <span className="text-secondary font-bold">12% above benchmark</span> this month.</p>
      </div>

      {loading ? (
        <div className="text-on-surface p-10 animate-pulse">Loading analytics...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-pane rounded-xl p-6 glow-hover entrance-anim delay-100 opacity-0 translate-y-5 transition-all duration-700 ease-out">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/5 rounded-lg">
                  <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                </div>
                <span className="text-secondary text-sm font-bold">+5.2%</span>
              </div>
              <p className="text-outline text-[10px] font-bold uppercase tracking-wider mb-1">TOTAL INVOICED</p>
              <h3 className="font-title-md text-[20px] font-bold text-on-surface">${stats.totalRevenue.toFixed(2)}</h3>
              <div className="mt-4 h-1 bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-3/4"></div>
              </div>
            </div>

            <div className="glass-pane rounded-xl p-6 glow-hover entrance-anim delay-150 opacity-0 translate-y-5 transition-all duration-700 ease-out">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <span className="material-symbols-outlined text-secondary">check_circle</span>
                </div>
                <span className="text-secondary text-sm font-bold">+8.1%</span>
              </div>
              <p className="text-outline text-[10px] font-bold uppercase tracking-wider mb-1">PAID</p>
              <h3 className="font-title-md text-[20px] font-bold text-on-surface">${(stats.totalRevenue * 0.8).toFixed(2)}</h3>
              <div className="mt-4 h-1 bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-4/5"></div>
              </div>
            </div>

            <div className="glass-pane rounded-xl p-6 glow-hover entrance-anim delay-200 opacity-0 translate-y-5 transition-all duration-700 ease-out">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-tertiary-container/10 rounded-lg">
                  <span className="material-symbols-outlined text-on-tertiary-container">pending_actions</span>
                </div>
                <span className="text-outline text-sm font-bold">{stats.outstandingInvoices} Invoices</span>
              </div>
              <p className="text-outline text-[10px] font-bold uppercase tracking-wider mb-1">OUTSTANDING</p>
              <h3 className="font-title-md text-[20px] font-bold text-on-surface">${(stats.totalRevenue * 0.15).toFixed(2)}</h3>
              <div className="mt-4 h-1 bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-outline w-1/4"></div>
              </div>
            </div>

            <div className="glass-pane rounded-xl p-6 glow-hover entrance-anim delay-250 border-error/10 opacity-0 translate-y-5 transition-all duration-700 ease-out">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-error/10 rounded-lg">
                  <span className="material-symbols-outlined text-error">groups</span>
                </div>
                <span className="text-error text-sm font-bold">+12%</span>
              </div>
              <p className="text-outline text-[10px] font-bold uppercase tracking-wider mb-1">ACTIVE TENANTS</p>
              <h3 className="font-title-md text-[20px] font-bold text-on-surface">{stats.activeCustomers}</h3>
              <div className="mt-4 h-1 bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-error animate-pulse w-1/2"></div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            <div className="lg:col-span-8 glass-pane rounded-xl p-8 entrance-anim delay-300 opacity-0 translate-y-5 transition-all duration-700 ease-out">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-title-md text-[20px] font-bold">Recent Invoices</h4>
                  <p className="text-outline text-[10px] font-bold uppercase tracking-widest mt-1">Latest billing activity</p>
                </div>
                <a href="/invoices" className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/10 hover:bg-primary/20 transition-all">View All</a>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/5 text-[10px] uppercase tracking-widest text-outline">
                      <th className="pb-3 font-bold">Invoice ID</th>
                      <th className="pb-3 font-bold">Customer</th>
                      <th className="pb-3 font-bold">Amount</th>
                      <th className="pb-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-outline text-sm">No recent invoices found.</td>
                      </tr>
                    ) : (
                      recentInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                          <td className="py-4 font-mono text-xs text-on-surface-variant">#{inv.id.substring(0, 8).toUpperCase()}</td>
                          <td className="py-4 text-sm font-medium">{inv.customer?.name || 'Unknown'}</td>
                          <td className="py-4 text-sm font-bold text-on-surface">${inv.amount.toFixed(2)}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID' ? 'bg-[#d1fae5] text-[#065f46]' :
                              inv.status === 'SENT' ? 'bg-secondary-container text-on-secondary-container' :
                              inv.status === 'OVERDUE' ? 'bg-error-container text-on-error-container' :
                              'bg-surface-variant text-on-surface-variant'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-pane rounded-xl p-6 entrance-anim delay-350 opacity-0 translate-y-5 transition-all duration-700 ease-out">
                <h4 className="text-[10px] font-bold mb-6 uppercase tracking-widest text-outline">Revenue Breakdown</h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Collected</span>
                    <span className="text-secondary font-bold">
                      {stats.totalRevenue > 0 ? Math.round(((stats.totalRevenue * 0.8) / stats.totalRevenue) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${stats.totalRevenue > 0 ? Math.round(((stats.totalRevenue * 0.8) / stats.totalRevenue) * 100) : 0}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending / Outstanding</span>
                    <span className="text-error font-bold">
                      {stats.totalRevenue > 0 ? Math.round(((stats.totalRevenue * 0.2) / stats.totalRevenue) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-error rounded-full" style={{ width: `${stats.totalRevenue > 0 ? Math.round(((stats.totalRevenue * 0.2) / stats.totalRevenue) * 100) : 0}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="glass-pane rounded-xl p-6 entrance-anim delay-400 bg-surface-container-low opacity-0 translate-y-5 transition-all duration-700 ease-out">
                <h4 className="text-[10px] font-bold mb-4 uppercase tracking-widest text-outline">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <a href="/invoices" className="flex flex-col items-center justify-center p-4 bg-white border border-black/5 rounded-lg hover:bg-primary/5 transition-all gap-2 group">
                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">add_box</span>
                    <span className="text-[11px] font-bold text-on-surface">New Invoice</span>
                  </a>
                  <a href="/customers" className="flex flex-col items-center justify-center p-4 bg-white border border-black/5 rounded-lg hover:bg-primary/5 transition-all gap-2 group">
                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">person_add</span>
                    <span className="text-[11px] font-bold text-on-surface">Add Tenant</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
