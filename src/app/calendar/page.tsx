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
  type: 'workout' | 'meal' | 'water' | 'assessment' | 'rest';
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM
  description?: string;
  completed?: boolean;
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
    },
    {
      title: 'Omolete de Claras com Espinafres e Tomate',
      category: 'Pequeno-almoço',
      time: '12 min',
      calories: 210,
      protein: 24,
      carbs: 6,
      fat: 8,
      ingredients: '1 ovo inteiro, 4 claras de ovo, 50g espinafres, 1 tomate picado, sal e pimenta',
      prep: 'Bater os ovos e as claras. Adicionar os espinafres e tomate na frigideira antiaderente, juntar as claras e cozinhar.',
      tags: ['gluten-free', 'lactose-free']
    },
    {
      title: 'Frango Grelhado com Arroz Basmati e Brócolos',
      category: 'Almoço / Jantar',
      time: '20 min',
      calories: 460,
      protein: 42,
      carbs: 45,
      fat: 8,
      ingredients: '150g peito frango, 150g arroz basmati cozido, 100g brócolos cozidos, especiarias',
      prep: 'Grelhar o peito de frango temperado com ervas e alho. Servir com o arroz quente e brócolos.',
      tags: ['gluten-free', 'lactose-free']
    },
    {
      title: 'Salada de Atum com Grão de Bico e Ovo',
      category: 'Almoço / Jantar',
      time: '10 min',
      calories: 420,
      protein: 34,
      carbs: 38,
      fat: 12,
      ingredients: '1 lata atum natural, 150g grão de bico cozido, 1 ovo cozido, salsa e cebola picadas',
      prep: 'Misturar o atum escorrido com o grão de bico e cebola. Decorar com o ovo cozido às rodelas e salsa.',
      tags: ['gluten-free', 'lactose-free']
    },
    {
      title: 'Panquecas de Aveia e Banana Fit',
      category: 'Pequeno-almoço',
      time: '15 min',
      calories: 310,
      protein: 16,
      carbs: 48,
      fat: 6,
      ingredients: '1 banana madura, 40g aveia moída, 2 claras de ovo, canela a gosto',
      prep: 'Esmagar a banana e misturar com a aveia, as claras e a canela até obter uma massa homogénea. Cozinhar colheradas numa frigideira quente.',
      tags: ['lactose-free']
    },
    {
      title: 'Esparguete Integral com Peru Picado',
      category: 'Almoço / Jantar',
      time: '25 min',
      calories: 480,
      protein: 36,
      carbs: 55,
      fat: 11,
      ingredients: '70g esparguete integral (cru), 120g carne peru picada, molho tomate caseiro, alho',
      prep: 'Cozer o esparguete. Cozinhar a carne com alho e molho de tomate natural. Misturar tudo no final.',
      tags: ['lactose-free']
    },
    {
      title: 'Batido Proteico de Morango e Chia',
      category: 'Snack / Lanche',
      time: '5 min',
      calories: 250,
      protein: 25,
      carbs: 22,
      fat: 4,
      ingredients: '1 scoop whey morango, 150g morangos frescos, 200ml leite de amêndoa, 1 colher sopa sementes chia',
      prep: 'Triturar todos os ingredientes num liquidificador até obter uma textura cremosa. Deixar repousar 2 minutos.',
      tags: ['gluten-free', 'lactose-free']
    },
    {
      title: 'Pescada Cozida com Legumes e Azeite',
      category: 'Almoço / Jantar',
      time: '15 min',
      calories: 330,
      protein: 28,
      carbs: 18,
      fat: 14,
      ingredients: '150g lombo pescada, 1 ovo cozido, 100g cenoura, 100g feijão-verde, 1 colher sobremesa azeite',
      prep: 'Cozer a pescada, o feijão-verde e as cenouras às rodelas. Servir com o ovo cozido e regar com azeite.',
      tags: ['gluten-free', 'lactose-free']
    },
    {
      title: 'Húmus Caseiro com Palitos de Pepino',
      category: 'Snack / Lanche',
      time: '10 min',
      calories: 220,
      protein: 8,
      carbs: 26,
      fat: 9,
      ingredients: '100g grão-de-bico cozido, 1 colher chá tahini, sumo limão, alho, 1 pepino',
      prep: 'Triturar o grão, tahini, sumo de limão e alho até obter um creme. Servir com palitos de pepino.',
      tags: ['vegan', 'gluten-free', 'lactose-free']
    },
    {
      title: 'Papá de Lentilhas com Peru Crocante',
      category: 'Almoço / Jantar',
      time: '25 min',
      calories: 390,
      protein: 32,
      carbs: 42,
      fat: 8,
      ingredients: '80g lentilhas vermelhas, 100g peito peru desfiado grelhado, cebola, alho',
      prep: 'Cozer as lentilhas com cebola e alho até desfazer. Servir quente com o peru desfiado crocante no topo.',
      tags: ['gluten-free', 'lactose-free']
    },
    {
      title: 'Bacalhau Fit ao Vapor com Batata e Grão',
      category: 'Almoço / Jantar',
      time: '20 min',
      calories: 490,
      protein: 41,
      carbs: 45,
      fat: 13,
      ingredients: '150g lombo bacalhau fresco, 100g batata cozida, 100g grão de bico, brócolos, azeite',
      prep: 'Cozinhar o bacalhau e os legumes ao vapor. Servir regado com uma colher de azeite.',
      tags: ['gluten-free', 'lactose-free']
    },
    {
      title: 'Bifes de Peru com Cogumelos e Natas de Soja',
      category: 'Almoço / Jantar',
      time: '18 min',
      calories: 380,
      protein: 38,
      carbs: 12,
      fat: 18,
      ingredients: '150g bifes peru, 100g cogumelos frescos, 70ml natas de soja light, alho',
      prep: 'Grelhar os bifes de peru. Saltear os cogumelos com alho, juntar as natas de soja e envolver a carne.',
      tags: ['gluten-free', 'lactose-free']
    },
    {
      title: 'Iogurte Grego com Granola e Sementes',
      category: 'Snack / Lanche',
      time: '5 min',
      calories: 270,
      protein: 18,
      carbs: 24,
      fat: 11,
      ingredients: '150g iogurte grego natural ligeiro, 30g granola caseira sem açúcar, sementes de abóbora',
      prep: 'Colocar o iogurte numa taça, cobrir com a granola e polvilhar com as sementes de abóbora.',
      tags: ['gluten-free']
    },
    {
      title: 'Wrap Integral de Frango e Abacate',
      category: 'Snack / Lanche',
      time: '10 min',
      calories: 350,
      protein: 28,
      carbs: 26,
      fat: 14,
      ingredients: '1 tortilha integral, 100g frango desfiado, 40g abacate esmagado, alface e tomate',
      prep: 'Barrar a tortilha com o abacate. Rechear com o frango desfiado, alface e fatias de tomate. Enrolar.',
      tags: ['lactose-free']
    },
    {
      title: 'Bolachas de Aveia e Maçã sem Açúcar',
      category: 'Snack / Lanche',
      time: '20 min',
      calories: 180,
      protein: 6,
      carbs: 32,
      fat: 4,
      ingredients: '50g aveia em flocos, 1 maçã ralada, 1 ovo, canela a gosto',
      prep: 'Misturar todos os ingredientes. Formar bolachas num tabuleiro com papel vegetal e levar ao forno 15 min.',
      tags: ['lactose-free']
    },
    {
      title: 'Quiche Fit de Legumes e Atum',
      category: 'Almoço / Jantar',
      time: '30 min',
      calories: 310,
      protein: 34,
      carbs: 12,
      fat: 13,
      ingredients: '2 latas atum natural, 3 ovos, 100g curgete ralada, 50g cenoura ralada, salsa',
      prep: 'Bater os ovos e envolver com o atum, cenoura e curgete. Levar ao forno numa forma de silicone por 25 min.',
      tags: ['gluten-free', 'lactose-free']
    },
    {
      title: 'Sopa de Lentilhas Vermelhas e Coentros',
      category: 'Pequeno-almoço',
      time: '20 min',
      calories: 190,
      protein: 12,
      carbs: 28,
      fat: 3,
      ingredients: '70g lentilhas vermelhas, 100g abóbora, 1 cebola, 1 dente alho, coentros frescos',
      prep: 'Cozer as lentilhas com abóbora, cebola e alho. Triturar e servir com coentros frescos picados por cima.',
      tags: ['vegan', 'gluten-free', 'lactose-free']
    },
    {
      title: 'Caril de Grão-de-Bico com Espinafres',
      category: 'Almoço / Jantar',
      time: '22 min',
      calories: 390,
      protein: 16,
      carbs: 52,
      fat: 12,
      ingredients: '150g grão cozido, 100ml leite coco ligeiro, 50g espinafres, caril em pó, arroz de coco basmati',
      prep: 'Cozinhar o grão no leite de coco com especiarias de caril por 10 min. Juntar espinafres no fim e servir com arroz.',
      tags: ['vegan', 'gluten-free', 'lactose-free']
    },
    {
      title: 'Espetadas de Frango com Pimentos',
      category: 'Almoço / Jantar',
      time: '20 min',
      calories: 340,
      protein: 38,
      carbs: 10,
      fat: 14,
      ingredients: '150g peito frango aos cubos, pimento vermelho e verde, cebola, 1 colher azeite',
      prep: 'Montar as espetadas intercalando frango, pimentos e cebola. Grelhar e regar ligeiramente com azeite.',
      tags: ['gluten-free', 'lactose-free']
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

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'workout' | 'meal' | 'water' | 'assessment' | 'rest'>('workout');
  const [selectedDate, setSelectedDate] = useState('');
  const [time, setTime] = useState('08:00');
  const [description, setDescription] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [mealTab, setMealTab] = useState<'recipes' | 'gallery'>('recipes');

  const dailyCalorieTarget = useMemo(() => {
    if (!profile) return 2000;
    const bmr = calculateBMR(profile.weight, profile.height, profile.age);
    const tdee = calculateTDEE(bmr);
    const goal = profile.goal || 'maintain';
    if (goal === 'lose') return Math.max(1200, Math.round(tdee - 500));
    if (goal === 'gain') return Math.round(tdee + 300);
    return Math.round(tdee);
  }, [profile]);

  const getMealTargetKcal = (category: string, totalGoal: number) => {
    const cat = category.toLowerCase();
    if (cat.includes('pequeno') || cat.includes('pequeno-almoço')) return Math.round(totalGoal * 0.25);
    if (cat.includes('almoço') || cat.includes('jantar')) return Math.round(totalGoal * 0.35);
    return Math.round(totalGoal * 0.10); // Snack / Lanche
  };

  const getScaledRecipe = useCallback((recipe: typeof recipes[0]) => {
    const targetKcal = getMealTargetKcal(recipe.category, dailyCalorieTarget);
    const scale = targetKcal / recipe.calories;
    
    // Scale ingredients weights (e.g. 50g -> 75g)
    const scaledIngredients = recipe.ingredients.replace(/(\d+)\s*(g|ml|scoop)/g, (match, num, unit) => {
      const scaledNum = Math.round(parseFloat(num) * scale);
      return `${scaledNum} ${unit}`;
    });

    return {
      ...recipe,
      calories: targetKcal,
      protein: Math.round(recipe.protein * scale),
      carbs: Math.round(recipe.carbs * scale),
      fat: Math.round(recipe.fat * scale),
      ingredients: scaledIngredients,
      scaleFactor: scale,
    };
  }, [dailyCalorieTarget]);

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
      let mealsData: any = { success: false, data: { meals: [] } };
      try {
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
        mealsData = await mealsRes.json();
      } catch (err) {
        console.error('Error fetching meals suggestion:', err);
      }
      
      // 2. Fetch workout suggestion
      let workoutData: any = { success: false, data: null };
      try {
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
        workoutData = await workoutRes.json();
      } catch (err) {
        console.error('Error fetching workout suggestion:', err);
      }

      const targetDateStr = activeDateStr;
      const newEvents: CalendarEvent[] = [];

      const mealsList = [...(mealsData.success && mealsData.data?.meals ? mealsData.data.meals : [])];
      const typesPresent = mealsList.map(m => m.type.toLowerCase());

      // Complement missing categories to cover 100% of the day's meals
      if (!typesPresent.includes('pequeno-almoço')) {
        const fallback = recipes.find(r => r.category === 'Pequeno-almoço');
        if (fallback) {
          mealsList.push({
            type: 'pequeno-almoço',
            title: fallback.title,
            totalCalories: fallback.calories,
            totalProtein: fallback.protein,
            totalCarbs: fallback.carbs,
            totalFat: fallback.fat,
            items: fallback.ingredients.split(',').map(i => ({ name: i.trim(), quantity: '1 dose' })),
            instructions: fallback.prep
          });
        }
      }

      if (!typesPresent.includes('almoço')) {
        const fallback = recipes.find(r => r.category === 'Almoço / Jantar');
        if (fallback) {
          mealsList.push({
            type: 'almoço',
            title: fallback.title,
            totalCalories: fallback.calories,
            totalProtein: fallback.protein,
            totalCarbs: fallback.carbs,
            totalFat: fallback.fat,
            items: fallback.ingredients.split(',').map(i => ({ name: i.trim(), quantity: '1 dose' })),
            instructions: fallback.prep
          });
        }
      }

      if (!typesPresent.includes('jantar')) {
        const fallback = recipes.filter(r => r.category === 'Almoço / Jantar')[1] || recipes.find(r => r.category === 'Almoço / Jantar');
        if (fallback) {
          mealsList.push({
            type: 'jantar',
            title: fallback.title,
            totalCalories: fallback.calories,
            totalProtein: fallback.protein,
            totalCarbs: fallback.carbs,
            totalFat: fallback.fat,
            items: fallback.ingredients.split(',').map(i => ({ name: i.trim(), quantity: '1 dose' })),
            instructions: fallback.prep
          });
        }
      }

      if (!typesPresent.includes('snack') && !typesPresent.includes('lanche')) {
        const fallback = recipes.find(r => r.category === 'Snack / Lanche');
        if (fallback) {
          mealsList.push({
            type: 'snack',
            title: fallback.title,
            totalCalories: fallback.calories,
            totalProtein: fallback.protein,
            totalCarbs: fallback.carbs,
            totalFat: fallback.fat,
            items: fallback.ingredients.split(',').map(i => ({ name: i.trim(), quantity: '1 dose' })),
            instructions: fallback.prep
          });
        }
      }

      // Propose meals
      mealsList.forEach((meal: any) => {
        const mealTypeEmoji = meal.type === 'pequeno-almoço' ? '🌅' : meal.type === 'almoço' ? '🍽️' : meal.type === 'jantar' ? '🌙' : '🍎';
        const time = meal.type === 'pequeno-almoço' ? '08:00' : meal.type === 'almoço' ? '13:00' : meal.type === 'jantar' ? '20:00' : '17:00';
        
        const targetKcal = getMealTargetKcal(meal.type, dailyCalorieTarget);
        const scale = targetKcal / meal.totalCalories;
        const scaledCalories = targetKcal;
        const scaledProtein = Math.round(meal.totalProtein * scale);
        const scaledCarbs = Math.round(meal.totalCarbs * scale);
        const scaledFat = Math.round(meal.totalFat * scale);
        const scaledItems = meal.items.map((item: any) => {
          const quantityStr = item.quantity || '';
          const scaledQuantity = quantityStr.replace(/(\d+)\s*(g|ml|scoop)/g, (match: string, num: string, unit: string) => {
            const scaledNum = Math.round(parseFloat(num) * scale);
            return `${scaledNum} ${unit}`;
          });
          return { ...item, quantity: scaledQuantity };
        });

        newEvents.push({
          title: `${mealTypeEmoji} Proposto: ${meal.title} (${scaledCalories} kcal)`,
          type: 'meal',
          dateStr: targetDateStr,
          timeStr: time,
          description: `Alimentos: ${scaledItems.map((i: any) => `${i.name} (${i.quantity})`).join(', ')}.\nMacros: ${scaledCalories} kcal, P: ${scaledProtein}g, C: ${scaledCarbs}g, G: ${scaledFat}g\nPrep: ${meal.instructions}`,
          completed: false
        });
      });

      // Propose water automatically (4 events of 500ml = 2.0L total)
      const waterTimes = ['09:00', '12:00', '15:00', '18:00'];
      waterTimes.forEach(time => {
        newEvents.push({
          title: '💧 Água: 500 ml',
          type: 'water',
          dateStr: targetDateStr,
          timeStr: time,
          description: 'Consumo de água proposto automaticamente.',
          completed: false
        });
      });

      if (workoutData.success && workoutData.data?.workout) {
        newEvents.push({
          title: `🏋️ Proposto: Treino ${workoutData.data.workout.name || 'Personalizado'}`,
          type: 'workout',
          dateStr: targetDateStr,
          timeStr: '18:30',
          description: `Exercícios:\n${workoutData.data.workout.exercises.map((e: any) => `- ${e.name}: ${e.sets} séries x ${e.reps} (${e.rest} rest)`).join('\n')}`,
          completed: false
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

  const handleToggleEventCompleted = async (event: CalendarEvent, localIndex: number) => {
    const updatedCompleted = !event.completed;
    
    // Update local state
    const updatedEvents = events.map((e, idx) => {
      if (idx === localIndex || (e.id && e.id === event.id)) {
        return { ...e, completed: updatedCompleted };
      }
      return e;
    });
    setEvents(updatedEvents);

    if (isDemo || !firebaseUser) {
      localStorage.setItem('demo_events', JSON.stringify(updatedEvents));
    } else {
      try {
        const { getFirebaseDb } = await import('@/lib/firebase');
        const { doc, updateDoc } = await import('firebase/firestore');
        const db = getFirebaseDb();
        if (event.id) {
          await updateDoc(doc(db, 'events', event.id), {
            completed: updatedCompleted,
          });
        }
      } catch (err) {
        console.error('Erro ao atualizar estado do evento:', err);
      }
    }
  };

  const getScaledGalleryMeal = useCallback((meal: Meal) => {
    // Detect category to get target
    const targetKcal = getMealTargetKcal(
      meal.mealType === 'breakfast' ? 'Pequeno-almoço' : meal.mealType === 'lunch' || meal.mealType === 'dinner' ? 'Almoço / Jantar' : 'Snack / Lanche',
      dailyCalorieTarget
    );
    const scale = targetKcal / (meal.calories || 400);

    // Scale foods quantity
    const scaledFoods = meal.foods.map((food) => {
      const quantityStr = food.quantity;
      const scaledQuantity = quantityStr.replace(/(\d+)\s*(g|ml|scoop)/g, (match, num, unit) => {
        const scaledNum = Math.round(parseFloat(num) * scale);
        return `${scaledNum} ${unit}`;
      });
      return { ...food, quantity: scaledQuantity };
    });

    return {
      ...meal,
      calories: targetKcal,
      protein: Math.round(meal.protein * scale),
      carbs: Math.round(meal.carbs * scale),
      fat: Math.round(meal.fat * scale),
      foods: scaledFoods,
    };
  }, [dailyCalorieTarget]);

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
          onClick={() => {
            setSelectedDate(activeDateStr);
            setType('meal');
            setShowAddForm(true);
          }}
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

              // Calorie percentage calculation
              let dayMealsKcal = 0;
              dayEvents.filter(e => e.type === 'meal' && e.completed).forEach(m => {
                const kcalMatch = m.title.match(/(\d+)\s*kcal/) || (m.description && m.description.match(/(\d+)\s*kcal/));
                dayMealsKcal += kcalMatch ? parseInt(kcalMatch[1]) : 400;
              });
              const calPercent = Math.min(100, Math.round((dayMealsKcal / dailyCalorieTarget) * 100));

              // Water consumption sum
              let dayWaterMl = 0;
              dayEvents.filter(e => e.type === 'water').forEach(w => {
                const mlMatch = w.title.match(/(\d+)\s*(ml|l|L)/) || (w.description && w.description.match(/(\d+)\s*(ml|l|L)/));
                if (mlMatch) {
                  const num = parseFloat(mlMatch[1]);
                  const unit = mlMatch[2].toLowerCase();
                  if (unit === 'l') {
                    dayWaterMl += num * 1000;
                  } else {
                    dayWaterMl += num;
                  }
                } else {
                  dayWaterMl += 250; // default 250 ml
                }
              });

              // Workouts filter
              const dayWorkouts = dayEvents.filter(e => e.type === 'workout');

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => {
                    setActiveDateStr(dateStr);
                    setSelectedDate(dateStr);
                    setType('meal');
                    setShowAddForm(true);
                  }}
                  className={cn(
                    "min-h-[85px] aspect-square border rounded-lg p-1.5 flex flex-col justify-between cursor-pointer transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-surface-container hover:border-primary/45 hover:bg-surface-container-lowest"
                  )}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[12px] font-bold text-on-surface">{day}</span>
                    {dayEvents.some(e => e.type === 'meal') && (
                      <span className={cn(
                        "text-[9px] px-1 py-0.25 rounded-full font-bold",
                        calPercent >= 90 && calPercent <= 110 
                          ? "bg-medical-green/10 text-medical-green" 
                          : "bg-alert-gold/10 text-alert-gold"
                      )}>
                        {calPercent}%
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-0.5 mt-1 text-[9px] font-medium w-full">
                    {dayWorkouts.length > 0 && (
                      <div className="flex items-center gap-0.5 text-primary bg-primary/5 rounded px-1 py-0.5 truncate" title={dayWorkouts[0].title}>
                        <span>🏋️</span>
                        <span className="truncate">{dayWorkouts[0].title.replace(/🏋️\s*Proposto:\s*|🏋️\s*/, '')}</span>
                      </div>
                    )}
                    {dayWaterMl > 0 && (
                      <div className="flex items-center gap-0.5 text-blue-500 bg-blue-500/5 rounded px-1 py-0.5">
                        <span>💧</span>
                        <span>{(dayWaterMl / 1000).toFixed(1)}L</span>
                      </div>
                    )}
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
                  setType('meal');
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
                      <div className="flex gap-3 items-start flex-1 cursor-pointer" onClick={() => handleToggleEventCompleted(e, events.indexOf(e))}>
                        <button
                          type="button"
                          className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                            e.completed
                              ? "bg-medical-green border-medical-green text-white"
                              : "border-outline hover:border-primary"
                          )}
                        >
                          {e.completed && <Check size={12} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-semibold text-[14px]",
                            e.completed ? "text-on-surface-variant/50 line-through" : "text-on-surface"
                          )}>
                            {e.title}
                          </p>
                          <p className="text-on-surface-variant text-xs flex items-center gap-1 mt-1">
                            <Clock size={12} /> às {e.timeStr}
                          </p>
                          {e.description && (
                            <p className={cn(
                              "text-[11px] mt-1.5 leading-4 whitespace-pre-line",
                              e.completed ? "text-on-surface-variant/40" : "text-on-surface-variant"
                            )}>
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
        </div>
      </div>

      {/* ---- Add Event Dialog Modal ---- */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={cn("bg-white border rounded-2xl w-full p-6 shadow-2xl space-y-4 page-enter transition-all duration-300", (type === 'meal' || type === 'water') ? 'max-w-4xl' : 'max-w-md')}>
            <div className="flex justify-between items-center pb-2 border-b w-full">
              <h3 className="font-display text-lg font-bold text-primary">Agendar Novo Evento</h3>
              <button onClick={() => setShowAddForm(false)} className="text-outline hover:text-on-surface p-1">
                <X size={18} />
              </button>
            </div>

            <div className={cn("grid gap-6", (type === 'meal' || type === 'water') ? 'grid-cols-1 md:grid-cols-12' : 'grid-cols-1')}>
              {/* Form Column */}
              <form onSubmit={handleAddEvent} className={cn("space-y-4", (type === 'meal' || type === 'water') ? 'md:col-span-5' : 'w-full')}>
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
                      <option value="water">💧 Água</option>
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Descrição (Opcional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Instruções ou ingredientes..."
                    rows={(type === 'meal' || type === 'water') ? 4 : 2}
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

              {/* Selector Column (Meal or Water types) */}
              {(type === 'meal' || type === 'water') && (
                <div className="md:col-span-7 flex flex-col h-[420px] border-t md:border-t-0 md:border-l border-outline-variant/30 md:pl-6 pt-4 md:pt-0">
                  {type === 'meal' && (
                    <>
                      {/* AI Auto Suggestion Button */}
                      <button
                        type="button"
                        onClick={handleProposePlan}
                        disabled={proposingPlan}
                        className="mb-4 bg-primary-container text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-sm shrink-0"
                      >
                        {proposingPlan ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            A gerar refeições e treino do dia...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            Criar Automaticamente Refeições e Treino com IA
                          </>
                        )}
                      </button>

                      {/* Selector Tabs */}
                      <div className="flex border-b border-surface-container pb-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setMealTab('recipes')}
                          className={cn(
                            "flex-1 pb-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all",
                            mealTab === 'recipes' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
                          )}
                        >
                          📖 Livro de Receitas ({filteredRecipes.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMealTab('gallery')}
                          className={cn(
                            "flex-1 pb-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all",
                            mealTab === 'gallery' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
                          )}
                        >
                          📸 Galeria de Fotos ({loggedMeals.length})
                        </button>
                      </div>

                      {mealTab === 'recipes' && (
                        <div className="flex flex-col flex-1 min-h-0 space-y-3">
                          {/* Search Recipes */}
                          <input
                            type="text"
                            placeholder="Pesquisar receita..."
                            value={recipeSearch}
                            onChange={(e) => setRecipeSearch(e.target.value)}
                            className="bg-surface-container-low border-none rounded-xl p-2.5 text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary w-full"
                          />

                          {/* Recipe List */}
                          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {filteredRecipes
                              .filter(r => r.title.toLowerCase().includes(recipeSearch.toLowerCase()))
                              .map((recipe, idx) => {
                                const scaled = getScaledRecipe(recipe);
                                return (
                                  <div
                                    key={idx}
                                    className="p-3 border border-outline-variant/20 rounded-xl space-y-1 bg-surface-container-lowest hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer"
                                    onClick={() => {
                                      setTitle(`🥗 Receita: ${scaled.title}`);
                                      setDescription(`Ingredientes: ${scaled.ingredients}\nMacros: ${scaled.calories} kcal, P: ${scaled.protein}g, C: ${scaled.carbs}g, G: ${scaled.fat}g\nPreparo: ${scaled.prep}`);
                                    }}
                                  >
                                    <div className="flex justify-between items-start">
                                      <p className="font-semibold text-on-surface text-xs leading-5">{scaled.title}</p>
                                      <span className="text-[10px] bg-primary/5 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">{scaled.calories} kcal</span>
                                    </div>
                                    <p className="text-[10px] text-on-surface-variant font-medium">{scaled.category} • Prep: {scaled.time}</p>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {mealTab === 'gallery' && (
                        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                          {loggedMeals.length === 0 ? (
                            <div className="text-center py-12 text-on-surface-variant text-xs">
                              Nenhuma refeição encontrada na sua galeria do diário.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              {loggedMeals.map((meal, idx) => {
                                const scaled = getScaledGalleryMeal(meal);
                                return (
                                  <div
                                    key={meal.id || idx}
                                    className="border border-outline-variant/20 rounded-xl p-2 bg-surface-container-lowest hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer flex flex-col gap-2"
                                    onClick={() => {
                                      const mealTypeLabel = meal.mealType === 'breakfast' ? 'Pequeno-almoço' : meal.mealType === 'lunch' ? 'Almoço' : meal.mealType === 'dinner' ? 'Jantar' : 'Snack';
                                      setTitle(`🍽️ Galeria: ${mealTypeLabel} (${scaled.calories} kcal)`);
                                      setDescription(`Alimentos: ${scaled.foods.map((f: any) => `${f.name} (${f.quantity})`).join(', ')}.\nProteína: ${scaled.protein}g, Hidratos: ${scaled.carbs}g, Gordura: ${scaled.fat}g.`);
                                    }}
                                  >
                                    {meal.imageUrl ? (
                                      <img
                                        src={meal.imageUrl}
                                        alt="Refeição"
                                        className="w-full h-24 object-cover rounded-lg"
                                      />
                                    ) : (
                                      <div className="w-full h-24 bg-surface-container-low flex items-center justify-center rounded-lg text-on-surface-variant">
                                        <Utensils size={24} />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-bold text-[11px] text-on-surface capitalize leading-tight">
                                        {meal.mealType === 'breakfast' ? '🌅 P. Almoço' : meal.mealType === 'lunch' ? '🍽️ Almoço' : meal.mealType === 'dinner' ? '🌙 Jantar' : '🍎 Snack'}
                                      </p>
                                      <p className="text-[10px] text-primary font-bold mt-0.5">{scaled.calories} kcal</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {type === 'water' && (
                    <div className="flex flex-col flex-1 min-h-0 space-y-3">
                      <h4 className="font-display text-sm font-bold text-primary mb-1">Registos Rápidos de Água</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { title: 'Copo de Água', amount: '250 ml', icon: '🥛' },
                          { title: 'Garrafa Pequena', amount: '500 ml', icon: '🧴' },
                          { title: 'Garrafa Média', amount: '750 ml', icon: '🥤' },
                          { title: 'Garrafa Grande', amount: '1.5 L', icon: '🍶' },
                        ].map((preset, idx) => (
                          <div
                            key={idx}
                            className="p-3 border border-outline-variant/20 rounded-xl flex items-center gap-3 bg-surface-container-lowest hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer"
                            onClick={() => {
                              setTitle(`💧 Água: ${preset.amount}`);
                              setDescription(`Consumo de água registado: ${preset.amount}.`);
                            }}
                          >
                            <span className="text-2xl">{preset.icon}</span>
                            <div>
                              <p className="font-bold text-xs text-on-surface">{preset.title}</p>
                              <p className="text-[10px] text-primary font-bold">{preset.amount}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
