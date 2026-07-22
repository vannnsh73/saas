import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, tenant, logout } = useAuth();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'dashboard' },
    { name: 'Invoices', href: '/invoices', icon: 'receipt_long' },
    { name: 'Customers', href: '/customers', icon: 'domain' },
    { name: 'Team', href: '/team', icon: 'groups' },
    { name: 'Billing', href: '/billing', icon: 'credit_card' },
  ];

  return (
    <div className="font-body-md text-on-surface bg-surface min-h-screen">
      {/* Side Navigation */}
      <aside className="fixed left-0 top-0 h-full w-20 hover:w-64 transition-all duration-500 z-[60] bg-surface-container-lowest/90 backdrop-blur-2xl border-r border-black/5 shadow-[10px_0_30px_rgba(0,0,0,0.02)] group flex flex-col items-center py-8 gap-y-6">
        <div className="flex items-center gap-3 px-4 w-full justify-start overflow-hidden whitespace-nowrap">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg flex-shrink-0">
            <span className="material-symbols-outlined text-on-primary">domain</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="font-headline-lg-mobile text-primary tracking-tight">TenantInvoice</p>
            <p className="text-[10px] uppercase tracking-widest text-outline">{tenant?.name || 'Loading...'}</p>
          </div>
        </div>
        
        <nav className="flex flex-col w-full mt-10 gap-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center w-full px-6 py-3 group/nav transition-all duration-200 ${
                  isActive
                    ? 'text-secondary bg-secondary-container/10 border-r-2 border-secondary'
                    : 'text-outline hover:text-primary hover:bg-black/5'
                }`}
              >
                <span className="material-symbols-outlined mr-4">{item.icon}</span>
                <span className="opacity-0 group-hover:opacity-100 font-label-sm text-[12px] transition-opacity">{item.name}</span>
              </Link>
            );
          })}
          
          <div className="mt-auto pt-8">
            <button
              onClick={logout}
              className="flex items-center w-full px-6 py-3 text-error hover:bg-error/5 transition-all duration-200 group/nav"
            >
              <span className="material-symbols-outlined mr-4">logout</span>
              <span className="opacity-0 group-hover:opacity-100 font-label-sm text-[12px] transition-opacity">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="ml-20 transition-all duration-500">
        {/* Top App Bar */}
        <header className="fixed top-0 right-0 left-20 z-50 bg-surface/80 backdrop-blur-xl border-b border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex justify-between items-center px-10 py-4">
          <div className="flex items-center gap-4">
            <h1 className="font-headline-lg-mobile font-black tracking-tighter text-primary">{navigation.find(n => n.href === location.pathname)?.name || 'Portal'}</h1>
            <div className="hidden md:flex bg-surface-container-low rounded-full px-4 py-2 border border-black/5 focus-within:border-primary/50 transition-all">
              <span className="material-symbols-outlined text-outline text-sm mr-2">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-outline" 
                placeholder="Search invoices, tenants..." 
                type="text" 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    alert('Global search is indexing...');
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative text-on-surface-variant hover:text-primary transition-colors ${showNotifications ? 'text-primary' : ''}`}
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full"></span>
              </button>
              
              {showNotifications && (
                <div className="absolute top-full right-0 mt-4 w-72 bg-surface-container-lowest border border-black/5 shadow-xl rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2">
                  <div className="p-4 border-b border-black/5 flex justify-between items-center">
                    <h4 className="font-bold text-sm">Notifications</h4>
                    <button className="text-[10px] text-primary hover:underline font-bold">Mark all read</button>
                  </div>
                  <div className="divide-y divide-black/5 max-h-64 overflow-y-auto">
                    <div className="p-4 hover:bg-black/[0.02] transition-colors cursor-pointer flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-secondary text-sm">payments</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Invoice #INV-204 Paid</p>
                        <p className="text-xs text-outline mt-0.5">Acme Corp just paid $1,200.00</p>
                        <p className="text-[10px] text-outline mt-1 font-bold uppercase">10 mins ago</p>
                      </div>
                    </div>
                    <div className="p-4 hover:bg-black/[0.02] transition-colors cursor-pointer flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-error text-sm">warning</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Invoice Overdue</p>
                        <p className="text-xs text-outline mt-0.5">Globex invoice is 3 days overdue</p>
                        <p className="text-[10px] text-outline mt-1 font-bold uppercase">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-black/5 text-center">
                    <button className="text-xs font-bold text-outline hover:text-primary transition-colors">View All Notifications</button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => alert('Settings module is currently disabled for this tenant.')} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-black/5">
              <div className="text-right hidden sm:block">
                <p className="font-label-sm text-on-surface font-bold text-[12px]">{user?.email}</p>
                <p className="text-[10px] text-outline uppercase tracking-wider">{user?.role} Access</p>
              </div>
              <div className="w-10 h-10 rounded-full border border-primary/10 bg-surface-container-highest flex items-center justify-center font-bold text-primary">
                  {user?.email?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="pt-32 px-10 pb-20 max-w-[1280px] mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
