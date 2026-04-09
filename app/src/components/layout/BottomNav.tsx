import { Home, Users, Plus, History, Settings, Trophy, Gamepad2, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type AppTab = 'inicio' | 'perfiles' | 'jugar' | 'historial' | 'ajustes' | 'arcade' | 'hall';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

// Primary tabs always visible
const primaryTabs = [
  { id: 'inicio' as const, label: 'Inicio', icon: Home },
  { id: 'perfiles' as const, label: 'Ranking', icon: Users },
  { id: 'jugar' as const, label: 'Jugar', icon: Plus, isPrimary: true },
  { id: 'arcade' as const, label: 'Arcade', icon: Gamepad2 },
  { id: 'hall' as const, label: 'Hall', icon: Trophy },
];

// Secondary tabs in "more" menu
const secondaryTabs = [
  { id: 'historial' as const, label: 'Partidas', icon: History },
  { id: 'ajustes' as const, label: 'Ajustes', icon: Settings },
];

const allSecondaryIds: AppTab[] = secondaryTabs.map(t => t.id);

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const [showMore, setShowMore] = useState(false);
  const isSecondaryActive = allSecondaryIds.includes(activeTab);

  const handleTabChange = (tab: AppTab) => {
    onTabChange(tab);
    setShowMore(false);
  };

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      {/* More menu popup */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-24 right-4 z-50 rounded-[24px] border border-white/10 bg-[hsl(var(--card)/0.98)] backdrop-blur-2xl shadow-2xl p-2 min-w-[160px]"
          >
            {secondaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive && 'text-[hsl(var(--accent))]')} />
                  <span className="font-arcade text-[11px] uppercase tracking-widest font-black">{tab.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed inset-x-0 bottom-3 z-50 px-3 md:px-4" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,hsl(var(--card)/0.96),hsl(var(--card)/0.88))] p-2 shadow-[0_30px_80px_-38px_rgba(0,0,0,0.98)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-1">
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2.5 px-1 text-sm font-semibold transition-all duration-200 min-w-0',
                    tab.isPrimary
                      ? isActive
                        ? 'bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-white shadow-[0_18px_35px_-18px_hsl(var(--primary)/0.95)]'
                        : 'bg-white/[0.05] text-foreground hover:bg-white/[0.08]'
                      : isActive
                        ? 'bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.22)]'
                        : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
                  )}
                >
                  <div className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-xl transition-all',
                    tab.isPrimary && isActive ? 'bg-white/15' : isActive ? 'bg-white/[0.06]' : 'bg-transparent'
                  )}>
                    <Icon className={cn('h-[18px] w-[18px]', isActive && !tab.isPrimary && 'text-[hsl(var(--accent))]')} />
                  </div>
                  <span className={cn(
                    'text-[9px] font-arcade uppercase font-black tracking-widest truncate w-full text-center leading-none',
                    isActive ? 'opacity-100' : 'opacity-50'
                  )}>
                    {tab.label}
                  </span>
                  {isActive && !tab.isPrimary && (
                    <motion.span
                      layoutId="bottom-nav-active"
                      className="absolute inset-0 -z-10 rounded-2xl bg-white/5 border border-white/10"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                </motion.button>
              );
            })}

            {/* More button */}
            <motion.button
              onClick={() => setShowMore(v => !v)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2.5 px-1 transition-all duration-200 min-w-0',
                (showMore || isSecondaryActive)
                  ? 'bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.22)]'
                  : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
              )}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-xl">
                <MoreHorizontal className={cn('h-[18px] w-[18px]', (showMore || isSecondaryActive) && 'text-[hsl(var(--accent))]')} />
              </div>
              <span className={cn(
                'text-[9px] font-arcade uppercase font-black tracking-widest truncate w-full text-center leading-none',
                (showMore || isSecondaryActive) ? 'opacity-100' : 'opacity-50'
              )}>
                Más
              </span>
              {isSecondaryActive && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 -z-10 rounded-2xl bg-white/5 border border-white/10"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
            </motion.button>
          </div>
        </div>
      </nav>
    </>
  );
}
