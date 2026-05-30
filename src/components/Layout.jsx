import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, Users, ScanLine, AlertTriangle, 
  Upload, Menu, X, BarChart2, FileCheck, Wallet
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/statistics', label: 'Statistiche', icon: BarChart2 },
  { path: '/members', label: 'Iscritti', icon: Users },
  { path: '/turnstile', label: 'Tornello', icon: ScanLine },
  { path: '/accessi', label: 'Accessi', icon: FileCheck },
  { path: '/archivio-pagamenti', label: 'Archivio Pagamenti', icon: Wallet },
  { path: '/expiring', label: 'Scadenze', icon: AlertTriangle },
  { path: '/import', label: 'Importa Dati', icon: Upload },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 h-screen">
        <div className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
              <path d="M6 16h20M10 10l-4 6 4 6M22 10l4 6-4 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="6" cy="16" r="2.5" fill="white"/>
              <circle cx="26" cy="16" r="2.5" fill="white"/>
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold tracking-widest uppercase text-sidebar-foreground/50">ASD</p>
            <h1 className="font-extrabold text-sm text-sidebar-primary-foreground leading-none tracking-tight">Kinesis <span className="text-sidebar-primary">JuJitsu</span></h1>
            <p className="text-[9px] font-medium text-sidebar-foreground/70 tracking-wider uppercase">Academy</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20' 
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground text-xs"
            onClick={() => base44.auth.logout()}
          >
            Disconnetti
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
                <path d="M6 16h20M10 10l-4 6 4 6M22 10l4 6-4 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6" cy="16" r="2.5" fill="white"/>
                <circle cx="26" cy="16" r="2.5" fill="white"/>
              </svg>
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-sm text-foreground">Kineis</span>
              <span className="text-[10px] text-muted-foreground ml-1">Jujitsu Academy</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden bg-card border-b border-border px-4 pb-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}