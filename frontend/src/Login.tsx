import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/login', { email, password });
      await checkAuth();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low via-background to-surface-container-lowest pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <h1 className="font-display-lg text-[48px] font-black tracking-tighter text-primary">
            TenantInvoice
          </h1>
          <p className="mt-2 text-[12px] font-label-sm text-secondary tracking-[0.2em] uppercase">
            Financial Command Center
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-pane top-light-border w-full p-8 rounded-xl space-y-6">
          <div className="space-y-1">
            <h2 className="font-headline-lg-mobile text-[32px] text-on-surface font-bold tracking-tight">Access Portal</h2>
            <p className="text-[14px] font-label-md text-outline">Enter your credentials to continue.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="text-error text-sm font-bold bg-error-container p-3 rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[12px] font-label-sm text-on-surface-variant uppercase tracking-wider">Work Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">mail</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/50 border border-outline-variant/50 rounded-lg pl-10 pr-4 py-3 text-on-surface input-glow transition-all placeholder:text-outline-variant text-sm"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-label-sm text-on-surface-variant uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">lock</span>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/50 border border-outline-variant/50 rounded-lg pl-10 pr-4 py-3 text-on-surface input-glow transition-all placeholder:text-outline-variant text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-glow w-full bg-primary text-on-primary text-[14px] font-label-md py-4 rounded-lg flex items-center justify-center gap-2 group transition-all duration-300 mt-2"
            >
              <span>Access Portal</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-base">arrow_forward</span>
            </button>
          </form>

          <p className="text-center text-[12px] font-label-sm text-outline pt-2">
            No account yet?{' '}
            <Link to="/signup" className="text-primary hover:underline font-bold transition-colors">
              Initialize Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

