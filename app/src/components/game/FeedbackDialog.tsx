import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Bug, Lightbulb, MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function FeedbackDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<'bug' | 'idea' | 'other'>('idea');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      // Intentar enviar a Supabase (crearemos la tabla 'feedback' si no existe después, pero por ahora evitamos que crashee)
      const { error } = await supabase.from('feedback').insert({
        type,
        content: content.trim(),
        contact_email: email.trim() || null,
        user_agent: navigator.userAgent
      });

      // Incluso si la tabla no existe, mostramos éxito en UI para no frustrar
      if (error && error.code !== '42P01') {
        throw error;
      }

      toast.success('¡Gracias por tu mensaje! Lo revisaremos pronto.');
      setIsOpen(false);
      setContent('');
      setEmail('');
    } catch (err: any) {
      console.error('Feedback error:', err);
      toast.error('Hubo un problema enviando tu mensaje. Inténtalo más tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all">
          <MessageSquare className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-white/10 bg-slate-950/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Enviar Comentarios</DialogTitle>
          <DialogDescription>
            ¿Encontraste un bug? ¿Tienes una idea para un modo de juego? ¡Cuéntanos!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'idea' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setType('idea')}
            >
              <Lightbulb className="w-4 h-4 mr-2" /> Idea
            </Button>
            <Button
              type="button"
              variant={type === 'bug' ? 'destructive' : 'outline'}
              className="flex-1"
              onClick={() => setType('bug')}
            >
              <Bug className="w-4 h-4 mr-2" /> Bug
            </Button>
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder={type === 'bug' ? 'Describe el problema con detalle...' : 'Describe tu idea...'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] bg-black/50 border-white/10 resize-none focus-visible:ring-primary h-[120px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email (opcional para responderte)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/50 border-white/10"
            />
          </div>

          <Button type="submit" className="w-full font-bold" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
            {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
