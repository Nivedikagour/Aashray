import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [
    { title: 'Sign in · SpaceCraft AI' },
    { name: 'description', content: 'Sign in to save climate-aware interior suggestions for your home.' },
    { property: 'og:title', content: 'Sign in · SpaceCraft AI' },
    { property: 'og:description', content: 'Save your projects and climate-aware design advice.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg('');
    if (mode === 'up') {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      setMsg(error ? error.message : 'Check your email to confirm your account, then sign in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message); else navigate({ to: '/' });
    }
    setBusy(false);
  };
  const google = async () => {
    const r = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (r.error) { setMsg(r.error.message); return; }
    if (r.redirected) return;
    navigate({ to: '/' });
  };

  return <div className="flex min-h-screen items-center justify-center bg-background p-5">
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-7 shadow-lg">
      <div className="mb-6 flex items-center gap-2"><Box className="text-primary" /><span className="font-display text-lg font-extrabold">spacecraft <span className="text-xs text-primary">AI</span></span></div>
      <h1 className="text-xl font-semibold">{mode === 'in' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="mt-1 text-xs text-muted-foreground">Save climate-aware suggestions for your home.</p>
      <Button variant="outline" className="mt-5 w-full" onClick={google}>Continue with Google</Button>
      <div className="my-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground">or</div>
      <form onSubmit={submit} className="space-y-3">
        <input className="form-field" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="form-field" type="password" required minLength={6} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <Button className="w-full" disabled={busy}>{mode === 'in' ? 'Sign in' : 'Sign up'}</Button>
      </form>
      {msg && <p className="mt-3 text-xs text-muted-foreground">{msg}</p>}
      <Button variant="ghost" className="mt-3 w-full text-xs" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}</Button>
    </div>
  </div>;
}
