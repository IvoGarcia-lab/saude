'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Clock, Flame, Zap, Lightbulb, Search, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { mockWorkout } from '@/lib/mock-data';
import type { Workout } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function WorkoutsPage() {
  const { profile } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkout = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/generate-workout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            goal: profile?.goal || 'maintain',
            restrictions: profile?.restrictions || [],
            weight: profile?.weight || 70,
            height: profile?.height || 170,
          }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setWorkout(data.data);
        } else {
          throw new Error('Erro na API');
        }
      } catch (err) {
        console.error(err);
        // Fallback to mock data if it fails
        setWorkout(mockWorkout);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [profile?.goal, profile?.restrictions, profile?.weight, profile?.height]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 page-enter">
        <Loader2 size={40} className="text-primary animate-spin" />
        <p className="font-display text-lg font-semibold text-primary">
          A gerar o seu plano de treino personalizado...
        </p>
        <p className="text-on-surface-variant text-sm">
          A IA está a calibrar os exercícios com base nos seus objetivos
        </p>
      </div>
    );
  }

  if (!workout) return null;

  return (
    <div className="px-4 md:px-10 max-w-[1280px] mx-auto py-8 page-enter">
      {/* ---- Header ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-ai-indigo/10 text-ai-indigo text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">
            <Sparkles size={12} />
            Ajuste Inteligente
          </span>
          <h2 className="font-display text-[32px] md:text-[40px] font-bold leading-tight tracking-tight text-primary mb-3">
            {workout.title}
          </h2>
          <p className="text-on-surface-variant text-[15px] leading-6 mb-6">
            {workout.description}
          </p>

          {/* AI Rationale */}
          <div className="bg-white border border-outline-variant/30 rounded-xl p-5 flex gap-3 items-start">
            <Lightbulb size={20} className="text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-secondary text-[13px] font-semibold mb-1">
                Porquê este treino?
              </p>
              <p className="text-on-surface text-[14px] leading-6">
                {workout.aiRationale}
              </p>
            </div>
          </div>
        </div>

        {/* Location suggestion */}
        <div className="relative overflow-hidden rounded-2xl min-h-[240px] bg-gradient-to-br from-primary/70 via-primary-container/60 to-secondary/40 flex flex-col justify-end p-6">
          <p className="text-white/70 text-[11px] font-bold tracking-widest uppercase mb-1">
            Local Sugerido
          </p>
          <p className="text-white font-display text-2xl font-semibold">
            {workout.suggestedLocation}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ---- Exercise List ---- */}
        <div className="md:col-span-2 bg-white border border-outline-variant/30 rounded-xl p-6">
          <h3 className="font-display text-lg font-semibold text-on-surface mb-6 flex items-center gap-2">
            <span className="text-on-surface-variant">☰</span> Plano de Exercícios
          </h3>

          <div className="space-y-6">
            {workout.exercises.map((exercise, index) => (
              <div key={index} className="flex gap-4">
                {/* Number badge */}
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 bg-primary-container text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {index + 1}
                  </div>
                  {index < workout.exercises.length - 1 && (
                    <div className="w-px flex-1 bg-outline-variant/40 mt-2" />
                  )}
                </div>

                {/* Exercise content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-display text-[17px] font-semibold text-on-surface">
                      {exercise.name}
                    </h4>
                    <span className="bg-secondary-container text-on-secondary-container text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {exercise.sets} Séries x {exercise.reps}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-[14px] leading-6 mb-3">
                    {exercise.instruction}
                  </p>
                  <div className="flex gap-2">
                    {exercise.muscleGroups.map((group) => (
                      <span
                        key={group}
                        className="bg-surface-container-high text-on-surface-variant text-[11px] font-semibold px-2.5 py-1 rounded"
                      >
                        {group.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Start Workout CTA */}
          <Link
            href="/workouts/active"
            className="w-full mt-6 bg-primary-container text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/10 text-[15px]"
          >
            <Play size={18} fill="white" />
            Iniciar Treino
          </Link>
        </div>

        {/* ---- Sidebar: Session Summary + Coach Tip ---- */}
        <div className="space-y-4">
          {/* Session Summary */}
          <div className="bg-white border border-outline-variant/30 rounded-xl p-6">
            <h4 className="text-[13px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase mb-4">
              Resumo da Sessão
            </h4>
            <div className="space-y-4">
              {[
                { icon: Clock, label: 'Duração', value: `${workout.duration} min` },
                { icon: Flame, label: 'Calorias Est.', value: `${workout.caloriesEst} kcal`, color: 'text-medical-green' },
                {
                  icon: Zap,
                  label: 'Intensidade',
                  value: workout.intensity === 'moderate' ? 'Moderada' : workout.intensity === 'high' ? 'Alta' : 'Baixa',
                  color: 'text-alert-gold',
                },
              ].map(({ icon: Icon, label, value, color }, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-on-surface-variant" />
                    <span className="text-on-surface text-[14px]">{label}</span>
                  </div>
                  <span className={cn('font-semibold text-[14px]', color || 'text-on-surface')}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Coach Tip */}
          <div className="bg-ai-indigo/5 border border-ai-indigo/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-ai-indigo" />
              <span className="text-ai-indigo text-[13px] font-semibold uppercase tracking-wider">
                Dica do Coach
              </span>
            </div>
            <p className="text-on-surface text-[14px] leading-6 italic">
              {workout.coachTip}
            </p>
          </div>

          {/* Recovery indicator */}
          <div className="bg-white border border-outline-variant/30 rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] font-semibold text-on-surface-variant tracking-wider uppercase">
                Recuperação
              </span>
              <span className="text-medical-green text-sm font-bold">85% Recuperado</span>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full">
              <div className="bg-medical-green h-full rounded-full w-[85%] transition-all duration-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
