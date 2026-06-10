'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pause, Play, SkipForward, CheckCircle2, Volume2, Lightbulb } from 'lucide-react';
import { mockWorkout, mockUser } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function ActiveWorkoutPage() {
  const workout = mockWorkout;
  const user = mockUser;

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(42);
  const [isRunning, setIsRunning] = useState(true);
  const [completed, setCompleted] = useState(false);

  const currentExercise = workout.exercises[currentExerciseIndex];
  const nextExercise = workout.exercises[currentExerciseIndex + 1];
  const totalExercises = workout.exercises.length;
  const progressPercent = Math.round(((currentExerciseIndex) / totalExercises) * 100);

  // Timer
  useEffect(() => {
    if (!isRunning || completed) return;
    const interval = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, completed, currentExerciseIndex]);

  const handleNext = useCallback(() => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex((i) => i + 1);
      setTimeRemaining(45);
      setIsRunning(true);
    } else {
      setCompleted(true);
    }
  }, [currentExerciseIndex, totalExercises]);

  const togglePause = () => setIsRunning((r) => !r);

  // SVG timer calculations
  const timerSize = 280;
  const timerStroke = 8;
  const timerRadius = (timerSize - timerStroke) / 2;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const maxTime = 45;
  const timerProgress = timerCircumference - (timeRemaining / maxTime) * timerCircumference;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (completed) {
    return (
      <div className="px-4 md:px-10 max-w-[1280px] mx-auto py-16 flex flex-col items-center justify-center text-center page-enter">
        <div className="bg-medical-green/10 p-6 rounded-full mb-6">
          <CheckCircle2 size={48} className="text-medical-green" />
        </div>
        <h2 className="font-display text-3xl font-bold text-on-surface mb-3">
          Treino Concluído! 🎉
        </h2>
        <p className="text-on-surface-variant text-lg max-w-md mb-8">
          Excelente trabalho, {user.name.split(' ')[0]}! Completaste {totalExercises} exercícios em {workout.duration} minutos.
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-sm mb-8">
          {[
            { label: 'Exercícios', value: totalExercises },
            { label: 'Calorias', value: `${workout.caloriesEst}` },
            { label: 'Duração', value: `${workout.duration}m` },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-outline-variant/30 rounded-xl p-4 text-center">
              <p className="font-display text-2xl font-semibold text-primary">{s.value}</p>
              <p className="text-xs text-on-surface-variant font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
        <a
          href="/dashboard"
          className="bg-primary-container text-white px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all"
        >
          Voltar ao Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-10 max-w-[1280px] mx-auto py-4 page-enter">
      {/* ---- Progress Header ---- */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] font-semibold text-on-surface-variant tracking-wide uppercase">
          {user.name.toUpperCase()} • EXERCÍCIO {currentExerciseIndex + 1} DE {totalExercises}
        </p>
        <span className="text-primary text-sm font-bold">{progressPercent}%</span>
      </div>
      <div className="w-full bg-surface-container-highest h-1.5 rounded-full mb-8">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Audio indicator */}
      <div className="flex items-center gap-2 mb-8">
        <button className="bg-white border border-outline-variant/30 rounded-full p-2.5 hover:bg-surface-container-high transition-colors">
          <Volume2 size={18} className="text-on-surface-variant" />
        </button>
        <div className="flex gap-0.5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-medical-green rounded-full"
              style={{
                height: `${12 + Math.random() * 16}px`,
                animation: isRunning ? `timerPulse ${0.5 + i * 0.15}s ease-in-out infinite` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* ---- Main Timer ---- */}
        <div className="md:col-span-2 flex flex-col items-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-on-surface mb-2 text-center">
            {currentExercise.name}
          </h2>
          <p className="text-on-surface-variant mb-8 text-center">
            {currentExercise.instruction}
          </p>

          {/* Circular Timer */}
          <div className={cn('relative mb-8', isRunning && 'timer-pulse')}>
            <svg width={timerSize} height={timerSize} viewBox={`0 0 ${timerSize} ${timerSize}`}>
              <circle
                cx={timerSize / 2}
                cy={timerSize / 2}
                r={timerRadius}
                fill="none"
                stroke="var(--color-surface-container-highest)"
                strokeWidth={timerStroke}
              />
              <circle
                cx={timerSize / 2}
                cy={timerSize / 2}
                r={timerRadius}
                fill="none"
                stroke="var(--color-primary-container)"
                strokeWidth={timerStroke}
                strokeLinecap="round"
                strokeDasharray={timerCircumference}
                strokeDashoffset={timerProgress}
                className="transition-[stroke-dashoffset] duration-1000 linear"
                transform={`rotate(-90 ${timerSize / 2} ${timerSize / 2})`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-5xl font-light text-on-surface tracking-tight">
                {formatTime(timeRemaining)}
              </span>
              <span className="text-[11px] font-semibold text-on-surface-variant tracking-widest uppercase mt-1">
                Segundos Restantes
              </span>
            </div>
          </div>

          {/* Coach Tip */}
          <div className="bg-white border border-outline-variant/30 rounded-xl p-4 flex gap-3 items-start max-w-lg w-full mb-8">
            <div className="bg-ai-indigo/10 p-2 rounded-full shrink-0">
              <Lightbulb size={16} className="text-ai-indigo" />
            </div>
            <div>
              <p className="text-ai-indigo text-[11px] font-bold tracking-wider uppercase mb-1">
                Dica do Coach
              </p>
              <p className="text-on-surface text-[14px] leading-6">
                A tua frequência cardíaca está estável. Podes aumentar ligeiramente a velocidade para otimizar a queima calórica.
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={togglePause}
              className="bg-white border-2 border-outline-variant/30 text-on-surface px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-surface-container-high active:scale-95 transition-all"
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? 'Pausa' : 'Retomar'}
            </button>
            <button
              onClick={handleNext}
              className="bg-primary-container text-white px-8 py-3.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/10"
            >
              <CheckCircle2 size={18} />
              Terminar Série
            </button>
            <button
              onClick={handleNext}
              className="bg-white border-2 border-outline-variant/30 text-on-surface px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-surface-container-high active:scale-95 transition-all"
            >
              <SkipForward size={18} />
              Pular
            </button>
          </div>
        </div>

        {/* ---- Next Exercise ---- */}
        {nextExercise && (
          <div className="bg-white border border-outline-variant/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <SkipForward size={14} className="text-on-surface-variant" />
              <span className="text-[11px] font-bold tracking-wider text-on-surface-variant uppercase">
                Próximo Exercício
              </span>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/60 to-primary-container/40 aspect-video flex items-end p-4 mb-3">
              <p className="text-white font-display text-lg font-semibold">
                {nextExercise.name}
              </p>
            </div>
            <p className="text-on-surface-variant text-sm">
              Série 1 de {nextExercise.sets} • {nextExercise.reps}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
