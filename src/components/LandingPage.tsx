import React from 'react';
import { useAppSelector } from '../store/hooks';
import { redirectToGoogleLogin } from '../utils/auth';

const LandingPage: React.FC = () => {
  const isLoading = useAppSelector(state => state.auth.isLoading);
  return (

    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-900 to-slate-950 text-white selection:bg-indigo-500/30">

      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      <div className="max-w-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

        {/* Logo / Icon */}
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center mb-10 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] border border-white/10 ring-1 ring-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400 mb-8 tracking-tight drop-shadow-sm">
          Master Your <br />
          <span className="text-indigo-400">Financial Destiny.</span>
        </h1>

        {/* Value Props */}
        <p className="text-slate-400 mb-12 text-xl md:text-2xl font-medium leading-relaxed max-w-lg mx-auto">
          You're not a blind retail investor anymore. Deploy your capital like an <span className="text-white">experienced angel investor.</span>.
        </p>

        {/* CTA Button */}
        <button
          onClick={redirectToGoogleLogin}
          disabled={isLoading}
          className="group relative w-full md:w-auto bg-white hover:bg-slate-50 text-slate-900 font-bold py-5 px-10 rounded-2xl flex items-center justify-center gap-4 shadow-[0_20px_50px_-12px_rgba(255,255,255,0.2)] hover:shadow-[0_20px_50px_-12px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 mx-auto"
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="Google" />
          <span className="text-lg tracking-wide">Continue with Google</span>
          <div className="absolute inset-0 rounded-2xl ring-2 ring-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Trust Markers */}
        <div className="mt-16 pt-8 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">100%</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Logic Driven</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">0%</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Emotional Bias</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">24/7</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Market Watch</p>
          </div>
        </div>

        <p className="mt-12 text-xs text-slate-600 font-medium">
          By entering, you confirm your commitment to disciplined growth.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
