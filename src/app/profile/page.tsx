'use client';

import { Sparkles, ChevronRight, LogOut, Trash2, Link, Shield, User } from 'lucide-react';
import { mockUser, mockCoachInsights } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const user = mockUser;
  const insight = mockCoachInsights[1];

  return (
    <div className="px-4 md:px-10 max-w-2xl mx-auto py-8 page-enter space-y-8">
      {/* ---- Profile Header ---- */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 bg-primary-container/20 rounded-full flex items-center justify-center overflow-hidden">
            <User size={40} className="text-primary-container" />
          </div>
          <button className="absolute bottom-0 right-0 bg-primary-container text-white p-1.5 rounded-full hover:opacity-90 transition-opacity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
        </div>
        <h2 className="font-display text-xl font-semibold text-on-surface">{user.name}</h2>
        <div className="flex gap-2 mt-2">
          <span className="bg-secondary-container/30 text-on-secondary-container text-xs font-semibold px-3 py-1 rounded-full">
            Peso: {user.weight}kg
          </span>
          <span className="bg-secondary-container/30 text-on-secondary-container text-xs font-semibold px-3 py-1 rounded-full">
            Altura: {user.height}cm
          </span>
        </div>
      </div>

      {/* ---- Coach Insight ---- */}
      <div className="bg-ai-indigo/5 border border-ai-indigo/10 rounded-xl p-4 flex gap-3 items-start">
        <Sparkles size={18} className="text-ai-indigo shrink-0 mt-0.5" fill="currentColor" />
        <p className="text-on-surface text-[14px] leading-6">
          <span className="text-ai-indigo font-semibold">Coach Insight:</span> {insight.message}
        </p>
      </div>

      {/* ---- Biometric Data ---- */}
      <section>
        <h3 className="font-display text-lg font-semibold text-on-surface mb-4">
          Dados Biométricos e Clínicos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-xs font-semibold">Idade</p>
              <p className="text-on-surface font-semibold">{user.age} anos</p>
            </div>
            <ChevronRight size={18} className="text-outline-variant" />
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-on-surface-variant text-xs font-semibold mb-2">
              Restrições Alimentares
            </p>
            <div className="flex flex-wrap gap-2">
              {user.restrictions.map((r) => (
                <span
                  key={r}
                  className="bg-secondary-container text-on-secondary-container text-xs font-semibold px-3 py-1 rounded-full"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 bg-surface-container-low rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-xs font-semibold">Medicação Ativa</p>
              <p className="text-on-surface">{user.medication || 'Nenhuma registada'}</p>
            </div>
            <button className="text-secondary text-sm font-semibold">+ Adicionar</button>
          </div>
        </div>
      </section>

      {/* ---- Health Goal ---- */}
      <section>
        <h3 className="font-display text-lg font-semibold text-on-surface mb-4">
          Objetivo de Saúde
        </h3>
        <div className="bg-surface-container-low rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-container text-white p-2.5 rounded-full">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-on-surface">
                {user.goal === 'gain'
                  ? 'Ganho de Massa Magra'
                  : user.goal === 'lose'
                  ? 'Perda de Gordura'
                  : 'Manutenção de Peso'}
              </p>
              <p className="text-on-surface-variant text-sm">
                Meta: +3kg de músculo em 3 meses
              </p>
            </div>
          </div>
          <button className="bg-secondary-container text-on-secondary-container text-xs font-bold px-4 py-2 rounded-full">
            Alterar
          </button>
        </div>
      </section>

      {/* ---- Preferences ---- */}
      <section>
        <h3 className="font-display text-lg font-semibold text-on-surface mb-4">
          Preferências
        </h3>
        <div className="bg-white border border-outline-variant/20 rounded-xl overflow-hidden divide-y divide-surface-container">
          <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3">
              <Link size={18} className="text-on-surface-variant" />
              <span className="text-on-surface text-[15px]">
                Sincronização de Dispositivos
              </span>
            </div>
            <span className="text-secondary text-sm font-semibold">
              Conectado (Apple Health)
            </span>
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-on-surface-variant" />
              <span className="text-on-surface text-[15px]">Privacidade e Dados</span>
            </div>
            <ChevronRight size={18} className="text-outline-variant" />
          </button>
        </div>
      </section>

      {/* ---- Danger Zone ---- */}
      <div className="space-y-3 pt-4">
        <button className="w-full text-center text-secondary font-semibold py-3 hover:underline transition-colors">
          Terminar Sessão
        </button>
        <button className="w-full text-center text-error/60 text-sm font-semibold py-2 hover:text-error transition-colors">
          Apagar Conta Permanentemente
        </button>
      </div>
    </div>
  );
}
