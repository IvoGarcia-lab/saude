'use client';

import { TrendingUp, TrendingDown, Minus, Heart, Footprints, Moon, Dumbbell, Utensils } from 'lucide-react';
import { CoachInsight } from '@/components/dashboard/CoachInsight';
import { useAuth } from '@/components/auth/AuthProvider';
import { mockDailySummary, mockMeals } from '@/lib/mock-data';
import { calculateBMR, calculateTDEE, calculateMacros } from '@/lib/utils';

export default function InsightsPage() {
  const { profile } = useAuth();

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
