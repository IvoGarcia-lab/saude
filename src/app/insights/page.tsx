'use client';

import { TrendingUp, TrendingDown, Minus, Sparkles, Utensils, Dumbbell, Moon, Footprints, Heart } from 'lucide-react';
import { CoachInsight } from '@/components/dashboard/CoachInsight';
import { mockDailySummary, mockMeals, mockCoachInsights } from '@/lib/mock-data';

export default function InsightsPage() {
  const summary = mockDailySummary;

  const weeklyData = [
    { day: 'Seg', calories: 1950, goal: 2150 },
    { day: 'Ter', calories: 2200, goal: 2150 },
    { day: 'Qua', calories: 1800, goal: 2150 },
    { day: 'Qui', calories: 2100, goal: 2150 },
    { day: 'Sex', calories: 2300, goal: 2150 },
    { day: 'Sáb', calories: 1700, goal: 2150 },
    { day: 'Dom', calories: 700, goal: 2150 },
  ];

  const maxCalories = Math.max(...weeklyData.map((d) => d.calories), 2500);

  return (
    <div className="px-4 md:px-10 max-w-[1280px] mx-auto py-8 page-enter space-y-8">
      <div>
        <h2 className="font-display text-[32px] font-bold text-on-surface tracking-tight mb-2">
          Insights Detalhados
        </h2>
        <p className="text-on-surface-variant">
          Análise completa da sua semana de saúde e fitness.
        </p>
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

      {/* ---- AI Insights List ---- */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-on-surface">
          Recomendações do Coach
        </h3>
        {mockCoachInsights.map((insight, i) => (
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
