import { Cast, TrendingUp, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ChromecastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChromecastModal({ open, onOpenChange }: ChromecastModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[150] rounded-3xl border-primary/20 bg-slate-900 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center text-2xl font-black">
            <Cast className="h-6 w-6 text-primary" />
            Compartir en la TV
          </DialogTitle>
          <DialogDescription className="sr-only">
            Instrucciones para compartir la pantalla en TV
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-6">
          <p className="text-center text-slate-300">
            Para ver el juego en tu televisor, utiliza la función de transmitir (Cast/Screen
            Mirroring) integrada en tu dispositivo:
          </p>

          <div className="grid gap-4">
            <div className="rounded-xl border border-white/5 bg-slate-800/50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-bold">
                <TrendingUp className="h-4 w-4 text-blue-400" /> Dispositivos Android
              </h3>
              <ol className="list-inside list-decimal space-y-1 text-sm text-slate-400">
                <li>Desliza hacia abajo desde la parte superior de la pantalla.</li>
                <li>
                  Toca <strong>Emitir</strong> o <strong>Enviar pantalla</strong>.
                </li>
                <li>Selecciona tu TV o Chromecast en la lista.</li>
              </ol>
            </div>

            <div className="rounded-xl border border-white/5 bg-slate-800/50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-bold">
                <Music className="h-4 w-4 text-pink-400" /> Dispositivos Apple (iOS)
              </h3>
              <ol className="list-inside list-decimal space-y-1 text-sm text-slate-400">
                <li>
                  Abre el <strong>Centro de control</strong>.
                </li>
                <li>
                  Toca el icono de <strong>Duplicar pantalla</strong>.
                </li>
                <li>Selecciona tu Apple TV o televisor compatible.</li>
              </ol>
            </div>
          </div>

          <Button
            className="hover:bg-primary-600 flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/50 bg-primary text-lg font-bold text-white shadow-lg"
            onClick={async () => {
              try {
                if (
                  typeof navigator !== 'undefined' &&
                  'presentation' in navigator &&
                  (navigator as any).presentation?.defaultRequest
                ) {
                  await (navigator as any).presentation.defaultRequest.start();
                } else if (
                  typeof navigator !== 'undefined' &&
                  navigator.mediaDevices &&
                  navigator.mediaDevices.getDisplayMedia
                ) {
                  await navigator.mediaDevices.getDisplayMedia({ video: true });
                } else {
                  throw new Error('No API');
                }
                onOpenChange(false);
              } catch (e) {
                alert(
                  "Tu navegador no soporta el Chromecast directo. Usa el menú 'Compartir/Transmitir' o despliega las opciones de control en iOS/Android."
                );
                onOpenChange(false);
              }
            }}
          >
            <Cast className="h-5 w-5" />
            CONECTAR A LA TV 📺
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
