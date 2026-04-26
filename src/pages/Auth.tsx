import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';

const emailSchema = z.string().trim().email('Email inválido').max(255);
const passwordSchema = z.string().min(8, 'Mínimo 8 caracteres').max(72);
const displayNameSchema = z.string().trim().min(1, 'Informe um nome').max(80);

export default function Auth() {
  const { session, loading, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const emailOk = emailSchema.safeParse(email);
      const pwOk = passwordSchema.safeParse(password);
      if (!emailOk.success) throw new Error(emailOk.error.issues[0].message);
      if (!pwOk.success) throw new Error(pwOk.error.issues[0].message);

      if (mode === 'signup') {
        const nameOk = displayNameSchema.safeParse(displayName);
        if (!nameOk.success) throw new Error(nameOk.error.issues[0].message);
        await signUp(emailOk.data, pwOk.data, nameOk.data);
        toast.success('Conta criada! Você já está logado.');
      } else {
        await signIn(emailOk.data, pwOk.data);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    const emailOk = emailSchema.safeParse(email);
    if (!emailOk.success) {
      toast.error('Informe seu email no campo acima primeiro');
      return;
    }
    try {
      await resetPassword(emailOk.data);
      toast.success('Email de recuperação enviado.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar email');
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro com Google');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">
          <span className="text-primary">N</span>EXO
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">Seu calendário unificado.</p>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'signin' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <TabsContent value="signup" className="space-y-3 mt-0">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" />
              </div>
            </TabsContent>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </Button>

            {mode === 'signin' && (
              <button type="button" onClick={handleForgot} className="block w-full text-center text-xs text-muted-foreground hover:text-primary">
                Esqueci minha senha
              </button>
            )}
          </form>
        </Tabs>

        <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 border-t border-border" />
          ou
          <div className="flex-1 border-t border-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogle}>
          Continuar com Google
        </Button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Voltar</Link>
        </p>
      </div>
    </div>
  );
}
