import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const companyName = `${firstName} ${lastName}`;
      await axios.post('/api/auth/signup', { companyName, email, password });
      await checkAuth();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  useEffect(() => {
    const testimonials = document.querySelectorAll('.testimonial-fade');
    testimonials.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('visible');
        }, 400 + (index * 400));
    });

    const card = document.getElementById('signupCard');
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(40px) scale(0.95)';
      setTimeout(() => {
          card.style.transition = 'all 1s cubic-bezier(0.16, 1, 0.3, 1)';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0) scale(1)';
      }, 200);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-0">
      <main className="relative z-10 w-full max-w-[1440px] mx-auto flex flex-col md:grid md:grid-cols-12 min-h-screen">
        {/* Left Side: Cinematic Visual Area */}
        <section className="hidden md:flex md:col-span-6 flex-col justify-between p-[40px]">
          <header>
            <h1 className="font-display-lg text-[48px] font-black tracking-tighter text-primary">
              TenantInvoice
            </h1>
            <p className="mt-4 font-label-md text-[14px] text-secondary tracking-[0.2em] uppercase">
              The Financial Command Center
            </p>
          </header>
          <div className="space-y-12 max-w-lg">
            {/* Sequential Testimonials */}
            <div className="space-y-8" id="testimonials">
              <div className="testimonial-fade opacity-0 translate-y-[20px]">
                <span className="material-symbols-outlined text-primary text-4xl mb-4 opacity-40" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
                <blockquote className="font-headline-lg text-[32px] font-light italic leading-tight text-on-background">
                  "The precision of their automated reconciliation transformed our entire real estate portfolio's cash flow visibility overnight."
                </blockquote>
                <div className="mt-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high border border-black/5 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAY264aXV40-SjbepZQYooFpD4y7blplX72575UvgFMdpvIHX3deOBKBzopH300H8wel4c_4HMerzMYna4VqZmSP0LSZnsEq11Q2jO7G4WzrdEXPi9epENRp6Us3VepKjtrb3VZd8RgoGjS6pZSl6Wzi0TqPA233sPWPHumvcYXzucOhwQ6_W0KAUrZtB0Bzw05F2hrGlQsIc_fmlGQ3iqJYUZcPwM8tVSSXRyFFY1CFJnYmz30NzHideovgFYNgpHr6T2gkYu-Rg')" }}></div>
                  <div>
                    <p className="font-label-md text-[14px] text-primary">Elena Rodriguez</p>
                    <p className="font-label-sm text-[12px] text-outline">CFO, Nexus Global Properties</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Social Proof */}
            <div className="flex items-center gap-6 pt-12 border-t border-black/5">
              <div className="flex -space-x-4">
                <div className="w-10 h-10 rounded-full border-2 border-background glass-pane bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAeClUprF26ZOTeUpZPjxAc3STTLDOgI2hH9D3st3cBvYGC5FEMkfldihp5Z7lxvCAEiLjUlnmbkCRHJnsAJZZYZfKk6HABCrvixnQeqOq81wFv7bOqNB5_GOFzDkWldrMF0Eu-nIpci_uU_WAwhscTP8Swlzlx6WFXoIdFVBpp9ys5EQRu1uTbkQAb_zFXPPcIehIf7Nf9lTncDGs5TR7RZUKGNzoYm4Kq_DTuVN7UknCh9ww6KBZxskBrq6NC7yFYvMTqp-8-bA')" }}></div>
                <div className="w-10 h-10 rounded-full border-2 border-background glass-pane bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCMQoOYUf4akUh8bmzAFXuVSS-RerYhrKg94YHE7WVTI_0sKS5kjlquv99KBGPZSGGAOFP06S3L-fF6Ajws-mMYCeYn-4fI3d86FA9jQWISSIgGz3692aj_8BbeMe7-rSt70fCCOg-RITl9JMib90cb002p0EKFUKZH0gnCHN1O-QzOcGezHH-nlmv2-pB1HO0_LpE65mcA8C3RT8DOoAC8eRaVvWEKvpVJFHqhl6e1ppv-PvHuOaJhg1VUXnNI_BZiRMVXeWSUrg')" }}></div>
                <div className="w-10 h-10 rounded-full border-2 border-background glass-pane flex items-center justify-center text-xs font-bold text-primary bg-primary/5 backdrop-blur-md">+</div>
              </div>
              <div>
                <p className="font-headline-md text-[24px] font-bold text-on-surface">2,400+</p>
                <p className="font-label-sm text-[12px] text-outline">Enterprises Scaling Faster</p>
              </div>
            </div>
          </div>
          <footer className="flex gap-6 text-outline font-label-sm text-[12px]">
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
          </footer>
        </section>

        {/* Right Side: Signup Card */}
        <section className="col-span-full md:col-span-6 flex items-center justify-center p-[16px] md:p-[40px]">
          <div className="parallax-card glass-pane top-light-border w-full max-w-md p-8 md:p-10 rounded-xl space-y-8" id="signupCard">
            <div className="space-y-2">
              <h2 className="font-headline-lg text-[32px] text-on-surface font-bold">Initialize Account</h2>
              <p className="font-body-md text-[16px] text-outline">Begin your journey into high-performance tenant management.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && <div className="text-error text-sm font-bold bg-error/10 p-2 rounded">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-label-sm text-[12px] text-on-surface-variant uppercase tracking-wider">First Name</label>
                  <input required className="w-full bg-white/50 border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface input-glow transition-all placeholder:text-outline-variant" placeholder="John" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="font-label-sm text-[12px] text-on-surface-variant uppercase tracking-wider">Last Name</label>
                  <input required className="w-full bg-white/50 border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface input-glow transition-all placeholder:text-outline-variant" placeholder="Doe" type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-sm text-[12px] text-on-surface-variant uppercase tracking-wider">Work Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">mail</span>
                  <input required className="w-full bg-white/50 border border-outline-variant/50 rounded-lg pl-10 pr-4 py-3 text-on-surface input-glow transition-all placeholder:text-outline-variant" placeholder="john@enterprise.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-sm text-[12px] text-on-surface-variant uppercase tracking-wider">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">lock</span>
                  <input required className="w-full bg-white/50 border border-outline-variant/50 rounded-lg pl-10 pr-4 py-3 text-on-surface input-glow transition-all placeholder:text-outline-variant" placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input required className="rounded border-outline-variant bg-white/50 text-primary focus:ring-primary/50 w-4 h-4" id="terms" type="checkbox" />
                <label className="font-label-sm text-[12px] text-outline" htmlFor="terms">
                  I agree to the <a className="text-primary hover:underline" href="#">Enterprise Agreement</a>
                </label>
              </div>
              <button type="submit" className="btn-glow w-full bg-primary text-on-primary font-label-md py-4 rounded-lg flex items-center justify-center gap-2 group transition-all duration-300">
                <span>Deploy Account</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </form>
            
            <p className="text-center font-label-sm text-[12px] text-outline pt-4">
                Already have an account? <Link className="text-primary hover:text-secondary-container transition-colors font-bold" to="/login">Access Portal</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
