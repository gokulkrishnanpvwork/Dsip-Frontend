import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../constants';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
// constants.ts
import { 
  // ... other icons
  ShieldCheck, 
  History 
} from 'lucide-react';
// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModeToggle } from './mode-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Documentation: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const [activeSection, setActiveSection] = useState('intro');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  function handleNavigation(path: string): void {
    navigate(path);
  }

  const sections = [
    { id: 'intro', title: 'System Overview', icon: <Icons.Activity size={16} /> },
    { id: 'deployment', title: 'Deployment Styles', icon: <Icons.TrendingUp size={16} /> },
    { id: 'execution', title: 'Daily Execution', icon: <Icons.Zap size={16} /> },
    { id: 'risk', title: 'Kill Switch Logic', icon: <Icons.AlertTriangle size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden font-sans">
      {/* 1. TOP NAVBAR */}
      <header className="px-6 py-4 flex items-center justify-between bg-background shrink-0 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="hover:bg-muted/50">
            <Icons.ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Documentation</h1>
            <p className="text-muted-foreground text-xs font-medium">System Protocols & Strategy Guide</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-all outline-none">
                <div className="relative">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="" className="w-9 h-9 rounded-full border object-cover shadow-sm" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm">
                      {user?.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-sm font-semibold leading-none">{user?.name || "Guest User"}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{user?.email || ""}</span>
                </div>
                <Icons.TrendingUp size={16} className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-1.5">
              <DropdownMenuLabel className="text-xs">Navigation</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleNavigation("/simulation")} className="cursor-pointer">
                <Icons.Activity className="mr-2 h-4 w-4" /> Simulation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigation("/documentation")} className="cursor-pointer bg-primary/10">
                <Icons.Activity className="mr-2 h-4 w-4" /> Documentation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span>Appearance</span>
                <ModeToggle />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <Icons.Home className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 2. DUAL COLUMN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR: NAVIGATION */}
        <aside className="w-64 border-r bg-muted/20 hidden md:block">
          <ScrollArea className="h-full py-6 px-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 px-2">Core Guides</p>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeSection === section.id 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {section.icon}
                  {section.title}
                </button>
              ))}
            </nav>
          </ScrollArea>
        </aside>
{/* RIGHT SIDE: CONTENT EXPLANATION */}
        <main className="flex-1 bg-background relative overflow-hidden">
          <ScrollArea className="h-full p-6 md:p-10">
            <div className="max-w-3xl mx-auto space-y-10 pb-20">
              
              {/* 1. System Protocol Overview */}
              {activeSection === 'intro' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase mb-4">
                    <ShieldCheck size={12} /> System Protocol overview
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter mb-4">System Protocol Overview</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The Stock Engine is a disciplined capital deployment platform designed to eliminate emotional bias and leverage market volatility through mathematical precision. Unlike traditional retail investing, where capital is often deployed in large, unoptimized chunks, this system uses <strong>Partition-Based Execution (PBE)</strong>.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Card className="bg-muted/30 border-none">
                      <CardContent className="p-4">
                        <h4 className="font-bold text-sm mb-1">Logic-Driven Growth</h4>
                        <p className="text-xs text-muted-foreground">Every recommendation is generated based on price deviation, historical holding averages, and your defined conviction level.</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-none">
                      <CardContent className="p-4">
                        <h4 className="font-bold text-sm mb-1">The "Anti-FOMO" Shield</h4>
                        <p className="text-xs text-muted-foreground">By mandating daily "Lock-In" percentages, the engine prevents users from over-investing during market peaks.</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* 2. Stock Engine Creation */}
              {activeSection === 'creation' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-3xl font-black tracking-tighter mb-4">Stock Engine Creation</h2>
                  <p className="text-muted-foreground mb-6">Starting a new "Engine" requires a strategic configuration that acts as your investment's DNA.</p>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50 border">
                      <h4 className="font-bold text-sm">Total Planned Capital</h4>
                      <p className="text-xs text-muted-foreground">Define the absolute maximum budget for this specific asset.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border">
                      <h4 className="font-bold text-sm">Conviction Period (Years)</h4>
                      <p className="text-xs text-muted-foreground">The timeframe over which you intend to build this position. The engine uses this to calculate "Neutral Capital".</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border">
                      <h4 className="font-bold text-sm">Load Factor (Deployment Style)</h4>
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc pl-4">
                        <li><strong>Gradual Build:</strong> Prioritizes safety and long-term price averaging.</li>
                        <li><strong>Balanced Build:</strong> Standard mathematical optimization for steady growth.</li>
                        <li><strong>Aggressive Early:</strong> Deploys higher capital in initial partitions.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Daily Smart Execution */}
              {activeSection === 'execution' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-3xl font-black tracking-tighter mb-4">Daily Smart Execution</h2>
                  <p className="text-muted-foreground">The core of the daily workflow is the <strong>Execution Zone</strong>, where the engine provides real-time buy recommendations.</p>
                  <div className="mt-8 space-y-6">
                    <div>
                      <h4 className="font-bold text-lg">The Lock-In Percentage</h4>
                      <p className="text-sm text-muted-foreground">Users enter the current price change (e.g., -2.4%). The engine analyzes this against your average holding price to determine if the dip is a high-value opportunity.</p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-bold text-lg mb-3">Recommendation Breakdown</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-950 rounded border border-slate-800 text-center">
                          <p className="text-[10px] text-cyan-500 font-bold uppercase">Neutral Capital</p>
                          <p className="text-[10px] text-slate-400 mt-1">Base daily amount</p>
                        </div>
                        <div className="p-3 bg-slate-950 rounded border border-slate-800 text-center">
                          <p className="text-[10px] text-cyan-500 font-bold uppercase">Opportunity Multiplier</p>
                          <p className="text-[10px] text-slate-400 mt-1">Amplifies on deep dips</p>
                        </div>
                        <div className="p-3 bg-slate-950 rounded border border-slate-800 text-center">
                          <p className="text-[10px] text-cyan-500 font-bold uppercase">Conviction Amplifier</p>
                          <p className="text-[10px] text-slate-400 mt-1">Manual thesis override</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Partition Tracking */}
              {activeSection === 'tracking' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-3xl font-black tracking-tighter mb-4">Partition Tracking & Lifecycle</h2>
                  <p className="text-muted-foreground">Investments are managed in "Partitions" or "Cycles," creating a structured roadmap for your capital.</p>
                  <div className="grid gap-6 mt-8">
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="font-bold flex items-center gap-2"><Icons.Activity size={18} className="text-primary"/> Live Investment Cycle</h4>
                        <p className="text-sm text-muted-foreground mt-2">View the progress of your active partition, including capital remaining and projected days to completion.</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="font-bold flex items-center gap-2"><Icons.Target size={18} className="text-primary"/> Deployment Progress</h4>
                        <p className="text-sm text-muted-foreground mt-2">A visual roadmap (Diamond Matrix) showing verified, active, or upcoming partitions.</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* 5. Performance Analysis */}
              {activeSection === 'performance' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-3xl font-black tracking-tighter mb-4">Performance Analysis & History</h2>
                  <p className="text-muted-foreground">The <strong>Performance Sidebar</strong> provides a high-level audit of your engine's health.</p>
                  <div className="space-y-4 mt-6">
                    <div className="flex justify-between items-center p-4 border-b">
                      <div>
                        <h4 className="font-bold text-sm">Net Yield Analysis</h4>
                        <p className="text-xs text-muted-foreground">Real-time P&L tracking relative to invested capital.</p>
                      </div>
                      <Icons.TrendingUp className="text-emerald-500" />
                    </div>
                    <div className="flex justify-between items-center p-4 border-b">
                      <div>
                        <h4 className="font-bold text-sm">Execution History</h4>
                        <p className="text-xs text-muted-foreground">A detailed audit trail of every order placed.</p>
                      </div>
                      <History className="text-blue-500" />
                    </div>
                    <div className="flex justify-between items-center p-4">
                      <div>
                        <h4 className="font-bold text-sm">Growth Persistence</h4>
                        <p className="text-xs text-muted-foreground">Consistency metric moving toward target average price.</p>
                      </div>
                      <Icons.Activity className="text-purple-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Kill Switch Protocols */}
              {activeSection === 'risk' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-3xl font-black tracking-tighter text-red-600 mb-4">Kill Switch & Risk Protocols</h2>
                  <p className="text-muted-foreground">Built-in safety triggers designed to protect your principal capital.</p>
                  <div className="grid gap-4 mt-8">
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                      <h4 className="font-bold text-red-600">Abnormal Dip Detection</h4>
                      <p className="text-xs text-muted-foreground mt-1">Alerts you if a stock falls beyond a statistical "safe zone".</p>
                    </div>
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                      <h4 className="font-bold text-red-600">Cycle Kill Switch</h4>
                      <p className="text-xs text-muted-foreground mt-1">Recommended if net return is significantly negative at the mid-point to prevent "catching a falling knife".</p>
                    </div>
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                      <h4 className="font-bold text-amber-600">Stagnation Alerts</h4>
                      <p className="text-xs text-muted-foreground mt-1">Suggests strategy re-evaluation for assets in a long-term "Neutral Zone".</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </ScrollArea>
        </main>
       
      </div>
    </div>
  );
};

export default Documentation;