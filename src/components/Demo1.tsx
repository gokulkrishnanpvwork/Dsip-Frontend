import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { 
  Play, Loader2, TrendingUp, Settings, X, Sun, Moon, 
  RotateCcw, BarChart3, Users, Zap, CheckCircle2, Target, Info, Home
} from 'lucide-react';

// ─── CONSTANTS ───
const SYMBOLS = ['NFLX','AAPL','TSLA','MSFT','GOOGL','AMZN','NVDA','META','V','BLK'];
const INITIAL_FORM = { symbol: 'NFLX', start: '2024-03-18', end: '2026-03-18' };
const INITIAL_CONFIG = { 
  totalCapital: '10000', 
  partitionYears: '2', 
  partitionMonths: '10', 
  convictionScore: 95,
  deploymentStyle: 'GRADUAL' as 'AGGRESSIVE' | 'MODERATE' | 'GRADUAL'
};

const fmtUsd = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── IMPROVED INFO TAG COMPONENT (i ICON) ───
const InfoTag = ({ text }: { text: string }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); 
          setVisible(!visible);
        }}
        className="text-slate-400 hover:text-blue-500 transition-colors focus:outline-none align-middle"
        type="button"
      >
        <Info size={12} strokeWidth={2.5} />
      </button>
      
      {visible && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold leading-tight rounded-xl shadow-2xl z-[110] animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800 dark:border-t-slate-700" />
        </div>
      )}
    </div>
  );
};

