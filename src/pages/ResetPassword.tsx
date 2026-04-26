import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';

const passwordSchema = z.string().min(8, 'Mínimo 8 caracteres').max(72);

export default function ResetPassword() {
  const { updatePassword, session } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase coloca os tokens no hash quando o usuário clica no link de recuperação.
    // O onAuthStateChange do AuthContext capta o PASSWORD_RECOVERY/SIGNED_IN automaticamente.
    if (session) setReady(true);
    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('As senhas não conferem');
      return;
    }
    const ok = passwordSchema.safeParse(password);
    if (!ok.success) {
      toast.error(ok.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(ok.data);
      toast.success('Senha atualizada!');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar senha');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-bold">Definir nova senha</h1>
        <p className="mb-6 text-sm text-muted-foreground">Escolha uma senha forte com pelo menos 8 caracteres.</p>

        {!ready ? (
          <div className="text-sm text-muted-foreground">Validando link…</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="pw">Nova senha</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="cf">Confirmar</Label>
              <Input id="cf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Salvando…' : 'Salvar senha'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
