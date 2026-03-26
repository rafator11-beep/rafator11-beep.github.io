import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Vibrate,
  Sparkles,
  Palette,
  Info,
  ChevronRight,
  Timer,
  Zap,
  Trophy,
  RotateCcw,
  Smartphone,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings } from '@/types/game';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SETTINGS_KEY = 'fiesta-party-settings';

interface ExtendedSettings extends Settings {
  timerDuration: number;
  autoNextTurn: boolean;
  showHints: boolean;
  darkMode: boolean;
  reducedAnimations: boolean;
}

const defaultSettings: ExtendedSettings = {
  confettiEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  intensity: 'medium',
  timerDuration: 30,
  autoNextTurn: false,
  showHints: true,
  darkMode: true,
  reducedAnimations: false,
};

function SettingRow({
  icon: Icon,
  title,
  subtitle,
  checked,
  onChange,
}: {
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <Icon className="h-4.5 w-4.5 text-[hsl(var(--accent))]" />
        </div>
        <div className="min-w-0">
          <Label className="text-sm font-semibold text-white">{title}</Label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-stat">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

export function AppSettings() {
  const [settings, setSettings] = useState<ExtendedSettings>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {
        console.error('Error parsing settings');
      }
    }
  }, []);

  const updateSetting = <K extends keyof ExtendedSettings>(key: K, value: ExtendedSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    toast.success('Ajustes restaurados');
  };

  const intensityLabel = settings.intensity === 'low' ? 'Tranquila' : settings.intensity === 'medium' ? 'Normal' : 'Locura';
  const enabledCount = [settings.confettiEnabled, settings.soundEnabled, settings.vibrationEnabled, settings.showHints].filter(Boolean).length;

  return (
    <div className="premium-screen min-h-screen px-4 pb-28 pt-5 md:px-6 md:pb-32 md:pt-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-panel overflow-hidden rounded-[34px] p-4 sm:p-5 md:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <span className="premium-chip text-white/80">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                experiencia premium
              </span>
              <h1 className="premium-title mt-4 text-3xl font-black leading-tight sm:text-4xl md:text-[2.8rem]">
                Ajustes claros, visuales y pensados para móvil.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                He reorganizado esta zona para que los controles importantes se entiendan de un vistazo: efectos, ritmo de juego, confort visual y configuración general.
              </p>
            </div>
            <div className="premium-panel-soft min-w-[220px] rounded-[28px] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Resumen</p>
              <div className="mt-3 space-y-2 text-sm text-white/90">
                <p>Perfil visual: <span className="font-semibold">Premium oscuro</span></p>
                <p>Intensidad: <span className="font-semibold">{intensityLabel}</span></p>
                <p>Preferencias activas: <span className="font-semibold">{enabledCount}/4</span></p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <HeroStat label="Temporizador" value={`${settings.timerDuration}s`} />
            <HeroStat label="Animaciones" value={settings.reducedAnimations ? 'Reducidas' : 'Normales'} />
            <HeroStat label="Modo fiesta" value={intensityLabel} />
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-panel-soft rounded-[30px] p-5 sm:p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Sparkles className="h-5 w-5 text-[hsl(var(--neon-yellow))]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Visual y sonido</p>
                    <h2 className="text-xl font-bold text-white">Sensación de juego</h2>
                  </div>
                </div>
                <div className="space-y-3">
                  <SettingRow
                    icon={Sparkles}
                    title="Confeti en aciertos"
                    subtitle="Destaca los momentos ganadores y da más impacto al tablero."
                    checked={settings.confettiEnabled}
                    onChange={(v) => updateSetting('confettiEnabled', v)}
                  />
                  <SettingRow
                    icon={settings.soundEnabled ? Volume2 : VolumeX}
                    title="Efectos de sonido"
                    subtitle="Mantiene la respuesta sonora en botones, premios y acciones."
                    checked={settings.soundEnabled}
                    onChange={(v) => updateSetting('soundEnabled', v)}
                  />
                  <SettingRow
                    icon={Vibrate}
                    title="Vibración"
                    subtitle="Mejora la respuesta táctil en móvil durante la partida."
                    checked={settings.vibrationEnabled}
                    onChange={(v) => updateSetting('vibrationEnabled', v)}
                  />
                  <SettingRow
                    icon={Zap}
                    title="Animaciones reducidas"
                    subtitle="Suaviza transiciones para una experiencia más ligera."
                    checked={settings.reducedAnimations}
                    onChange={(v) => updateSetting('reducedAnimations', v)}
                  />
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                className="premium-panel-soft rounded-[30px] p-5 sm:p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10">
                    <Timer className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Ritmo de juego</p>
                    <h2 className="text-xl font-bold text-white">Tiempo y ayudas</h2>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <Label className="text-sm font-semibold text-white">Tiempo por pregunta</Label>
                      <p className="mt-1 text-xs text-muted-foreground">Ajusta el ritmo para partidas rápidas o más relajadas.</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">{settings.timerDuration}s</span>
                  </div>
                  <Slider
                    value={[settings.timerDuration]}
                    onValueChange={([v]) => updateSetting('timerDuration', v)}
                    min={10}
                    max={60}
                    step={5}
                    className="w-full"
                  />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>10s</span>
                    <span>60s</span>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  <SettingRow
                    icon={Trophy}
                    title="Mostrar pistas"
                    subtitle="Da apoyo visual cuando el modo de juego lo permite."
                    checked={settings.showHints}
                    onChange={(v) => updateSetting('showHints', v)}
                  />
                  <SettingRow
                    icon={RotateCcw}
                    title="Turno automático"
                    subtitle="Pasa al siguiente jugador sin tener que confirmarlo siempre."
                    checked={settings.autoNextTurn}
                    onChange={(v) => updateSetting('autoNextTurn', v)}
                  />
                </div>
              </motion.section>
            </div>

            <div className="space-y-5">
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="premium-panel-soft rounded-[30px] p-5 sm:p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-400/10">
                    <Palette className="h-5 w-5 text-fuchsia-300" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Intensidad</p>
                    <h2 className="text-xl font-bold text-white">Energía de la partida</h2>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Label className="text-sm font-semibold text-white">Nivel de fiesta</Label>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">{intensityLabel}</span>
                  </div>
                  <div className="mb-3 flex justify-between text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    <span>Tranquila</span>
                    <span>Normal</span>
                    <span>Locura</span>
                  </div>
                  <Slider
                    value={[settings.intensity === 'low' ? 0 : settings.intensity === 'medium' ? 50 : 100]}
                    onValueChange={([v]) => {
                      const intensity = v < 33 ? 'low' : v < 66 ? 'medium' : 'high';
                      updateSetting('intensity', intensity);
                    }}
                    max={100}
                    step={50}
                    className="w-full"
                  />
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="premium-panel-soft rounded-[30px] p-5 sm:p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10">
                    <Smartphone className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Móvil y confort</p>
                    <h2 className="text-xl font-bold text-white">Lectura y control</h2>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    ['Diseño oscuro premium', 'Contraste alto y mejor legibilidad en cualquier ambiente.'],
                    ['Toggles más claros', 'Los interruptores están más separados y se tocan mejor en móvil.'],
                    ['Bloques más limpios', 'Menos ruido visual y mejor jerarquía entre grupos.'],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="premium-panel-soft rounded-[30px] p-5 sm:p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Info className="h-5 w-5 text-[hsl(var(--accent))]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Sobre la app</p>
                    <h2 className="text-xl font-bold text-white">Ficha general</h2>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    ['Versión', '2.0.0 Premium'],
                    ['Pruebas disponibles', '19.000+'],
                    ['Modos de juego', '10'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm">
                      <span className="text-white/90">{label}</span>
                      <span className="font-semibold text-white">{value}</span>
                    </div>
                  ))}
                  {['Política de privacidad', 'Términos y condiciones'].map((label) => (
                    <div key={label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/90">
                      <span>{label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </motion.section>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-[hsl(var(--accent))]" />
              Ajustes guardados automáticamente en este dispositivo.
            </div>
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-5 text-white hover:bg-white/[0.08]"
              onClick={resetSettings}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar ajustes por defecto
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
