import { useState, useEffect, type ReactNode } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet, Banknote, Calendar, PieChart, Settings, Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Pages
import Dashboard from './pages/Dashboard';
import Income from './pages/Income.tsx';
import Events from './pages/Events.tsx';
import EventDetail from './pages/EventDetail';
import Reports from './pages/Reports.tsx';
import SettingsPage from './pages/Settings.tsx';
import AddRecordModal from './components/AddRecordModal';

function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const navItems = [
    { path: '/', label: t('expenses'), icon: Wallet },
    { path: '/income', label: t('income'), icon: Banknote },
    { path: '/events', label: t('events'), icon: Calendar },
    { path: '/reports', label: t('reports'), icon: PieChart },
    { path: '/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full flex-col bg-background md:flex-row">
      {/* Sidebar for desktop */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="p-6 text-2xl font-bold text-primary">{t('app_title')}</div>
        <nav className="flex-1 space-y-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4">
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={20} />
            {t('add_record')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="container mx-auto max-w-4xl p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Nav for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-card pb-safe pt-2 md:hidden">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-h-[44px] px-4 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon size={24} />
              {item.label}
            </Link>
          );
        })}
        <Link
          to="/settings"
          className={cn(
            "flex flex-col items-center justify-center gap-1 min-h-[44px] px-4 text-xs",
            location.pathname === '/settings' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Settings size={24} />
          {t('settings')}
        </Link>
      </nav>

      {/* Floating Action Button for mobile */}
      <button
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
      >
        <Plus size={28} />
      </button>

      {isAddOpen && <AddRecordModal onClose={() => setIsAddOpen(false)} />}
    </div>
  );
}

function App() {
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = i18n.language === 'zh' ? 'zh-CN' : 'en';
  }, [i18n.language]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let pluginHandle: Awaited<ReturnType<typeof CapacitorApp.addListener>> | undefined;

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    }).then(h => { pluginHandle = h; });

    return () => { pluginHandle?.remove(); };
  }, []);

  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/income" element={<Income />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage theme={theme} setTheme={setTheme} />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}

export default App;
