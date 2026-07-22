import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api';

export default function Billing() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/billing/create-checkout-session', { plan: 'Pro' });
      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Failed to create checkout session', error);
      alert('Failed to initiate checkout.');
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Billing & Subscription</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage your plan and payment methods.</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
          <h2 className="text-lg font-medium text-on-surface">Current Plan: Free</h2>
          <p className="text-sm text-on-surface-variant mt-2">
            You are currently on the free plan which includes up to 5 customers and 10 invoices per month.
          </p>
          
          <div className="mt-6">
            <button 
              onClick={handleUpgrade}
              disabled={loading}
              className="px-4 py-2 bg-primary text-on-primary font-medium rounded-md hover:bg-primary-container transition-colors disabled:opacity-50"
            >
              {loading ? 'Redirecting...' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
          <h2 className="text-lg font-medium text-on-surface">Payment Methods</h2>
          <div className="mt-4 flex items-center justify-center border-2 border-dashed border-outline-variant rounded-lg h-32 text-on-surface-variant">
            No payment methods found.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
