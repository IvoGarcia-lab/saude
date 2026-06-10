'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Sparkles, Loader2, ChevronLeft, ChevronRight, Check, X, BookOpen, Utensils } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CoachInsight } from '@/components/dashboard/CoachInsight';
import { cn, calculateBMR, calculateTDEE, calculateMacros } from '@/lib/utils';
import { mockMeals } from '@/lib/mock-data';
import type { Meal } from '@/lib/types';

interface CalendarEvent {
  id?: string;
  title: string;
  type: 'workout' | 'meal' | 'assessment' | 'rest';
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM
  description?: string;
}

export default function CalendarPage() {
  const { profile, user: firebaseUser, isDemo } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggedMeals, setLoggedMeals] = useState<Meal[]>([]);

  // Active selected cell date in calendar (defaults to today)
  const getTodayStr = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  };
  const [activeDateStr, setActiveDateStr] = useState<string>(getTodayStr());

  // Recipe Book based on user profile
  const recipes = [
    {
      title: 'Papas de Aveia com Whey e Mirtilos',
      category: 'Pequeno-almoço',
      time: '10 min',
      calories: 340,
      protein: 26,
      carbs: 45,
      fat: 5,
      ingredients: '50g aveia integral, 1 scoop whey, 50g mirtilos, 150ml água/bebida vegetal',
      prep: 'Cozinhar a aveia na água, retirar do lume, juntar whey e decorar com mirtilos.',
      tags: ['lactose-free']
    },
    {
      title: 'Salmão Grelhado com Batata Doce',
      category: 'Almoço / Jantar',
      time: '25 min',
      calories: 520,
      protein: 38,
      carbs: 40,
      fat: 20,
      ingredients: '150g salmão, 150g batata doce cozida, 100g brócolos, 1 colher azeite',
      prep: 'Grelhar o salmão e a batata doce às rodelas. Cozer brócolos ao vapor e regar com azeite.',
      tags: ['lactose-free', 'gluten-free']
    },
    {
      title: 'Tofu Salteado com Quinoa e Courgette',
      category: 'Almoço / Jantar',
      time: '20 min',
      calories: 410,
      protein: 20,
      carbs: 48,
      fat: 14,
      ingredients: '150g tofu, 120g quinoa cozida, 100g courgette, alho e especiarias',
      prep: 'Saltear o tofu aos cubos e a courgette com alho. Misturar com a quinoa quente.',
      tags: ['vegan', 'lactose-free', 'gluten-free']
    },
    {
      title: 'Crepioca de Peru e Requeijão Ligeiro',
      category: 'Snack / Lanche',
      time: '8 min',
      calories: 290,
      protein: 18,
      carbs: 28,
      fat: 10,
      ingredients: '1 ovo, 2 colheres goma tapioca, 2 fatias peito peru, 30g requeijão',
      prep: 'Bater o ovo com a tapioca. Colocar na frigideira, dourar os dois lados, rechear e dobrar.',
      tags: ['gluten-free']
    }
  ];

  const filteredRecipes = recipes.filter((recipe) => {
    if (!profile?.restrictions || profile.restrictions.length === 0) return true;
    return profile.restrictions.every((r) => {
      const rule = r.toLowerCase();
      if (rule.includes('lactose')) return recipe.tags.includes('lactose-free');
      if (rule.includes('glúten') || rule.includes('gluten')) return recipe.tags.includes('gluten-free');
      if (rule.includes('vegan')) return recipe.tags.includes('vegan');
      return true;
    });
  });

  const handleScheduleRecipe = async (recipe: typeof recipes[0]) => {
    setSavingEvent(true);
    const newEvent: CalendarEvent = {
      title: `🥗 Receita: ${recipe.title}`,
      type: 'meal',
      dateStr: activeDateStr,
      timeStr: recipe.category === 'Pequeno-almoço' ? '08:30' : recipe.category === 'Snack / Lanche' ? '17:00' : '13:30',
      description: `Ingredientes: ${recipe.ingredients}\nMacros: ${recipe.calories} kcal, ${recipe.protein}g Prot, ${recipe.carbs}g H.C., ${recipe.fat}g Gord.\nPrep: ${recipe.prep}`,
    };

    if (isDemo || !firebaseUser) {
      const updated = [...events, newEvent];
      setEvents(updated);
      localStorage.setItem('demo_events', JSON.stringify(updated));
    } else {
      try {
        const { getFirebaseDb } = await import('@/lib/firebase');
        const { collection, addDoc } = await import('firebase/firestore');
        const db = getFirebaseDb();
        await addDoc(collection(db, 'events'), {
          ...newEvent,
          userId: firebaseUser.uid,
          createdAt: new Date(),
        });
        await fetchEvents();
      } catch (err) {
        console.error('Erro ao salvar receita no calendário:', err);
      }
    }
    setSavingEvent(false);
  };

  // New Event Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'workout' | 'meal' | 'assessment' | 'rest'>('workout');
  const [selectedDate, setSelectedDate] = useState('');
  const [time, setTime] = useState('08:00');
  const [description, setDescription] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  // AI Analysis State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<{
    progression: string;
    projection: string;
    state: string;
    recommendation: string;
  } | null>(null);

  // Get days in month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = (getFirstDayOfMonth(year, month) + 6) % 7; // Align to Monday index 0-6

  // Format date helper
  const formatDateString = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // 1. Fetch user's events from Firestore or LocalStorage fallback
  const fetchEvents = useCallback(async () => {
    if (isDemo || !firebaseUser) {
      // LocalStorage fallback for demo mode
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
  }, [firebaseUser, isDemo, year, month]);

  const fetchLoggedMeals = useCallback(async () => {
    if (isDemo || !firebaseUser) {
      setLoggedMeals(mockMeals);
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
      const loaded: Meal[] = [];
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

  // 2. Add Event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedDate) return;

    setSavingEvent(true);
    const newEvent: CalendarEvent = {
      title,
      type,
      dateStr: selectedDate,
      timeStr: time,
      description,
    };

    if (isDemo || !firebaseUser) {
      const updated = [...events, newEvent];
      setEvents(updated);
      localStorage.setItem('demo_events', JSON.stringify(updated));
    } else {
      try {
        const { getFirebaseDb } = await import('@/lib/firebase');
        const { collection, addDoc } = await import('firebase/firestore');
        const db = getFirebaseDb();
        await addDoc(collection(db, 'events'), {
          ...newEvent,
          userId: firebaseUser.uid,
          createdAt: new Date(),
        });
        await fetchEvents();
      } catch (err) {
        console.error('Erro ao salvar evento:', err);
      }
    }

    // Reset Form
    setTitle('');
    setType('workout');
    setSelectedDate('');
    setTime('08:00');
    setDescription('');
    setShowAddForm(false);
    setSavingEvent(false);
  };

  // 3. Delete Event
  const handleDeleteEvent = async (eventId?: string, localIndex?: number) => {
    if (isDemo || !firebaseUser) {
      const updated = events.filter((_, idx) => idx !== localIndex);
      setEvents(updated);
      localStorage.setItem('demo_events', JSON.stringify(updated));
      return;
    }

    if (!eventId) return;
    try {
      const { getFirebaseDb } = await import('@/lib/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'events', eventId));
      await fetchEvents();
    } catch (err) {
      console.error('Erro ao apagar evento:', err);
    }
  };

  // 4. Trigger AI Calendar Analysis
  const [proposingPlan, setProposingPlan] = useState(false);

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

      // 1. Fetch meal suggestion
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
      
      // 2. Fetch workout suggestion
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

      const targetDateStr = activeDateStr;
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

      // Save all proposed events
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

  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

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
    let currentAtl = 15; // baseline fatigue
    let currentCtl = 20; // baseline fitness
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

      // 1. Math Model for Fitness & Fatigue
      const numWorkouts = workouts.length;
      const numMeals = meals.length;
      
      const atlDose = numWorkouts * 35;
      const ctlDose = numWorkouts * 4 + (numWorkouts === 0 || hasRest ? 0.5 : 0);
      const atlRecovery = numMeals * 8 + (hasRest ? 10 : 0);

      // Decays & Dose addition
      currentAtl = (currentAtl * 0.70) + atlDose - atlRecovery;
      if (currentAtl < 0) currentAtl = 0;
      if (currentAtl > 100) currentAtl = 100;

      currentCtl = (currentCtl * 0.95) + ctlDose;
      if (currentCtl < 0) currentCtl = 0;
      if (currentCtl > 100) currentCtl = 100;

      const tsb = currentCtl - currentAtl;

      // 2. Caloric Calculation
      let dayCalories = 0;
      if (i <= 0) {
        // Past or present: look at loggedMeals first
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
          // Fallback to planned meals in calendar
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
        // Future: look at calendar planned meals
        if (meals.length > 0) {
          meals.forEach((m) => {
            const kcalMatch = m.title.match(/(\d+)\s*kcal/) || (m.description && m.description.match(/(\d+)\s*kcal/));
            dayCalories += kcalMatch ? parseInt(kcalMatch[1]) : 400;
          });
        } else {
          dayCalories = targetCalories;
        }
      }

      // Cumulate caloric differences
      const calorieDiff = dayCalories - tdee;
      cumulativeKcalDiff += calorieDiff;
      
      const weightForecast = weight + (cumulativeKcalDiff / 7700);

      // Label (e.g. "12 Jun")
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

    return list.slice(14); // Return last 7 days + today + next 7 days (length 15)
  }, [events, loggedMeals, profile]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  return (
    <div className="px-4 md:px-10 max-w-[1280px] mx-auto py-8 page-enter space-y-8">
      {/* ---- Header ---- */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-[32px] font-bold text-on-surface tracking-tight mb-2">
            Calendário de Saúde
          </h2>
          <p className="text-on-surface-variant">
            Planeie e acompanhe os seus treinos, refeições e avaliações físicas.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary-container text-white text-[13px] font-semibold px-5 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md"
        >
          <Plus size={18} />
          Agendar Evento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ---- Left: Interactive Calendar ---- */}
        <div className="lg:col-span-8 bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm">
          {/* Calendar Controller */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-xl font-bold text-on-surface">
              {monthNames[month]} {year}
            </h3>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-2 border rounded-lg hover:bg-surface-container-low transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => changeMonth(1)} className="p-2 border rounded-lg hover:bg-surface-container-low transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
            <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank filler days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="aspect-square bg-surface-container-lowest/20 border border-transparent rounded-lg" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDateString(year, month, day);
              const dayEvents = events.filter((e) => e.dateStr === dateStr);
              const isSelected = activeDateStr === dateStr;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => {
                    setActiveDateStr(dateStr);
                    setSelectedDate(dateStr);
                  }}
                  className={cn(
                    "aspect-square border rounded-lg p-1.5 flex flex-col justify-between cursor-pointer transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-surface-container hover:border-primary/45 hover:bg-surface-container-lowest"
                  )}
                >
                  <span className="text-[13px] font-semibold text-on-surface">{day}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'w-2 h-2 rounded-full',
                          e.type === 'workout'
                            ? 'bg-primary-container'
                            : e.type === 'meal'
                            ? 'bg-alert-gold'
                            : e.type === 'assessment'
                            ? 'bg-medical-green'
                            : 'bg-outline'
                        )}
                        title={e.title}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---- Right: Day Details & Scheduled List ---- */}
        <div className="lg:col-span-4 space-y-6">
          {/* Day List */}
          <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-surface-container">
              <h3 className="font-display text-base font-bold text-on-surface">
                Agenda: {activeDateStr.split('-').reverse().join('/')}
              </h3>
              <button
                onClick={() => {
                  setSelectedDate(activeDateStr);
                  setShowAddForm(true);
                }}
                className="text-[12px] text-primary font-bold hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Agendar
              </button>
            </div>

            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 size={24} className="text-primary animate-spin" />
              </div>
            ) : events.filter((e) => e.dateStr === activeDateStr).length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <CalendarIcon size={32} className="mx-auto text-outline mb-2" />
                <p className="text-sm font-semibold">Nenhum evento para este dia</p>
                <p className="text-xs mt-1">Clique em "Agendar" acima para adicionar.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {events
                  .filter((e) => e.dateStr === activeDateStr)
                  .map((e, idx) => (
                    <div
                      key={e.id || idx}
                      className="p-3 border rounded-xl flex items-start justify-between gap-3 hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            'w-2.5 h-2.5 rounded-full mt-1.5 shrink-0',
                            e.type === 'workout'
                              ? 'bg-primary-container'
                              : e.type === 'meal'
                              ? 'bg-alert-gold'
                              : e.type === 'assessment'
                              ? 'bg-medical-green'
                              : 'bg-outline'
                          )}
                        />
                        <div>
                          <p className="font-semibold text-on-surface text-[14px]">
                            {e.title}
                          </p>
                          <p className="text-on-surface-variant text-xs flex items-center gap-1 mt-1">
                            <Clock size={12} /> às {e.timeStr}
                          </p>
                          {e.description && (
                            <p className="text-on-surface-variant text-[11px] mt-1.5 leading-4 whitespace-pre-line">
                              {e.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(e.id, events.indexOf(e))}
                        className="text-outline hover:text-error transition-colors p-1"
                        title="Apagar Evento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* AI Analysis Tab */}
          <div className="bg-ai-indigo/5 border border-ai-indigo/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-ai-indigo text-[11px] font-bold uppercase tracking-widest">
                <Sparkles size={12} fill="currentColor" />
                Predições e Análise da IA
              </span>
            </div>
            <p className="text-on-surface text-[13px] leading-6">
              Deixe a IA examinar o seu calendário, estimar o seu progresso muscular, calcular fadiga e projetar metas.
            </p>

            <button
              onClick={handleAnalyzeCalendar}
              disabled={aiLoading}
              className="w-full bg-ai-indigo text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {aiLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Sparkles size={14} />
                  Calcular Progresso & Fadiga
                </>
              )}
            </button>

            <button
              onClick={handleProposePlan}
              disabled={proposingPlan}
              className="w-full border-2 border-ai-indigo/20 text-ai-indigo py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:bg-ai-indigo/5 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {proposingPlan ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Sparkles size={14} fill="currentColor" />
                  Propor Refeições e Treino do Dia
                </>
              )}
            </button>

            {aiReport && (
              <div className="space-y-4 pt-3 border-t border-ai-indigo/10 text-xs leading-5 page-enter">
                <div>
                  <p className="font-bold text-ai-indigo mb-0.5">📈 Progressão e Consistência</p>
                  <p className="text-on-surface">{aiReport.progression}</p>
                </div>
                <div>
                  <p className="font-bold text-ai-indigo mb-0.5">🎯 Projeções de Peso</p>
                  <p className="text-on-surface">{aiReport.projection}</p>
                </div>
                <div>
                  <p className="font-bold text-ai-indigo mb-0.5">🔋 Fadiga e Estado Muscular</p>
                  <p className="text-on-surface">{aiReport.state}</p>
                </div>
                <div>
                  <p className="font-bold text-ai-indigo mb-0.5">💡 Recomendações do Coach</p>
                  <p className="text-on-surface italic">{aiReport.recommendation}</p>
                </div>
              </div>
            )}
          </div>

          {/* Recipe Book Section */}
          <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-display text-base font-bold text-on-surface flex items-center gap-2">
              <BookOpen size={18} className="text-primary" />
              Livro de Receitas IA
            </h3>
            <p className="text-on-surface-variant text-xs">
              Receitas saudáveis e práticas recomendadas especificamente para o seu perfil.
            </p>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {filteredRecipes.map((recipe, idx) => (
                <div key={idx} className="p-3 border rounded-xl space-y-2 hover:bg-surface-container-low transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-on-surface text-xs leading-5">
                        {recipe.title}
                      </p>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">
                        {recipe.category} • {recipe.time}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    <strong>Ingredientes:</strong> {recipe.ingredients.slice(0, 70)}...
                  </p>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded font-semibold">
                      {recipe.calories} kcal
                    </span>
                    <button
                      onClick={() => handleScheduleRecipe(recipe)}
                      className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Agendar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                    // Map level to y coordinate (range 0 to 100)
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
                    {/* Index 7 is today */}
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
                    
                    {/* Labels indicating Past vs Forecast */}
                    <text x={40 + (3.5 / 14) * 520} y="195" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">
                      ← HISTÓRICO
                    </text>
                    <text x={40 + (10.5 / 14) * 520} y="195" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">
                      PREVISÃO →
                    </text>
                  </g>

                  {/* Draw Lines */}
                  {/* Fatigue (ATL) - Red */}
                  <path
                    d={fatigueData.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${40 + (idx / 14) * 520} ${170 - (d.atl / 100) * 140}`).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Progress/Fitness (CTL) - Green */}
                  <path
                    d={fatigueData.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${40 + (idx / 14) * 520} ${170 - (d.ctl / 100) * 140}`).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Stress Balance (TSB) - Indigo */}
                  <path
                    // Map TSB [-50, 50] to [0, 100] range for display
                    d={fatigueData.map((d, idx) => {
                      const tsbMapped = Math.max(-50, Math.min(50, d.tsb));
                      const percent = (tsbMapped + 50); // 0 to 100
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
                        {/* Interactive vertical column region */}
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

                        {/* Node dots */}
                        <circle 
                          cx={x} 
                          cy={yAtl} 
                          r={d.isToday ? 5 : 3} 
                          fill={d.isToday ? "#ffffff" : "#ef4444"} 
                          stroke="#ef4444" 
                          strokeWidth={d.isToday ? 2.5 : 1}
                          className="pointer-events-none transition-all duration-150 group-hover:r-5" 
                        />
                        
                        {/* Date label */}
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
              const todayStats = fatigueData[7]; // index 7 is always today
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
                  {/* Status Banner */}
                  <div className={cn("border rounded-xl p-4 space-y-2", statusColorClass)}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", statusBadgeColor)} />
                      Estado Hoje: {statusLabel}
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">{statusDesc}</p>
                  </div>

                  {/* Quantitative Data Panels */}
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

                  {/* Predictions & Projections */}
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
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ---- Add Event Dialog Modal ---- */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 page-enter">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-display text-lg font-bold text-primary">Agendar Novo Evento</h3>
              <button onClick={() => setShowAddForm(false)} className="text-outline hover:text-on-surface p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              {type === 'meal' && loggedMeals.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Importar Refeição do Diário</label>
                  <select
                    onChange={(e) => {
                      const mealId = e.target.value;
                      if (!mealId) return;
                      const selected = loggedMeals.find((m) => m.id === mealId || m.imageUrl === mealId);
                      if (selected) {
                        const mealTypeLabel = selected.mealType === 'breakfast' ? 'Pequeno-almoço' : selected.mealType === 'lunch' ? 'Almoço' : selected.mealType === 'dinner' ? 'Jantar' : 'Snack';
                        const emoji = selected.mealType === 'breakfast' ? '🌅' : selected.mealType === 'lunch' ? '🍽️' : selected.mealType === 'dinner' ? '🌙' : '🍎';
                        setTitle(`${emoji} ${mealTypeLabel} (${selected.calories} kcal)`);
                        setDescription(`Alimentos: ${selected.foods.map(f => `${f.name} (${f.quantity})`).join(', ')}.\nProteína: ${selected.protein}g, Hidratos: ${selected.carbs}g, Gordura: ${selected.fat}g.`);
                      }
                    }}
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Escolher refeição registada --</option>
                    {loggedMeals.map((m, idx) => (
                      <option key={m.id || idx} value={m.id || m.imageUrl}>
                        {m.mealType === 'breakfast' ? '🌅' : m.mealType === 'lunch' ? '🍽️' : m.mealType === 'dinner' ? '🌙' : '🍎'} {m.mealType.toUpperCase()} - {m.foods.map(f => f.name).slice(0, 2).join(', ')} ({m.calories} kcal)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Título</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Treino de Força, Preparação de Refeição..."
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Tipo</label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="workout">🏋️ Treino</option>
                    <option value="meal">🥗 Alimentação</option>
                    <option value="assessment">📏 Avaliação</option>
                    <option value="rest">🛌 Descanso</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Hora</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Data</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Descrição (Opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instruções extra..."
                  rows={2}
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingEvent}
                className="w-full bg-primary-container text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md"
              >
                {savingEvent ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar Agendamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
