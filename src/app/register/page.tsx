'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { signUp, signInWithGoogle, isDemo } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As passwords não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 800));
        router.push('/onboarding');
        return;
      }
      await signUp(email, password);
      router.push('/onboarding');
    } catch {
      setError('Erro ao criar conta. O email já pode estar em utilização.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 800));
        router.push('/onboarding');
        return;
      }
      await signInWithGoogle();
      router.push('/onboarding');
    } catch {
      setError('Erro ao iniciar sessão com Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-10 bg-surface relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-gradient-to-bl from-primary-container/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-secondary-container/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 page-enter">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <Sparkles size={24} className="text-primary" />
            <span className="font-display text-2xl font-bold text-primary tracking-tight">
              O Meu Coach Inteligente
            </span>
          </div>
          <h2 className="font-display text-[28px] md:text-[32px] font-bold text-on-surface leading-tight mb-2">
            Criar Conta
          </h2>
          <p className="text-on-surface-variant">
            Comece a sua transformação física assistida por IA hoje mesmo.
          </p>
        </div>

        {/* Demo banner */}
        {isDemo && (
          <div className="bg-ai-indigo/5 border border-ai-indigo/10 rounded-xl p-4 mb-6 text-center">
            <p className="text-ai-indigo text-sm font-semibold">
              🎯 Modo Demo — Clique em qualquer botão para avançar
            </p>
          </div>
        )}

        {/* Form Card */}
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-8 ambient-shadow">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-on-surface-variant tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@exemplo.com"
                  required
                  className="w-full bg-surface-container-low border-none rounded-xl pl-11 pr-4 py-3.5 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary outline-none transition-shadow"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-on-surface-variant tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full bg-surface-container-low border-none rounded-xl pl-11 pr-12 py-3.5 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary outline-none transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-on-surface-variant tracking-wide">
                Confirmar Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a password"
                  required
                  className="w-full bg-surface-container-low border-none rounded-xl pl-11 pr-12 py-3.5 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary outline-none transition-shadow"
                />
              </div>
            </div>

            {error && (
              <p className="text-error text-sm font-medium bg-error-container/30 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container text-white py-3.5 rounded-xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  Criar Conta
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-outline-variant/40" />
            <span className="text-[11px] font-semibold text-on-surface-variant tracking-widest uppercase">
              ou
            </span>
            <div className="flex-1 h-px bg-outline-variant/40" />
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border-2 border-outline-variant/40 py-3.5 rounded-xl font-semibold text-[15px] text-on-surface hover:bg-surface-container-low active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Registar com Google
          </button>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-on-surface-variant text-sm">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Iniciar Sessão
          </Link>
        </p>
      </div>
    </div>
  );
}
