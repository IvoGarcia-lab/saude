'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, Footprints, Moon, Droplets, Wheat, Egg } from 'lucide-react';
import { CalorieRing } from '@/components/dashboard/CalorieRing';
import { MacroCard } from '@/components/dashboard/MacroCard';
import { CoachInsight } from '@/components/dashboard/CoachInsight';
import { useAuth } from '@/components/auth/AuthProvider';
import { mockDailySummary, mockCoachInsights } from '@/lib/mock-data';
import { calculateBMR, calculateTDEE, calculateMacros } from '@/lib/utils';

export default function DashboardPage() {
  const { profile } = useAuth();

  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [proteinConsumed, setProteinConsumed] = useState(0);
  const [carbsConsumed, setCarbsConsumed] = useState(0);
  const [fatConsumed, setFatConsumed] = useState(0);

  // Dynamic calculations based on user profile
  let caloriesGoal = mockDailySummary.caloriesGoal;
  let proteinGoal = mockDailySummary.proteinGoal;
  let carbsGoal = mockDailySummary.carbsGoal;
  let fatGoal = mockDailySummary.fatGoal;
  const userName = profile?.name ? profile.name.split(' ')[0] : 'Utilizador';

  if (profile) {
    const bmr = calculateBMR(profile.weight, profile.height, profile.age);
    const tdee = calculateTDEE(bmr);

    if (profile.goal === 'lose') {
      caloriesGoal = Math.max(1200, tdee - 500);
    } else if (profile.goal === 'gain') {
      caloriesGoal = tdee + 300;
    } else {
      caloriesGoal = tdee;
    }

    const macros = calculateMacros(caloriesGoal, profile.goal);
    proteinGoal = macros.protein;
    carbsGoal = macros.carbs;
    fatGoal = macros.fat;
  }

  useEffect(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${mm}-${dd}`;

    // 1. Calculate from Calendar completed meal events
    const localEvents = localStorage.getItem('demo_events');
    const eventsList = localEvents ? JSON.parse(localEvents) : [];
    
    let kcal = 0;
    let prot = 0;
    let carbs = 0;
    let fat = 0;

    const todayCompletedMeals = eventsList.filter(
      (e: any) => e.dateStr === todayStr && e.type === 'meal' && e.completed
    );

    todayCompletedMeals.forEach((m: any) => {
      const kcalMatch = m.title.match(/(\d+)\s*kcal/) || (m.description && m.description.match(/(\d+)\s*kcal/));
      kcal += kcalMatch ? parseInt(kcalMatch[1]) : 400;

      const pMatch = m.description?.match(/P:\s*(\d+)g/) || m.description?.match(/Proteína:\s*(\d+)g/);
      const cMatch = m.description?.match(/C:\s*(\d+)g/) || m.description?.match(/Hidratos:\s*(\d+)g/);
      const fMatch = m.description?.match(/G:\s*(\d+)g/) || m.description?.match(/Gordura:\s*(\d+)g/);
      
      prot += pMatch ? parseInt(pMatch[1]) : 30;
      carbs += cMatch ? parseInt(cMatch[1]) : 40;
      fat += fMatch ? parseInt(fMatch[1]) : 10;
    });

    // 2. Calculate from Diary logged meals
    const localMeals = localStorage.getItem('demo_meals');
    const mealsList = localMeals ? JSON.parse(localMeals) : [];
    const todayMeals = mealsList.filter((m: any) => {
      const mDate = new Date(m.date);
      const mStr = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}-${String(mDate.getDate()).padStart(2, '0')}`;
      return mStr === todayStr;
    });
    
    todayMeals.forEach((m: any) => {
      kcal += m.calories || 0;
      prot += m.protein || 0;
      carbs += m.carbs || 0;
      fat += m.fat || 0;
    });

    setCaloriesConsumed(kcal);
    setProteinConsumed(prot);
    setCarbsConsumed(carbs);
    setFatConsumed(fat);
  }, []);

  const summary = {
    ...mockDailySummary,
    caloriesGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
    caloriesConsumed,
    protein: proteinConsumed,
    carbs: carbsConsumed,
    fat: fatConsumed
  };

  // Dynamic personalized coach insight based on user profile
  let insightMessage = "Olá! Registe o seu perfil ou inicie sessão para receber conselhos de IA totalmente personalizados com base na sua biometria.";

  if (profile) {
    const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
    const ageMessage = profile.age >= 35 
      ? `Aos ${profile.age} anos, a otimização metabólica e a preservação de massa muscular são as nossas prioridades clínicas.`
      : `Aos ${profile.age} anos, o seu rendimento físico e recuperação estão no nível ideal para aceleração de resultados.`;

    const goalMessage = profile.goal === 'lose'
      ? `Para perder peso de forma saudável, o seu plano está regulado para ${caloriesGoal} kcal. Mantenha o foco no défice e no treino de hoje.`
      : profile.goal === 'gain'
      ? `Para potenciar o ganho de massa magra, o seu alvo de ${proteinGoal}g de proteína é crucial. Foco na consistência!`
      : `Focado em manutenção de peso. A meta de ${caloriesGoal} kcal garante estabilidade hormonal e energia duradoura.`;

    const restrictionsMessage = profile.restrictions.length > 0
      ? ` As suas restrições (${profile.restrictions.join(', ')}) foram ativadas no plano alimentar.`
      : '';

    insightMessage = `Olá, ${userName}! ${ageMessage} ${goalMessage} O seu IMC atual é ${bmi}.${restrictionsMessage}`;
  }

  const insight = {
    message: insightMessage,
    type: 'general' as const,
    timestamp: new Date()
  };

  return (
    <div className="px-4 md:px-10 max-w-[1280px] mx-auto space-y-12 py-8 page-enter">
      {/* ---- Greeting Section ---- */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-primary text-[13px] font-semibold tracking-[0.05em] uppercase mb-2">
            Bem-vindo de volta
          </p>
          <h2 className="font-display text-[32px] md:text-[48px] font-bold leading-tight tracking-tight text-on-surface">
            Olá, {userName}
          </h2>
          <p className="text-on-surface-variant text-lg mt-1">
            Hoje é um ótimo dia para manter o foco na sua saúde.
          </p>
        </div>
        <Link
          href="/diary"
          className="bg-primary-container text-on-primary text-[13px] font-semibold tracking-[0.05em] px-6 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md w-fit"
        >
          <Plus size={18} />
          Adicionar Refeição
        </Link>
      </section>

      {/* ---- Bento Grid ---- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Caloric Progress (Large Card) */}
        <div className="md:col-span-5 bg-white border border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center text-center metric-card">
          <div className="flex justify-between w-full mb-6 items-center">
            <span className="text-[13px] font-semibold tracking-[0.05em] text-on-surface-variant">
              PROGRESSO CALÓRICO
            </span>
            <TrendingUp size={20} className="text-medical-green" />
          </div>

          <CalorieRing
            consumed={summary.caloriesConsumed}
            goal={summary.caloriesGoal}
            size={160}
            className="mb-6"
          />

          <div className="flex gap-6 text-center">
            <div>
              <p className="font-display text-2xl font-semibold text-on-surface">
                {summary.caloriesGoal.toLocaleString('pt-PT')}
              </p>
              <p className="text-xs font-semibold text-on-surface-variant tracking-wide">
                Meta
              </p>
            </div>
            <div className="w-px h-10 bg-outline-variant" />
            <div>
              <p className="font-display text-2xl font-semibold text-primary">
                {summary.caloriesConsumed.toLocaleString('pt-PT')}
              </p>
              <p className="text-xs font-semibold text-on-surface-variant tracking-wide">
                Consumido
              </p>
            </div>
          </div>
        </div>

        {/* Macros + Coach Insight */}
        <div className="md:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-3">
          <MacroCard
            icon={<Egg size={22} className="text-ai-indigo" />}
            label="PROTEÍNAS"
            value={summary.protein}
            unit="g"
            progress={(summary.protein / summary.proteinGoal) * 100}
            color="bg-ai-indigo"
          />
          <MacroCard
            icon={<Wheat size={22} className="text-alert-gold" />}
            label="CARBOS"
            value={summary.carbs}
            unit="g"
            progress={(summary.carbs / summary.carbsGoal) * 100}
            color="bg-alert-gold"
          />
          <MacroCard
            icon={<Droplets size={22} className="text-primary-container" />}
            label="GORDURAS"
            value={summary.fat}
            unit="g"
            progress={(summary.fat / summary.fatGoal) * 100}
            color="bg-primary-container"
          />

          {/* Coach Insight Banner spans all 3 columns */}
          <div className="md:col-span-3">
            <CoachInsight message={insight.message} />
          </div>
        </div>
      </div>

      {/* ---- Workout Suggestion + Activity ---- */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workout card with background video */}
        <Link
          href="/workouts"
          className="relative overflow-hidden rounded-2xl group cursor-pointer aspect-video md:aspect-auto min-h-[260px] block"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          >
            <source src="/video/treino_de_força_funcionaal_cal.mp4" type="video/mp4" />
            O seu navegador não suporta a tag de vídeo.
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent flex flex-col justify-end p-6">
            <span className="bg-primary-container text-white text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-4 uppercase tracking-widest">
              Sugestão de Hoje
            </span>
            <h3 className="font-display text-2xl font-semibold text-white mb-2">
              Treino de Força Funcional
            </h3>
            <div className="flex items-center gap-4 text-white/80 text-[13px] font-semibold">
              <span className="flex items-center gap-1">⏱ 45 min</span>
              <span className="flex items-center gap-1">💪 Intermédio</span>
            </div>
          </div>
        </Link>

        {/* Activity Summary */}
        <div className="space-y-3 flex flex-col justify-center">
          <h4 className="text-primary font-display text-2xl font-semibold">
            Resumo de Atividade
          </h4>

          {/* Steps */}
          <div className="bg-white p-4 rounded-xl border border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-secondary-container/30 p-2 rounded-lg">
                <Footprints size={20} className="text-on-secondary-container" />
              </div>
              <div>
                <p className="text-on-surface font-semibold text-[15px]">Passos</p>
                <p className="text-on-surface-variant text-xs font-semibold">
                  Meta: {summary.stepsGoal.toLocaleString('pt-PT')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-semibold text-on-surface">
                {summary.steps.toLocaleString('pt-PT')}
              </p>
              <p className="text-medical-green text-[10px] font-bold">
                {Math.round((summary.steps / summary.stepsGoal) * 100)}%
              </p>
            </div>
          </div>

          {/* Sleep */}
          <div className="bg-white p-4 rounded-xl border border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-secondary-container/30 p-2 rounded-lg">
                <Moon size={20} className="text-on-secondary-container" />
              </div>
              <div>
                <p className="text-on-surface font-semibold text-[15px]">Sono</p>
                <p className="text-on-surface-variant text-xs font-semibold">
                  Meta: {summary.sleepGoal}h
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-semibold text-on-surface">
                {Math.floor(summary.sleepHours)}h {Math.round((summary.sleepHours % 1) * 60)}m
              </p>
              <p className="text-alert-gold text-[10px] font-bold">Quase lá</p>
            </div>
          </div>

          <Link
            href="/insights"
            className="w-full py-4 text-primary text-[13px] font-semibold border-2 border-primary/10 rounded-xl hover:bg-primary/5 transition-colors text-center block"
          >
            Ver Insights Detalhados
          </Link>
        </div>
      </section>
    </div>
  );
}
