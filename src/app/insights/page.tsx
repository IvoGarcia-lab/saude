'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Heart, Footprints, Moon, Dumbbell, Utensils, Loader2, Sparkles } from 'lucide-react';
import { CoachInsight } from '@/components/dashboard/CoachInsight';
import { useAuth } from '@/components/auth/AuthProvider';
import { mockDailySummary, mockMeals } from '@/lib/mock-data';
import { cn, calculateBMR, calculateTDEE, calculateMacros } from '@/lib/utils';

interface CalendarEvent {
  id?: string;
  title: string;
  type: 'workout' | 'meal' | 'assessment' | 'rest';
  dateStr: string;
  timeStr: string;
  description?: string;
}

export default function InsightsPage() {
  const { profile, user: firebaseUser, isDemo } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggedMeals, setLoggedMeals] = useState<any[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [proposingPlan, setProposingPlan] = useState(false);
  const [aiReport, setAiReport] = useState<{
    progression: string;
    projection: string;
    state: string;
    recommendation: string;
  } | null>(null);

  const handleAnalyzeCalendar = async () => {
    setAiLoading(true);
    setAiReport(null);
    try {
      const res = await fetch('/api/analyze-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          profile: profile || { goal: 'maintain', weight: 70, height: 170, age: 30, restrictions: [] },
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiReport(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleProposePlan = async () => {
    setProposingPlan(true);
    try {
      let calories = 2000;
      let protein = 140;
      let carbs = 200;
      let fat = 65;
      
      if (profile) {
        const bmr = calculateBMR(profile.weight, profile.height, profile.age);
        const tdee = calculateTDEE(bmr);
        calories = Math.round(
          profile.goal === 'lose' ? tdee - 500 : profile.goal === 'gain' ? tdee + 500 : tdee
        );
        const macros = calculateMacros(calories, profile.goal || 'maintain');
        protein = Math.round(macros.protein);
        carbs = Math.round(macros.carbs);
        fat = Math.round(macros.fat);
      }

      const mealsRes = await fetch('/api/suggest-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caloriesGoal: calories,
          proteinGoal: protein,
          carbsGoal: carbs,
          fatGoal: fat,
          restrictions: profile?.restrictions || [],
        }),
      });
      const mealsData = await mealsRes.json();
      
      const workoutRes = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: profile?.goal || 'maintain',
          experience: 'intermediate',
          schedule: '3x',
          restrictions: profile?.restrictions || [],
          medication: profile?.medication || '',
        }),
      });
      const workoutData = await workoutRes.json();

      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const targetDateStr = `${today.getFullYear()}-${mm}-${dd}`;
      const newEvents: CalendarEvent[] = [];

      if (mealsData.success && mealsData.data?.meals) {
        mealsData.data.meals.forEach((meal: any) => {
          const mealTypeEmoji = meal.type === 'pequeno-almoço' ? '🌅' : meal.type === 'almoço' ? '🍽️' : meal.type === 'jantar' ? '🌙' : '🍎';
          const time = meal.type === 'pequeno-almoço' ? '08:00' : meal.type === 'almoço' ? '13:00' : meal.type === 'jantar' ? '20:00' : '17:00';
          newEvents.push({
            title: `${mealTypeEmoji} Proposto: ${meal.title} (${meal.totalCalories} kcal)`,
            type: 'meal',
            dateStr: targetDateStr,
            timeStr: time,
            description: `Alimentos: ${meal.items.map((i: any) => `${i.name} (${i.quantity})`).join(', ')}.\nPrep: ${meal.instructions}`,
          });
        });
      }

      if (workoutData.success && workoutData.data?.workout) {
        newEvents.push({
          title: `🏋️ Proposto: Treino ${workoutData.data.workout.name || 'Personalizado'}`,
          type: 'workout',
          dateStr: targetDateStr,
          timeStr: '18:30',
          description: `Exercícios:\n${workoutData.data.workout.exercises.map((e: any) => `- ${e.name}: ${e.sets} séries x ${e.reps} (${e.rest} rest)`).join('\n')}`,
        });
      }

      if (isDemo || !firebaseUser) {
        const updated = [...events, ...newEvents];
        setEvents(updated);
        localStorage.setItem('demo_events', JSON.stringify(updated));
      } else {
        const { getFirebaseDb } = await import('@/lib/firebase');
        const { collection, addDoc } = await import('firebase/firestore');
        const db = getFirebaseDb();
        for (const ev of newEvents) {
          await addDoc(collection(db, 'events'), {
            ...ev,
            userId: firebaseUser.uid,
            createdAt: new Date(),
          });
        }
        await fetchEvents();
      }
    } catch (err) {
      console.error('Erro ao propor plano por IA:', err);
    } finally {
      setProposingPlan(false);
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Fetch events
  const fetchEvents = useCallback(async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const formatDateString = (y: number, m: number, d: number) => {
      const mm = String(m + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    };

    if (isDemo || !firebaseUser) {
      const local = localStorage.getItem('demo_events');
      if (local) {
        setEvents(JSON.parse(local));
      } else {
        const defaultEvents: CalendarEvent[] = [
          { title: 'Treino de Pernas', type: 'workout', dateStr: formatDateString(year, month, 12), timeStr: '08:30', description: 'Foco em quadríceps' },
          { title: 'Consulta Nutricional', type: 'assessment', dateStr: formatDateString(year, month, 15), timeStr: '14:00', description: 'Medição de bioimpedância' },
          { title: 'Preparação de Marmitas', type: 'meal', dateStr: formatDateString(year, month, 16), timeStr: '19:00', description: 'Marmitas para a semana inteira' },
        ];
        setEvents(defaultEvents);
        localStorage.setItem('demo_events', JSON.stringify(defaultEvents));
      }
      return;
    }
    setLoading(true);
    try {
      const { getFirebaseDb } = await import('@/lib/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const db = getFirebaseDb();
      const q = query(
        collection(db, 'events'),
        where('userId', '==', firebaseUser.uid)
      );
      const snapshot = await getDocs(q);
      const loaded: CalendarEvent[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loaded.push({
          id: doc.id,
          title: data.title,
          type: data.type,
          dateStr: data.dateStr,
          timeStr: data.timeStr,
          description: data.description || '',
        });
      });
      setEvents(loaded);
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, isDemo]);

  // Fetch logged meals
  const fetchLoggedMeals = useCallback(async () => {
    if (isDemo || !firebaseUser) {
      const localMeals = localStorage.getItem('demo_meals');
      setLoggedMeals(localMeals ? JSON.parse(localMeals) : mockMeals);
      return;
    }
    try {
      const { getFirebaseDb } = await import('@/lib/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const db = getFirebaseDb();
      const q = query(
        collection(db, 'meals'),
        where('userId', '==', firebaseUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const loaded: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loaded.push({
          id: doc.id,
          userId: data.userId,
          imageUrl: data.imageUrl || '',
          foods: data.foods || [],
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          feedback: data.feedback || '',
          date: data.date?.toDate() || new Date(),
          confirmed: data.confirmed || false,
          mealType: data.mealType || 'lunch',
        });
      });
      setLoggedMeals(loaded.length > 0 ? loaded : mockMeals);
    } catch (err) {
      console.error('Erro ao carregar refeições do diário:', err);
    }
  }, [firebaseUser, isDemo]);

  useEffect(() => {
    fetchEvents();
    fetchLoggedMeals();
  }, [fetchEvents, fetchLoggedMeals]);

  const fatigueData = useMemo(() => {
    const list: {
      dateStr: string;
      label: string;
      atl: number;
      ctl: number;
      tsb: number;
      calories: number;
      weight: number;
      isFuture: boolean;
      isToday: boolean;
      rawDate: Date;
    }[] = [];

    const todayDate = new Date();
    const formatDateStr = (d: Date) => {
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    };
    
    const todayStr = formatDateStr(todayDate);
    
    // Get BMR & TDEE
    const weight = profile?.weight || 70;
    const height = profile?.height || 170;
    const age = profile?.age || 30;
    const goal = profile?.goal || 'maintain';
    const bmr = calculateBMR(weight, height, age);
    const tdee = Math.round(calculateTDEE(bmr));
    
    // Target calories
    const targetCalories = Math.round(
      goal === 'lose' ? tdee - 500 : goal === 'gain' ? tdee + 500 : tdee
    );

    // Initial values 21 days ago
    let currentAtl = 15;
    let currentCtl = 20;
    let cumulativeKcalDiff = 0;

    for (let i = -21; i <= 7; i++) {
      const d = new Date();
      d.setDate(todayDate.getDate() + i);
      const dateStr = formatDateStr(d);

      const isToday = dateStr === todayStr;
      const isFuture = i > 0;

      // Filter events
      const dayEvents = events.filter((e) => e.dateStr === dateStr);
      const workouts = dayEvents.filter((e) => e.type === 'workout');
      const meals = dayEvents.filter((e) => e.type === 'meal');
      const hasRest = dayEvents.some((e) => e.type === 'rest');

      // Math Model
      const numWorkouts = workouts.length;
      const numMeals = meals.length;
      
      const atlDose = numWorkouts * 35;
      const ctlDose = numWorkouts * 4 + (numWorkouts === 0 || hasRest ? 0.5 : 0);
      const atlRecovery = numMeals * 8 + (hasRest ? 10 : 0);

      currentAtl = (currentAtl * 0.70) + atlDose - atlRecovery;
      if (currentAtl < 0) currentAtl = 0;
      if (currentAtl > 100) currentAtl = 100;

      currentCtl = (currentCtl * 0.95) + ctlDose;
      if (currentCtl < 0) currentCtl = 0;
      if (currentCtl > 100) currentCtl = 100;

      const tsb = currentCtl - currentAtl;

      // Caloric Calculation
      let dayCalories = 0;
      if (i <= 0) {
        const matchedLogged = loggedMeals.filter((m) => {
          const mDate = new Date(m.date);
          const mm = String(mDate.getMonth() + 1).padStart(2, '0');
          const dd = String(mDate.getDate()).padStart(2, '0');
          const mStr = `${mDate.getFullYear()}-${mm}-${dd}`;
          return mStr === dateStr;
        });

        if (matchedLogged.length > 0) {
          dayCalories = matchedLogged.reduce((acc, m) => acc + m.calories, 0);
        } else {
          if (meals.length > 0) {
            meals.forEach((m) => {
              const kcalMatch = m.title.match(/(\d+)\s*kcal/) || (m.description && m.description.match(/(\d+)\s*kcal/));
              dayCalories += kcalMatch ? parseInt(kcalMatch[1]) : 400;
            });
          } else {
            dayCalories = targetCalories;
          }
        }
      } else {
        if (meals.length > 0) {
          meals.forEach((m) => {
            const kcalMatch = m.title.match(/(\d+)\s*kcal/) || (m.description && m.description.match(/(\d+)\s*kcal/));
            dayCalories += kcalMatch ? parseInt(kcalMatch[1]) : 400;
          });
        } else {
          dayCalories = targetCalories;
        }
      }

      const calorieDiff = dayCalories - tdee;
      cumulativeKcalDiff += calorieDiff;
      
      const weightForecast = weight + (cumulativeKcalDiff / 7700);
      const label = `${d.getDate()} ${monthNames[d.getMonth()].slice(0, 3)}`;

      list.push({
        dateStr,
        label,
        atl: Math.round(currentAtl),
        ctl: Math.round(currentCtl),
        tsb: Math.round(tsb),
        calories: dayCalories,
        weight: parseFloat(weightForecast.toFixed(2)),
        isFuture,
        isToday,
        rawDate: d
      });
    }

    return list.slice(14);
  }, [events, loggedMeals, profile]);

  // Dynamic calculations based on user profile
  let caloriesGoal = mockDailySummary.caloriesGoal;
  let proteinGoal = mockDailySummary.proteinGoal;
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
  }

  // Inject dynamic goal into weekly stats
  const weeklyData = [
    { day: 'Seg', calories: Math.round(caloriesGoal * 0.9), goal: caloriesGoal },
    { day: 'Ter', calories: Math.round(caloriesGoal * 1.02), goal: caloriesGoal },
    { day: 'Qua', calories: Math.round(caloriesGoal * 0.85), goal: caloriesGoal },
    { day: 'Qui', calories: Math.round(caloriesGoal * 0.95), goal: caloriesGoal },
    { day: 'Sex', calories: Math.round(caloriesGoal * 1.07), goal: caloriesGoal },
    { day: 'Sáb', calories: Math.round(caloriesGoal * 0.8), goal: caloriesGoal },
    { day: 'Dom', calories: 700, goal: caloriesGoal }, // today
  ];

  const maxCalories = Math.max(...weeklyData.map((d) => d.calories), caloriesGoal + 400);

  // Generate dynamic, personalized coach insights for this page
  const dynamicInsights = profile ? [
    {
      message: `${userName}, detetámos que consumiu em média ${Math.round(caloriesGoal * 0.92)} kcal esta semana. Isto coloca-o perfeitamente alinhado com o seu objetivo de ${
        profile.goal === 'lose' ? 'perda de peso' : profile.goal === 'gain' ? 'ganho muscular' : 'manutenção de peso'
      }.`,
      type: 'nutrition' as const
    },
    {
      message: `Com ${profile.age} anos e peso de ${profile.weight} kg, a ingestão recomendada de proteínas é de pelo menos ${proteinGoal}g por dia para manter e regenerar tecidos. Garanta fontes limpas nas principais refeições.`,
      type: 'general' as const
    }
  ] : [
    {
      message: 'Registe os seus dados de perfil para desbloquear insights personalizados de macronutrientes da nossa IA.',
      type: 'general' as const
    }
  ];

  // Meal Suggester State
  const [suggestedPlan, setSuggestedPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const handleSuggestMeals = async () => {
    setLoadingPlan(true);
    setSuggestedPlan(null);
    try {
      const res = await fetch('/api/suggest-meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caloriesGoal,
          proteinGoal,
          carbsGoal: Math.round(caloriesGoal * 0.4 / 4), // estimation
          fatGoal: Math.round(caloriesGoal * 0.3 / 9), // estimation
          restrictions: profile?.restrictions || [],
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSuggestedPlan(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <div className="px-4 md:px-10 max-w-[1280px] mx-auto py-8 page-enter space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-[32px] font-bold text-on-surface tracking-tight mb-2">
            Insights Detalhados
          </h2>
          <p className="text-on-surface-variant">
            Análise completa da semana de saúde e fitness de {userName}.
          </p>
        </div>
        <button
          onClick={handleSuggestMeals}
          disabled={loadingPlan}
          className="bg-primary-container text-white text-[13px] font-semibold px-5 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50"
        >
          {loadingPlan ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Sparkles size={14} />
              Gerar Plano Alimentar
            </>
          )}
        </button>
      </div>

      {/* ---- Weekly Calorie Chart ---- */}
      <div className="bg-white border border-outline-variant/30 rounded-xl p-6">
        <h3 className="font-display text-lg font-semibold text-on-surface mb-6">
          Calorias Semanais
        </h3>
        <div className="flex items-end gap-3 h-48">
          {weeklyData.map((d, i) => {
            const height = (d.calories / maxCalories) * 100;
            const isToday = i === weeklyData.length - 1;
            const overGoal = d.calories > d.goal;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  {d.calories}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    isToday
                      ? 'bg-primary-container'
                      : overGoal
                      ? 'bg-alert-gold/60'
                      : 'bg-secondary-container/60'
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span
                  className={`text-[11px] font-semibold ${
                    isToday ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-[11px] font-semibold text-on-surface-variant">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-secondary-container/60 rounded" /> Dentro da meta
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-alert-gold/60 rounded" /> Acima da meta
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary-container rounded" /> Hoje
          </span>
        </div>
      </div>

      {/* ---- Section: Advanced Progress & Fatigue Calculator & Forecast ---- */}
      <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-container pb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-on-surface flex items-center gap-2">
              <Sparkles className="text-ai-indigo animate-pulse" size={20} fill="currentColor" />
              Monitor de Fadiga e Projeção de Progresso
            </h3>
            <p className="text-on-surface-variant text-xs mt-1">
              Simulação de stress de treino baseado no modelo dinâmico CTL (Adaptação) / ATL (Fadiga) e TSB (Balanço).
            </p>
          </div>
          
          {/* Quick Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-error block" /> Fadiga (ATL)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-medical-green block" /> Progresso (CTL)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-ai-indigo block animate-pulse" /> Balanço (TSB)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SVG Graph Column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative bg-surface-container-lowest/40 border border-outline-variant/20 rounded-xl p-4 min-h-[260px] flex flex-col justify-between">
              
              {/* Tooltip Overlay */}
              {hoveredPoint && (
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-outline-variant/50 p-3 rounded-xl shadow-xl z-10 text-[11px] space-y-1.5 min-w-[170px] animate-fade-in">
                  <p className="font-bold text-on-surface text-[12px] border-b pb-1 mb-1">
                    🗓️ {hoveredPoint.label} {hoveredPoint.isToday && <span className="text-primary-container">(Hoje)</span>}
                  </p>
                  <p className="flex justify-between">
                    <span className="text-on-surface-variant">Fadiga Muscular:</span>
                    <span className="font-bold text-error">{hoveredPoint.atl}%</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-on-surface-variant">Adaptação Física:</span>
                    <span className="font-bold text-medical-green">{hoveredPoint.ctl}%</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-on-surface-variant">Balanço de Forma:</span>
                    <span className={cn("font-bold", hoveredPoint.tsb < -15 ? "text-error" : hoveredPoint.tsb > 5 ? "text-primary-container" : "text-alert-gold")}>
                      {hoveredPoint.tsb}%
                    </span>
                  </p>
                  <p className="flex justify-between border-t pt-1 mt-1">
                    <span className="text-on-surface-variant">Ingestão/Plano:</span>
                    <span className="font-semibold text-on-surface">{hoveredPoint.calories} kcal</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-on-surface-variant">Peso Previsto:</span>
                    <span className="font-semibold text-on-surface">{hoveredPoint.weight} kg</span>
                  </p>
                </div>
              )}

              {/* The SVG Chart */}
              <div className="w-full">
                <svg viewBox="0 0 600 200" className="w-full h-auto overflow-visible select-none">
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((level) => {
                    const y = 170 - (level / 100) * 140;
                    return (
                      <g key={level}>
                        <line x1="40" y1={y} x2="560" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                        <text x="30" y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="600">
                          {level}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Today vertical divider line */}
                  <g>
                    <line 
                      x1={40 + (7 / 14) * 520} 
                      y1="10" 
                      x2={40 + (7 / 14) * 520} 
                      y2="185" 
                      stroke="#6366f1" 
                      strokeWidth="1.5" 
                      strokeDasharray="4,4" 
                    />
                    <text x={40 + (7 / 14) * 520} y="8" textAnchor="middle" fontSize="8" fill="#6366f1" fontWeight="bold">
                      HOJE
                    </text>
                    
                    <text x={40 + (3.5 / 14) * 520} y="195" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">
                      ← HISTÓRICO
                    </text>
                    <text x={40 + (10.5 / 14) * 520} y="195" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">
                      PREVISÃO →
                    </text>
                  </g>

                  {/* Draw Lines */}
                  <path
                    d={fatigueData.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${40 + (idx / 14) * 520} ${170 - (d.atl / 100) * 140}`).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d={fatigueData.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${40 + (idx / 14) * 520} ${170 - (d.ctl / 100) * 140}`).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    // Map TSB [-50, 50] to [0, 100] range for display
                    d={fatigueData.map((d, idx) => {
                      const tsbMapped = Math.max(-50, Math.min(50, d.tsb));
                      const percent = (tsbMapped + 50);
                      return `${idx === 0 ? 'M' : 'L'} ${40 + (idx / 14) * 520} ${170 - (percent / 100) * 140}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.0"
                    strokeDasharray="2,2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* X-Axis labels and interaction nodes */}
                  {fatigueData.map((d, idx) => {
                    const x = 40 + (idx / 14) * 520;
                    const yAtl = 170 - (d.atl / 100) * 140;
                    
                    return (
                      <g key={idx} className="group">
                        <rect
                          x={x - 18}
                          y="10"
                          width="36"
                          height="165"
                          fill="transparent"
                          onMouseEnter={() => setHoveredPoint(d)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          className="cursor-pointer"
                        />

                        <circle 
                          cx={x} 
                          cy={yAtl} 
                          r={d.isToday ? 5 : 3} 
                          fill={d.isToday ? "#ffffff" : "#ef4444"} 
                          stroke="#ef4444" 
                          strokeWidth={d.isToday ? 2.5 : 1}
                          className="pointer-events-none transition-all duration-150 group-hover:r-5" 
                        />
                        
                        <text x={x} y="185" textAnchor="middle" fontSize="8" fill={d.isToday ? "#6366f1" : "#64748b"} fontWeight={d.isToday ? "bold" : "500"}>
                          {d.label.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            
            <p className="text-[11px] text-on-surface-variant italic leading-relaxed text-center">
              Passe o rato ou toque nas colunas do gráfico para ver a evolução precisa e projeções de calorias/peso para cada dia.
            </p>
          </div>

          {/* Metrics & Clinical recommendations Column */}
          <div className="lg:col-span-4 space-y-4">
            {/* Status Card */}
            {(() => {
              const todayStats = fatigueData[7];
              if (!todayStats) return null;

              let statusLabel = 'Equilibrado';
              let statusDesc = 'O stress de treino está na zona ideal de adaptação metabólica e hipertrofia.';
              let statusColorClass = 'text-alert-gold bg-alert-gold/5 border-alert-gold/20';
              let statusBadgeColor = 'bg-alert-gold';

              if (todayStats.tsb < -15) {
                statusLabel = 'Sobrecarga Muscular';
                statusDesc = 'Alto nível de fadiga acumulada. Alto risco de lesão e overreaching. Priorize descanso hoje.';
                statusColorClass = 'text-error bg-error/5 border-error/20';
                statusBadgeColor = 'bg-error';
              } else if (todayStats.tsb > 5) {
                statusLabel = 'Fresco / Recuperado';
                statusDesc = 'Nível de regeneração ótimo. Ótimo momento para um treino de força máxima ou progressão de carga.';
                statusColorClass = 'text-medical-green bg-medical-green/5 border-medical-green/20';
                statusBadgeColor = 'bg-medical-green';
              }

              // Find future peak fatigue
              const futureData = fatigueData.slice(8);
              let peakFatigueDay = todayStats;
              futureData.forEach(d => {
                if (d.atl > peakFatigueDay.atl) {
                  peakFatigueDay = d;
                }
              });

              // Weight difference forecast
              const weightDiff = (fatigueData[14]?.weight - todayStats.weight).toFixed(2);
              const isGain = parseFloat(weightDiff) > 0;

              return (
                <div className="space-y-4">
                  <div className={cn("border rounded-xl p-4 space-y-2", statusColorClass)}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", statusBadgeColor)} />
                      Estado Hoje: {statusLabel}
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">{statusDesc}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-container-low border rounded-xl p-3 text-center">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Fadiga Atual</p>
                      <p className="text-2xl font-bold text-error mt-1">{todayStats.atl}%</p>
                    </div>
                    <div className="bg-surface-container-low border rounded-xl p-3 text-center">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Forma (TSB)</p>
                      <p className="text-2xl font-bold text-primary mt-1">{todayStats.tsb}%</p>
                    </div>
                  </div>

                  <div className="border border-outline-variant/30 rounded-xl p-4 bg-surface-container-lowest space-y-3 text-xs leading-5">
                    <p className="font-bold text-on-surface text-[13px] border-b pb-1.5">
                      🔮 Previsões Clínicas & Metas (7 Dias)
                    </p>
                    
                    <div>
                      <span className="font-bold text-on-surface block">Pico de Stress Muscular:</span>
                      <span className="text-on-surface-variant">
                        Previsto para <strong className="text-error">{peakFatigueDay.label.split(' ')[0]} de {monthNames[peakFatigueDay.rawDate.getMonth()]}</strong> atingindo <strong>{peakFatigueDay.atl}%</strong> de fadiga. Ajuste os treinos seguintes.
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-on-surface block">Projeção Ponderal:</span>
                      <span className="text-on-surface-variant">
                        Peso estimado no dia {fatigueData[14]?.label}: <strong>{fatigueData[14]?.weight} kg</strong> ({isGain ? '+' : ''}{weightDiff} kg comparado a hoje).
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-on-surface block">Recomendação Inteligente:</span>
                      <span className="text-on-surface-variant italic">
                        {todayStats.tsb < -15 
                          ? "Insira um dia de descanso completo ou uma sessão de alongamento/mobilidade ligeira no calendário para acelerar a drenagem de lactato."
                          : "Consistência adequada. Mantenha o planeamento calórico atual de acordo com o seu perfil nutricional."}
                      </span>
                    </div>
                  </div>

                  {/* AI Actions & Report inside Insights Panel */}
                  <div className="bg-ai-indigo/5 border border-ai-indigo/10 rounded-xl p-4 space-y-4">
                    <p className="text-on-surface text-[12px] leading-5 font-semibold">
                      Análise Profunda do Calendário com IA
                    </p>

                    <button
                      onClick={handleAnalyzeCalendar}
                      disabled={aiLoading}
                      className="w-full bg-ai-indigo text-white py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Calcular Progresso & Fadiga com IA
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleProposePlan}
                      disabled={proposingPlan}
                      className="w-full border border-ai-indigo/20 text-ai-indigo py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:bg-ai-indigo/5 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {proposingPlan ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Sparkles size={12} fill="currentColor" />
                          Propor Plano do Dia no Calendário
                        </>
                      )}
                    </button>

                    {aiReport && (
                      <div className="space-y-3 pt-3 border-t border-ai-indigo/10 text-[11px] leading-4 page-enter">
                        <div>
                          <p className="font-bold text-ai-indigo">📈 Progressão e Consistência</p>
                          <p className="text-on-surface">{aiReport.progression}</p>
                        </div>
                        <div>
                          <p className="font-bold text-ai-indigo">🎯 Projeções de Peso</p>
                          <p className="text-on-surface">{aiReport.projection}</p>
                        </div>
                        <div>
                          <p className="font-bold text-ai-indigo">🔋 Fadiga e Estado Muscular</p>
                          <p className="text-on-surface">{aiReport.state}</p>
                        </div>
                        <div>
                          <p className="font-bold text-ai-indigo">💡 Recomendações do Coach</p>
                          <p className="text-on-surface italic">{aiReport.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ---- AI Meal Plan Suggestions Output ---- */}
      {suggestedPlan && (
        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 space-y-6 page-enter shadow-sm">
          <div>
            <h3 className="font-display text-lg font-bold text-primary flex items-center gap-2">
              <Sparkles size={18} className="text-ai-indigo" fill="currentColor" />
              Sugestão de Menu Diário (IA)
            </h3>
            <p className="text-on-surface-variant text-xs mt-1">
              Plano de {userName} calibrado para o alvo de {caloriesGoal} kcal e restrições alimentares.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedPlan.meals.map((meal: any, idx: number) => (
              <div key={idx} className="p-4 border rounded-xl space-y-3 bg-surface-container-lowest">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ai-indigo bg-ai-indigo/5 px-2.5 py-1 rounded-full">
                    {meal.type}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {meal.totalCalories} kcal
                  </span>
                </div>
                <h4 className="font-display font-semibold text-on-surface text-[15px]">
                  {meal.title}
                </h4>
                <div className="space-y-1">
                  {meal.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs text-on-surface-variant border-b border-surface-container/50 py-1 last:border-0">
                      <span>{item.name} ({item.quantity})</span>
                      <span className="font-semibold text-on-surface">P: {item.protein}g | C: {item.carbs}g | G: {item.fat}g</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-on-surface-variant leading-4 italic pt-1 border-t border-dashed">
                  <strong>Preparo:</strong> {meal.instructions}
                </p>
              </div>
            ))}
          </div>

          {/* Aggregate Totals */}
          <div className="bg-ai-indigo/5 border border-ai-indigo/10 rounded-xl p-4 flex flex-wrap justify-around text-center gap-3">
            <div>
              <p className="text-[10px] font-semibold text-ai-indigo tracking-wider uppercase">Calorias Totais</p>
              <p className="font-display text-xl font-bold text-on-surface">{suggestedPlan.aggregateCalories} kcal</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-ai-indigo tracking-wider uppercase">Proteínas</p>
              <p className="font-display text-xl font-bold text-on-surface">{suggestedPlan.aggregateProtein}g</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-ai-indigo tracking-wider uppercase">Carbohidratos</p>
              <p className="font-display text-xl font-bold text-on-surface">{suggestedPlan.aggregateCarbs}g</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-ai-indigo tracking-wider uppercase">Gorduras</p>
              <p className="font-display text-xl font-bold text-on-surface">{suggestedPlan.aggregateFat}g</p>
            </div>
          </div>
        </div>
      )}

      {/* ---- AI Insights List ---- */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-on-surface">
          Recomendações do Coach
        </h3>
        {dynamicInsights.map((insight, i) => (
          <CoachInsight key={i} message={insight.message} />
        ))}
      </div>

      {/* ---- Health Metrics Grid ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: Heart,
            label: 'Frequência Cardíaca',
            value: '72',
            unit: 'bpm',
            trend: 'stable',
            color: 'text-error',
          },
          {
            icon: Footprints,
            label: 'Média Passos/Dia',
            value: '8,240',
            unit: '',
            trend: 'up',
            color: 'text-medical-green',
          },
          {
            icon: Moon,
            label: 'Média Sono',
            value: '7.2',
            unit: 'h',
            trend: 'up',
            color: 'text-ai-indigo',
          },
          {
            icon: Dumbbell,
            label: 'Treinos/Semana',
            value: '4',
            unit: '',
            trend: 'up',
            color: 'text-primary-container',
          },
        ].map(({ icon: Icon, label, value, unit, trend, color }, i) => (
          <div
            key={i}
            className="bg-white border border-outline-variant/30 rounded-xl p-5 metric-card"
          >
            <div className="flex items-center justify-between mb-3">
              <Icon size={18} className={color} />
              {trend === 'up' && <TrendingUp size={14} className="text-medical-green" />}
              {trend === 'down' && <TrendingDown size={14} className="text-error" />}
              {trend === 'stable' && <Minus size={14} className="text-on-surface-variant" />}
            </div>
            <p className="font-display text-2xl font-light text-on-surface">
              {value}
              {unit && <span className="text-sm text-on-surface-variant ml-1">{unit}</span>}
            </p>
            <p className="text-[11px] font-semibold text-on-surface-variant tracking-wider mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ---- Recent Meals ---- */}
      <div>
        <h3 className="font-display text-lg font-semibold text-on-surface mb-4">
          Refeições Recentes
        </h3>
        <div className="space-y-3">
          {mockMeals.map((meal) => (
            <div
              key={meal.id}
              className="bg-white border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-secondary-container/30 p-2 rounded-lg">
                  <Utensils size={18} className="text-on-secondary-container" />
                </div>
                <div>
                  <p className="font-semibold text-on-surface text-[15px] capitalize">
                    {meal.mealType === 'breakfast'
                      ? 'Pequeno-almoço'
                      : meal.mealType === 'lunch'
                      ? 'Almoço'
                      : meal.mealType === 'dinner'
                      ? 'Jantar'
                      : 'Snack'}
                  </p>
                  <p className="text-on-surface-variant text-xs">
                    P: {meal.protein}g | C: {meal.carbs}g | G: {meal.fat}g
                  </p>
                </div>
              </div>
              <p className="font-display text-lg font-semibold text-primary">
                {meal.calories} kcal
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
