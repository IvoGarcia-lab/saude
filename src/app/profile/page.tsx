'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Save, LogOut, Shield, User, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';

const allRestrictions = ['Vegan', 'Lactose', 'Glúten', 'Keto', 'Paleo', 'Frutos do Mar'];

export default function ProfilePage() {
  const { profile, setProfile, isDemo, user: firebaseUser, signOut } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [medication, setMedication] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load profile values on mount/load
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAge(profile.age ? String(profile.age) : '');
      setWeight(profile.weight ? String(profile.weight) : '');
      setHeight(profile.height ? String(profile.height) : '');
      setGoal(profile.goal || 'maintain');
      setSelectedRestrictions(profile.restrictions || []);
      setMedication(profile.medication || '');
    }
  }, [profile]);

  const toggleRestriction = (r: string) => {
    setSelectedRestrictions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const updatedProfile: UserProfile = {
      uid: profile?.uid || firebaseUser?.uid || 'demo-user-001',
      name,
      email: profile?.email || firebaseUser?.email || 'demo@example.com',
      age: Number(age) || 30,
      weight: Number(weight) || 70,
      height: Number(height) || 170,
      goal,
      restrictions: selectedRestrictions,
      medication,
      onboardingComplete: true,
      createdAt: profile?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    try {
      // 1. Save locally in State
      setProfile(updatedProfile);

      // 2. If not demo mode, save to Firebase Firestore
      if (!isDemo && firebaseUser) {
        const { getFirebaseDb } = await import('@/lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        const db = getFirebaseDb();
        await setDoc(doc(db, 'profiles', firebaseUser.uid), {
          ...updatedProfile,
          updatedAt: new Date(),
        }, { merge: true });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao guardar perfil:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="px-4 md:px-10 max-w-2xl mx-auto py-8 page-enter space-y-8">
      {/* ---- Profile Header ---- */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 bg-primary-container/20 rounded-full flex items-center justify-center overflow-hidden">
            <User size={40} className="text-primary-container" />
          </div>
        </div>
        <h2 className="font-display text-2xl font-bold text-on-surface">
          {name || 'O meu Perfil'}
        </h2>
        <p className="text-on-surface-variant text-sm mt-1">
          {isDemo ? '🎯 Sessão de Demonstração' : profile?.email}
        </p>
      </div>

      {/* ---- Edit Form ---- */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Biometrics */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-display text-lg font-semibold text-primary mb-2 flex items-center gap-2">
            Identidade e Biometria
          </h3>

          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-on-surface-variant tracking-wide">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="João Silva"
              required
              className="w-full bg-surface-container-low border-none rounded-xl p-3.5 text-on-surface outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-on-surface-variant tracking-wide">
                Idade
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Anos"
                required
                className="w-full bg-surface-container-low border-none rounded-xl p-3.5 text-on-surface outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-on-surface-variant tracking-wide">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="00.0"
                required
                className="w-full bg-surface-container-low border-none rounded-xl p-3.5 text-on-surface outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-on-surface-variant tracking-wide">
                Altura (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="000"
                required
                className="w-full bg-surface-container-low border-none rounded-xl p-3.5 text-on-surface outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Goal */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-display text-lg font-semibold text-primary mb-2">
            Objetivo de Saúde
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'lose' as const, label: 'Perder Peso' },
              { key: 'maintain' as const, label: 'Manter' },
              { key: 'gain' as const, label: 'Ganhar Massa' },
            ].map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setGoal(g.key)}
                className={cn(
                  'py-3 rounded-xl text-xs font-bold transition-all border active:scale-95',
                  goal === g.key
                    ? 'bg-primary-container text-white border-transparent'
                    : 'bg-transparent border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Restrictions & Medications */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-display text-lg font-semibold text-primary mb-2">
            Restrições e Saúde
          </h3>

          <div className="space-y-3">
            <label className="text-[13px] font-semibold text-on-surface-variant block">
              Restrições Alimentares
            </label>
            <div className="flex flex-wrap gap-2">
              {allRestrictions.map((r) => {
                const active = selectedRestrictions.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRestriction(r)}
                    className={cn(
                      'px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95',
                      active
                        ? 'bg-secondary-container text-on-secondary-container border border-transparent'
                        : 'bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[13px] font-semibold text-on-surface-variant block">
              Medicação Ativa
            </label>
            <textarea
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              placeholder="Ex: Nenhuma, Metformina 500mg..."
              rows={2}
              className="w-full bg-surface-container-low border-none rounded-xl p-3.5 text-on-surface outline-none focus:ring-2 focus:ring-primary transition-shadow resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary-container text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/10 text-[15px]"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : success ? (
              <>
                <Check size={18} />
                Perfil Guardado!
              </>
            ) : (
              <>
                <Save size={18} />
                Guardar Alterações
              </>
            )}
          </button>
        </div>
      </form>

      {/* ---- Danger Zone ---- */}
      <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
        <button
          onClick={handleSignOut}
          className="w-full text-center text-secondary font-semibold py-3 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors"
        >
          Terminar Sessão
        </button>
      </div>
    </div>
  );
}
