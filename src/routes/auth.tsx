import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { AlertCircle, Box, CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getSystemConfigStatus, sendSignupConfirmationWithResend } from '@/lib/auth.functions';

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Sign in · Aashray AI' },
      { name: 'description', content: 'Sign in to access AI-powered interior design, 3D floor plans, and construction intelligence.' },
      { property: 'og:title', content: 'Sign in · Aashray AI' },
      { property: 'og:description', content: 'Save your projects and smart budget plans.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const sendResendEmail = useServerFn(sendSignupConfirmationWithResend);
  const getStatus = useServerFn(getStatusStatus);

  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendActive, setResendActive] = useState<boolean | null>(null);

  useEffect(() => {
    getStatus()
      .then((st) => setResendActive(st.resendConfigured))
      .catch(() => setResendActive(false));
  }, [getStatus]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    if (mode === 'up') {
      try {
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });

        let isEmailSendIssue = false;
        if (signUpErr) {
          const errLower = signUpErr.message.toLowerCase();
          if (errLower.includes('email') || errLower.includes('rate limit') || errLower.includes('smtp')) {
            isEmailSendIssue = true;
            console.warn('[Supabase Auth] Supabase email delivery failed, falling back directly to Resend API:', signUpErr.message);
          } else {
            setMsg({ text: signUpErr.message, type: 'error' });
            setBusy(false);
            return;
          }
        }

        // Dispatch confirmation email directly via Resend API
        try {
          const resendResult = await sendResendEmail({
            data: {
              email,
              password,
              confirmationUrl: window.location.origin,
            },
          });

          setEmailSent(true);
          if (resendResult.sent) {
            setMsg({
              text: 'Confirmation email dispatched directly via Resend API! Check your inbox to verify your account.',
              type: 'success',
            });
          } else {
            setMsg({
              text: isEmailSendIssue
                ? 'Account created! Please add your RESEND_API_KEY to .env to receive confirmation emails directly.'
                : 'Account created! Please check your email to confirm your account, then sign in.',
              type: 'info',
            });
          }
        } catch (resendError) {
          setEmailSent(true);
          setMsg({
            text: 'Account registered. Please check your inbox or sign in.',
            type: 'info',
          });
        }
      } catch (err) {
        setMsg({
          text: err instanceof Error ? err.message : 'Sign up failed.',
          type: 'error',
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMsg({ text: error.message, type: 'error' });
      } else {
        navigate({ to: '/' });
      }
    }
    setBusy(false);
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const res = await sendResendEmail({
        data: {
          email,
          password,
          confirmationUrl: window.location.origin,
        },
      });
      if (res.sent) {
        setMsg({ text: 'A new confirmation email has been dispatched via Resend API!', type: 'success' });
      } else {
        setMsg({ text: res.message || 'Could not resend email at this time.', type: 'info' });
      }
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : 'Resend failed.', type: 'error' });
    }
    setResending(false);
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setMsg({ text: error.message, type: 'error' });
      return;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-7 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="text-primary" />
            <span className="font-display text-lg font-extrabold tracking-tight">
              aashray <span className="text-xs font-semibold text-primary">AI</span>
            </span>
          </div>
          {resendActive && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-0.5 text-[10px] font-semibold text-primary"
              title="Resend API email confirmation active"
            >
              <Mail size={11} /> Resend
            </span>
          )}
        </div>

        <h1 className="text-xl font-semibold">
          {mode === 'in' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === 'in'
            ? 'Sign in to access your design projects & budget recommendations.'
            : 'Join to get AI-driven budget allocations & interior suggestions.'}
        </p>

        <Button variant="outline" className="mt-5 w-full" onClick={google}>
          Continue with Google
        </Button>

        <div className="my-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          or continue with email
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Email address
            </label>
            <input
              className="form-field w-full"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Password
            </label>
            <input
              className="form-field w-full"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button className="w-full" disabled={busy}>
            {busy
              ? mode === 'in'
                ? 'Signing in…'
                : 'Sending verification…'
              : mode === 'in'
                ? 'Sign in'
                : 'Sign up & send confirmation'}
          </Button>
        </form>

        {msg && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-xs ${
              msg.type === 'success'
                ? 'border border-primary/20 bg-sage-soft text-primary'
                : msg.type === 'error'
                  ? 'border border-destructive/20 bg-destructive/10 text-destructive'
                  : 'border border-border bg-muted/50 text-muted-foreground'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
            )}
            <div className="flex-1 leading-relaxed">{msg.text}</div>
          </div>
        )}

        {emailSent && mode === 'up' && (
          <div className="mt-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              disabled={resending}
              onClick={handleResend}
            >
              <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
              Didn't receive email? Resend via Resend
            </Button>
          </div>
        )}

        <Button
          variant="ghost"
          className="mt-3 w-full text-xs"
          onClick={() => {
            setMode(mode === 'in' ? 'up' : 'in');
            setMsg(null);
            setEmailSent(false);
          }}
        >
          {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </Button>
      </div>
    </div>
  );
}

// Helper wrapper to safely call getSystemConfigStatus
const getStatusStatus = getSystemConfigStatus;