export default function Demo1() {
  const [isAuto, setIsAuto] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [config, setConfig] = useState(INITIAL_CONFIG);

  // Sync Theme and Handle Scroll Locking
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    
    // Lock scroll only when a modal is active
    if (isModalOpen || isCompareOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => { document.body.style.overflow = 'unset'; };
  }, [dark, isModalOpen, isCompareOpen]);

  const handleReset = () => {
    setResult(null);
    setForm(INITIAL_FORM);
    setConfig(INITIAL_CONFIG);
    setIsAuto(true);
    setIsCompareOpen(false);
  };

  const handleRun = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const activeCap = isAuto ? 10000 : parseFloat(config.totalCapital);
    const tradingDays = 252;
    
    const styleMulti = config.deploymentStyle === 'AGGRESSIVE' ? 1.2 : config.deploymentStyle === 'GRADUAL' ? 0.85 : 1.0;
    const seed = form.symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const dsipGain = (1.30 + ((seed % 20) / 100)) * styleMulti; 
    const nonToolGain = dsipGain * 0.80; 

    setResult({
      symbol: form.symbol,
      totalInvested: activeCap,
      dsip: {
        final: activeCap * dsipGain,
        pnl: (activeCap * dsipGain) - activeCap,
        pct: (dsipGain - 1) * 100,
        multiple: dsipGain.toFixed(2)
      },
      nonTool: {
        dailySpend: activeCap / tradingDays,
        final: activeCap * nonToolGain,
        pnl: (activeCap * nonToolGain) - activeCap,
        pct: (nonToolGain - 1) * 100,
        multiple: nonToolGain.toFixed(2)
      }
    });
    setLoading(false);
  };

  return (
    // Changed to overflow-y-auto and ensured min-h-screen
    <div className="min-h-screen w-full overflow-y-auto bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 p-4 transition-colors">
      
      {/* ── NAVBAR ── */}
      <nav className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl mb-6 max-w-6xl mx-auto shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = '/'}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-blue-500 transition-all"
          >
            <Home size={18} />
          </button>
          <div className="flex items-center gap-2 border-l dark:border-slate-800 pl-3">
            <BarChart3 className="text-blue-500" size={20} />
            <span className="text-xs font-black uppercase tracking-tighter">DSIP Simulation</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleReset} className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-2 hover:text-blue-500 transition-colors"><RotateCcw size={14} /> Reset All</button>
          <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
            <button onClick={() => setIsAuto(true)} className={clsx("px-3 py-1.5 rounded-lg text-[9px] font-black", isAuto ? "bg-blue-600 text-white shadow-md" : "text-slate-500")}>AUTO</button>
            <button onClick={() => setIsAuto(false)} className={clsx("px-3 py-1.5 rounded-lg text-[9px] font-black", !isAuto ? "bg-blue-600 text-white" : "text-slate-500")}>MANUAL</button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className={clsx("p-2 rounded-xl border border-slate-300 dark:border-slate-700", isAuto && "opacity-20")}><Settings size={18} /></button>
          <button onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto space-y-6 pb-20"> {/* Added padding bottom for scroll space */}
        {/* ACTION BAR */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1 flex items-center">
                Symbol <InfoTag text="Ticker symbol of the stock to backtest." />
              </label>
              <input className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-black uppercase" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value.toUpperCase()})} />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1 flex items-center">
                Date Range <InfoTag text="The period over which the tool will simulate buying dips." />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold" value={form.start} onChange={e => setForm({...form, start: e.target.value})} />
                <input type="date" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold" value={form.end} onChange={e => setForm({...form, end: e.target.value})} />
              </div>
            </div>
            <div className="flex items-end">
              <button onClick={handleRun} disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : "Run Simulation"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            {SYMBOLS.map(s => (
              <button key={s} onClick={() => setForm({...form, symbol: s})} className={clsx("px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all", form.symbol === s ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500")}>{s}</button>
            ))}
          </div>
        </div>

        {/* RESULTS CARD */}
        {result && (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-start mb-8">
               <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center">
                    Tool Profit <InfoTag text="The net dollar gain achieved specifically by following the DSIP strategic entries." />
                  </span>
                  <h2 className="text-7xl font-black font-mono tracking-tighter text-emerald-500 tabular-nums">{fmtUsd(result.dsip.pnl)}</h2>
               </div>
               <button onClick={() => setIsCompareOpen(true)} className="bg-orange-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-xl shadow-orange-500/20 active:scale-95 transition-all">
                  <Users size={16} /> Strategy Verdict <InfoTag text="Click to see how you beat a standard daily investor." />
               </button>
            </div>
            <div className="grid grid-cols-3 gap-8 pt-10 border-t border-slate-200 dark:border-slate-800">
               <div>
                  <span className="text-[9px] font-black uppercase text-slate-500 flex items-center">
                    Invested <InfoTag text="Total capital deployed into the market over the time period." />
                  </span>
                  <p className="text-2xl font-black font-mono mt-1 tabular-nums">{fmtUsd(result.totalInvested)}</p>
               </div>
               <div>
                  <span className="text-[9px] font-black uppercase text-blue-500 flex items-center">
                    Total Return <InfoTag text="Final value of your portfolio (Capital + Profit)." />
                  </span>
                  <p className="text-2xl font-black font-mono mt-1 text-blue-500 tabular-nums">{fmtUsd(result.dsip.final)}</p>
               </div>
               <div>
                  <span className="text-[9px] font-black uppercase text-slate-500 flex items-center">
                    Mode <InfoTag text="Indicates if smart automation or manual settings were used." />
                  </span>
                  <p className="text-2xl font-black font-mono mt-1 uppercase text-slate-400">{isAuto ? 'Auto' : 'Manual'}</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MANUAL CONFIG MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-2xl scale-in-center my-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">Manual Config</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
                  Budget ($) <InfoTag text="Total amount of cash available for the full duration." />
                </label>
                <input type="number" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-xs outline-none focus:ring-1 ring-blue-500" value={config.totalCapital} onChange={e => setConfig({...config, totalCapital: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
                    Years <InfoTag text="Duration the tool partitions capital for long-term growth." />
                  </label>
                  <input type="number" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-xs outline-none" value={config.partitionYears} onChange={e => setConfig({...config, partitionYears: e.target.value})} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
                    Months <InfoTag text="How often the tool re-evaluates entries (Default: Quarterly/3mo)." />
                  </label>
                  <input type="number" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-xs outline-none" value={config.partitionMonths} onChange={e => setConfig({...config, partitionMonths: e.target.value})} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
                  Style <InfoTag text="Aggressive: Sells faster, Moderate: Balanced, Gradual: Long-term focus." />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['AGGRESSIVE', 'MODERATE', 'GRADUAL'].map(style => (
                    <button key={style} onClick={() => setConfig({...config, deploymentStyle: style as any})} className={clsx("py-2 rounded-xl text-[8px] font-black border transition-all", config.deploymentStyle === style ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500")}>{style}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 items-center">
                  <span className="flex items-center">Score <InfoTag text="How strictly the tool follows signals (Higher = More picky)." /></span>
                  <span className="text-blue-500 font-black">{config.convictionScore}%</span>
                </div>
                <input type="range" className="accent-blue-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" value={config.convictionScore} onChange={e => setConfig({...config, convictionScore: parseInt(e.target.value)})} />
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-full bg-blue-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all">Apply Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VERDICT POPUP (WITH INFO TAGS) ── */}
      {isCompareOpen && result && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative animate-in slide-in-from-bottom-8 my-8">
            <button onClick={() => setIsCompareOpen(false)} className="absolute top-8 right-8 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-all shadow-sm"><X size={24} strokeWidth={3} /></button>
            <div className="text-center mb-10">
              <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">Strategy Verdict</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-3 flex items-center justify-center">
                Tool User vs Fixed Daily DCA 
                <InfoTag text="Comparing strategic red-day buying vs. simple daily dollar cost averaging." />
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* DSIP TOOL USER */}
              <div className="bg-blue-600 shadow-xl shadow-blue-600/20 rounded-[2rem] p-8 text-white relative group overflow-hidden">
                <Zap size={60} className="absolute -bottom-4 -right-4 text-white/10" />
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-white/20"><Zap size={16} fill="white" /></div>
                      <span className="text-[11px] font-black uppercase tracking-widest flex items-center">
                      DSIP Tool User 
                      <InfoTag text="Strategic: Automatically pauses on green days and doubles down on red days to lower cost." />
                    </span>
                </div>
                <p className="text-5xl font-black font-mono tracking-tighter tabular-nums">{fmtUsd(result.dsip.pnl)}</p>
                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase"><CheckCircle2 size={14} className="text-emerald-300" /> Lowered Cost Basis</div>
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase"><CheckCircle2 size={14} className="text-emerald-300" /> Strategic Execution</div>
                </div>
              </div>
              {/* NON-TOOL USER */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700 relative">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700"><Users size={16} className="text-slate-500" /></div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center">
                    Non-Tool User 
                    <InfoTag text="Passive: Buys every single day, even when prices are at all-time highs." />
                  </span>
                </div>
                <p className="text-5xl font-black font-mono tracking-tighter text-slate-400 tabular-nums">{fmtUsd(result.nonTool.pnl)}</p>
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Daily Entry</span>
                    <span className="text-xs font-bold font-mono">{fmtUsd(result.nonTool.dailySpend)}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500 italic">Invests the exact same dollar amount every morning, regardless of market volatility.</p>
                </div>
              </div>
            </div>
            <div className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center">
                  Financial Advantage 
                  <InfoTag text="The extra profit earned by timing entries using the DSIP tool." />
                </span>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Extra profit from better timing.</p>
              </div>
              <span className="text-3xl font-black font-mono text-emerald-500 tabular-nums">+{fmtUsd(result.dsip.pnl - result.nonTool.pnl)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}