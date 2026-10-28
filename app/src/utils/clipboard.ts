import { toast } from 'sonner';

/**
 * Copia texto al portapapeles con fallback. `navigator.clipboard` no existe
 * en todos los contextos (http sin TLS, algunos WebViews/PWA instaladas) y
 * si no existe, acceder a `.writeText` lanza una excepción síncrona que
 * antes se quedaba sin capturar — el botón de "copiar" simplemente no hacía
 * nada y no avisaba del fallo.
 */
export async function copyToClipboard(text: string, successMessage = 'Copiado'): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
      return true;
    }
    throw new Error('Clipboard API no disponible');
  } catch {
    // Fallback: textarea oculto + execCommand (funciona en más sitios, incluido http).
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (ok) {
        toast.success(successMessage);
        return true;
      }
      throw new Error('execCommand copy falló');
    } catch {
      // Último recurso: que al menos pueda leerlo y copiarlo a mano.
      toast.error('No se pudo copiar automáticamente', { description: text, duration: 8000 });
      return false;
    }
  }
}

export function copyInviteLink(roomId: string, successMessage = 'Enlace de invitación copiado'): Promise<boolean> {
  const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
  return copyToClipboard(url, successMessage);
}
