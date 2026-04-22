import { Home, Users, Plus, History, Settings, Trophy, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: 'inicio' | 'perfiles' | 'jugar' | 'historial' | 'ajustes' | 'arcade' | 'hall';
  onTabChange: (tab: 'inicio' | 'perfiles' | 'jugar' | 'historial' | 'ajustes' | 'arcade' | 'hall') => void;
}

const tabs = [
  { id: 'inicio' as const, label: 'Inicio', icon: Home },
  { id: 'perfiles' as const, label: 'Ranking', icon: Users },
  { id: 'jugar' as const, label: 'Jugar', icon: Plus, isPrimary: true },
  { id: 'historial' as const, label: 'Partidas', icon: History },
  { id: 'hall' as const, label: 'Hall', icon: Trophy },
  { id: 'arcade' as const, label: 'Arcade', icon: Gamepad2 },
  { id: 'ajustes' as const, label: 'Ajustes', icon: Settings },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-3 z-50 px-3 md:px-4" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
      <div className="mx-auto max-w-5xl rounded-[32px] border border-white/[0.07] p-2 shadow-[0_30px_80px_-38px_rgba(0,0,0,0.98)]"
        style={{
          background: 'linear-gradient(180deg, rgba(20,15,40,0.96), rgba(10,8,20,0.92))',
          backdropFilter: 'blur(32px) saturate(180%)',
        }}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileTap={{ scale: 0.93 }}
                className={cn(
                  'relative flex min-w-fit shrink-0 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition-all duration-200',
                  tab.isPrimary
                    ? isActive
                      ? 'bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-white shadow-[0_18px_35px_-18px_hsl(var(--primary)/0.95)]'
                      : 'bg-white/[0.05] text-foreground hover:bg-white/[0.08]'
                    : isActive
                      ? 'text-white'
                      : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
                  isActive ? 'px-4' : 'px-3'
                )}
              >
                <motion.div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
                    tab.isPrimary && isActive
                      ? 'bg-white/15'
                      : isActive
                        ? 'bg-white/[0.08]'
                        : 'bg-transparent'
                  )}
                  animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <Icon className={cn('h-[18px] w-[18px]', isActive && !tab.isPrimary && 'text-[hsl(var(--accent))]')} />
                </motion.div>
                <span className={cn(
                  'whitespace-nowrap text-[12px] font-arcade uppercase font-black tracking-widest',
                  isActive ? 'inline' : 'hidden sm:inline'
                )}>
                  {tab.label}
                </span>

                {/* Active indicator — glowing dot + background pill */}
                {isActive && !tab.isPrimary && (
                  <>
                    <motion.span
                      layoutId="bottom-nav-active"
                      className="absolute inset-0 -z-10 rounded-2xl border border-white/[0.08]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        boxShadow: '0 0 24px rgba(255,255,255,0.04)',
                      }}
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                    <motion.span
                      layoutId="bottom-nav-dot"
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{
                        background: 'hsl(var(--accent))',
                        boxShadow: '0 0 8px hsl(var(--accent) / 0.8)',
                      }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
