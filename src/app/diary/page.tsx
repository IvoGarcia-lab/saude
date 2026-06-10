'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, Upload, Check, Pencil, X, Loader2, Utensils, Trash2 } from 'lucide-react';
import { CoachInsight } from '@/components/dashboard/CoachInsight';
import { useAuth } from '@/components/auth/AuthProvider';
import { mockMeals } from '@/lib/mock-data';
import type { NutritionAnalysis, Meal } from '@/lib/types';
import { cn } from '@/lib/utils';

type DiaryState = 'upload' | 'analyzing' | 'result' | 'history';

export default function DiaryPage() {
  const { profile, user: firebaseUser, isDemo } = useAuth();
  const [state, setState] = useState<DiaryState>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch user's meals from Firestore on load
  const fetchMeals = useCallback(async () => {
    if (isDemo || !firebaseUser) {
      setMeals(mockMeals);
      return;
    }
    setLoadingHistory(true);
    try {
      const { getFirebaseDb } = await import('@/lib/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const db = getFirebaseDb();
      const q = query(
        collection(db, 'meals'),
        where('userId', '==', firebaseUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const loadedMeals: Meal[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedMeals.push({
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
      loadedMeals.sort((a, b) => b.date.getTime() - a.date.getTime());
      setMeals(loadedMeals.length > 0 ? loadedMeals : mockMeals);
    } catch (err) {
      console.error('Erro ao carregar refeições:', err);
      setMeals(mockMeals);
    } finally {
      setLoadingHistory(false);
    }
  }, [firebaseUser, isDemo]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  // 2. Handle image analysis and upload
  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setState('analyzing');
      setUploadingImage(true);

      let storageUrl = '';

      // Upload to Firebase Storage if not in demo mode
      if (!isDemo && firebaseUser) {
        try {
          const { getFirebaseStorage } = await import('@/lib/firebase');
          const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
          const storage = getFirebaseStorage();
          const imageRef = ref(storage, `meals/${firebaseUser.uid}/${Date.now()}_${file.name}`);
          
          const uploadPromise = uploadBytes(imageRef, file).then(async (snapshot) => {
            return await getDownloadURL(snapshot.ref);
          });
          
          const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('Firebase Storage upload timeout')), 4000)
          );
          
          storageUrl = await Promise.race([uploadPromise, timeoutPromise]);
          setSavedImageUrl(storageUrl);
        } catch (err) {
          console.error('Erro ou timeout no upload para o Storage, usando local preview:', err);
          setSavedImageUrl(localUrl);
        }
      } else {
        setSavedImageUrl(localUrl);
      }
      setUploadingImage(false);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          const res = await fetch('/api/analyze-meal', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64data }),
          });
          const data = await res.json();
          if (data.success && data.data) {
            setAnalysis(data.data);
            setState('result');
          } else {
            throw new Error(data.error || 'Falha na análise');
          }
        } catch (err) {
          console.error(err);
          // Fallback to static mock if offline or failed
          setAnalysis({
            foods: [
              { name: 'Peito de frango grelhado', quantity: '150g' },
              { name: 'Arroz integral', quantity: '100g' },
              { name: 'Brócolos cozidos', quantity: '80g' },
            ],
            calories: 450,
            protein: 42,
            carbs: 55,
            fat: 8,
            feedback: 'Ótima fonte de proteína magra! Boa escolha de carboidratos complexos.',
          });
          setState('result');
        }
      };
    },
    [firebaseUser, isDemo]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // 3. Confirm and save meal log
  const handleConfirm = async () => {
    if (!analysis) return;

    // Detect meal type based on hour
    const hour = new Date().getHours();
    const mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' =
      hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : hour < 20 ? 'dinner' : 'snack';

    const newMeal = {
      userId: firebaseUser?.uid || 'demo-user-001',
      imageUrl: savedImageUrl || preview || '',
      foods: analysis.foods,
      calories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fat: analysis.fat,
      feedback: analysis.feedback,
      date: new Date(),
      confirmed: true,
      mealType,
    };

    // Construct calendar event
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const timeStr = String(today.getHours()).padStart(2, '0') + ':' + String(today.getMinutes()).padStart(2, '0');

    const mealTypeEmoji = mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '🍽️' : mealType === 'dinner' ? '🌙' : '🍎';
    const mealTypeLabel = mealType === 'breakfast' ? 'Pequeno-almoço' : mealType === 'lunch' ? 'Almoço' : mealType === 'dinner' ? 'Jantar' : 'Snack';

    const calendarEvent = {
      userId: firebaseUser?.uid || 'demo-user-001',
      title: `${mealTypeEmoji} ${mealTypeLabel} (${analysis.calories} kcal)`,
      type: 'meal',
      dateStr,
      timeStr,
      description: `Alimentos: ${analysis.foods.map(f => `${f.name} (${f.quantity})`).join(', ')}. Proteína: ${analysis.protein}g, Hidratos: ${analysis.carbs}g, Gordura: ${analysis.fat}g.`,
      createdAt: new Date(),
    };

    if (isDemo || !firebaseUser) {
      // Save to local storage events
      const local = localStorage.getItem('demo_events');
      const currentEvents = local ? JSON.parse(local) : [];
      const updatedEvents = [...currentEvents, calendarEvent];
      localStorage.setItem('demo_events', JSON.stringify(updatedEvents));
    } else {
      try {
        const { getFirebaseDb } = await import('@/lib/firebase');
        const { collection, addDoc } = await import('firebase/firestore');
        const db = getFirebaseDb();
        
        // Save to meals collection
        await addDoc(collection(db, 'meals'), newMeal);
        // Save to events collection
        await addDoc(collection(db, 'events'), calendarEvent);
      } catch (err) {
        console.error('Erro ao guardar refeição/evento no Firebase:', err);
      }
    }

    await fetchMeals();
    setState('history');
  };

  const handleDeleteMeal = async (mealId?: string, localIndex?: number) => {
    if (isDemo || !firebaseUser) {
      const updated = meals.filter((_, idx) => idx !== localIndex);
      setMeals(updated);
      return;
    }

    if (!mealId) return;
    try {
      const { getFirebaseDb } = await import('@/lib/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'meals', mealId));
      await fetchMeals();
    } catch (err) {
      console.error('Erro ao apagar refeição:', err);
    }
  };

  const resetUpload = () => {
    setState('upload');
    setPreview(null);
    setAnalysis(null);
    setSavedImageUrl('');
  };

  return (
    <div className="px-4 md:px-10 max-w-[1280px] mx-auto py-8 page-enter">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-primary mb-2">
            Registo de Refeição
          </h2>
          <p className="text-on-surface-variant text-sm">
            Capture o seu prato e deixe a nossa IA calcular os seus macros instantaneamente.
          </p>
        </div>
      </div>

      {/* ---- Tab Navigation ---- */}
      <div className="flex border-b border-outline-variant/30 mb-8 gap-6">
        <button
          onClick={() => setState('upload')}
          className={cn(
            'pb-3 text-sm font-semibold border-b-2 transition-all',
            state === 'upload' || state === 'analyzing' || state === 'result'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          )}
        >
          Registar Nova Refeição
        </button>
        <button
          onClick={() => setState('history')}
          className={cn(
            'pb-3 text-sm font-semibold border-b-2 transition-all',
            state === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          )}
        >
          Histórico de Refeições
        </button>
      </div>

      {/* ---- Upload Zone ---- */}
      {state === 'upload' && (
        <div
          className={cn(
            'border-2 border-dashed rounded-2xl p-12 md:p-20 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 max-w-2xl mx-auto',
            dragActive
              ? 'border-primary bg-primary/5 dropzone-active'
              : 'border-outline-variant/50 hover:border-primary/40 hover:bg-surface-container-low'
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="bg-primary-container text-white p-4 rounded-full mb-6">
            <Camera size={28} />
          </div>
          <h3 className="font-display text-xl font-semibold text-primary mb-2">
            Carregar Fotografia
          </h3>
          <p className="text-on-surface-variant text-sm">
            Toque para selecionar ou arraste o seu prato
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {/* ---- Analyzing State ---- */}
      {state === 'analyzing' && (
        <div className="max-w-2xl mx-auto">
          {preview && (
            <div className="rounded-2xl overflow-hidden mb-6 aspect-video relative">
              <img
                src={preview}
                alt="Refeição em análise"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 flex flex-col items-center gap-4 ambient-shadow">
                  <Loader2 size={40} className="text-primary animate-spin" />
                  <p className="font-display text-lg font-semibold text-primary">
                    {uploadingImage ? 'A carregar foto para a nuvem...' : 'A analisar a refeição...'}
                  </p>
                  <p className="text-on-surface-variant text-sm">
                    A IA está a processar os dados nutricionais
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- Result State ---- */}
      {state === 'result' && analysis && (
        <div className="max-w-2xl mx-auto space-y-6">
          {preview && (
            <div className="rounded-2xl overflow-hidden aspect-video">
              <img src={preview} alt="Refeição analisada" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Identified Foods */}
          <div className="bg-white border border-outline-variant/30 rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-on-surface mb-4">
              Alimentos Identificados
            </h3>
            <div className="space-y-3">
              {analysis.foods.map((food, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-surface-container last:border-0"
                >
                  <span className="text-on-surface">{food.name}</span>
                  <span className="text-on-surface-variant text-sm font-semibold">
                    {food.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Macro Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Calorias', value: `${analysis.calories}`, unit: 'kcal', color: 'text-primary' },
              { label: 'Proteína', value: `${analysis.protein}`, unit: 'g', color: 'text-ai-indigo' },
              { label: 'Carbos', value: `${analysis.carbs}`, unit: 'g', color: 'text-alert-gold' },
              { label: 'Gordura', value: `${analysis.fat}`, unit: 'g', color: 'text-primary-container' },
            ].map((m, i) => (
              <div
                key={i}
                className="bg-white border border-outline-variant/30 rounded-xl p-4 text-center"
              >
                <p className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase mb-1">
                  {m.label}
                </p>
                <p className={cn('font-display text-2xl font-light', m.color)}>
                  {m.value}
                  <span className="text-xs text-on-surface-variant ml-0.5">{m.unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Feedback */}
          <CoachInsight message={analysis.feedback} />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 bg-primary-container text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Check size={18} />
              Confirmar
            </button>
            <button
              onClick={resetUpload}
              className="flex-1 border-2 border-primary/10 text-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
            >
              <Pencil size={18} />
              Editar
            </button>
            <button
              onClick={resetUpload}
              className="px-4 border-2 border-error/10 text-error py-3.5 rounded-xl hover:bg-error/5 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ---- History ---- */}
      {state === 'history' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-medical-green/10 border border-medical-green/20 rounded-xl p-4 flex items-center gap-3">
            <Check size={20} className="text-medical-green" />
            <p className="text-on-surface font-semibold text-sm">
              Refeição registada com sucesso!
            </p>
          </div>

          <h3 className="font-display text-lg font-semibold text-on-surface">
            Histórico de Refeições
          </h3>

          {loadingHistory ? (
            <div className="py-10 flex justify-center">
              <Loader2 size={24} className="text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal)}
                  className="bg-white border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-primary/40 hover:bg-surface-container-lowest transition-all"
                >
                  <div className="flex items-center gap-3">
                    {meal.imageUrl && !meal.imageUrl.startsWith('blob:') ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border">
                        <img src={meal.imageUrl} alt="Refeição" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="bg-secondary-container/30 p-2 rounded-lg">
                        <Utensils size={18} className="text-on-secondary-container" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-on-surface text-[15px] capitalize">
                        {meal.mealType === 'breakfast'
                          ? '🌅 Pequeno-almoço'
                          : meal.mealType === 'lunch'
                          ? '🍽️ Almoço'
                          : meal.mealType === 'dinner'
                          ? '🌙 Jantar'
                          : '🍎 Snack'}
                      </p>
                      <p className="text-on-surface-variant text-sm max-w-[280px] truncate">
                        {meal.foods.map((f) => f.name).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-display text-lg font-semibold text-primary">
                        {meal.calories}
                      </p>
                      <p className="text-xs text-on-surface-variant">kcal</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMeal(meal.id, meals.indexOf(meal));
                      }}
                      className="text-outline hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error/5"
                      title="Apagar Refeição"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={resetUpload}
            className="w-full bg-primary-container text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Camera size={18} />
            Adicionar Outra Refeição
          </button>
        </div>
      )}

      {/* ---- Meal Details Modal ---- */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 page-enter relative">
            <button
              onClick={() => setSelectedMeal(null)}
              className="absolute top-4 right-4 text-outline hover:text-on-surface p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 pb-2 border-b">
              <span className="text-2xl">
                {selectedMeal.mealType === 'breakfast' ? '🌅' : selectedMeal.mealType === 'lunch' ? '🍽️' : selectedMeal.mealType === 'dinner' ? '🌙' : '🍎'}
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-primary capitalize">
                  {selectedMeal.mealType === 'breakfast' ? 'Pequeno-almoço' : selectedMeal.mealType === 'lunch' ? 'Almoço' : selectedMeal.mealType === 'dinner' ? 'Jantar' : 'Snack'}
                </h3>
                <p className="text-on-surface-variant text-xs font-semibold">
                  {selectedMeal.date.toLocaleDateString('pt-PT')}
                </p>
              </div>
            </div>

            {selectedMeal.imageUrl && !selectedMeal.imageUrl.startsWith('blob:') ? (
              <div className="rounded-xl overflow-hidden aspect-video w-full border">
                <img src={selectedMeal.imageUrl} alt="Refeição" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="bg-primary/5 rounded-xl aspect-video w-full flex flex-col items-center justify-center gap-2 border border-dashed border-primary/20">
                <Utensils size={36} className="text-primary" />
                <p className="text-xs text-on-surface-variant font-semibold">Sem foto disponível</p>
              </div>
            )}

            <div className="bg-surface-container-low p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Alimentos Registados</h4>
              <div className="space-y-1">
                {selectedMeal.foods.map((food, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-on-surface">{food.name}</span>
                    <span className="text-on-surface-variant font-semibold">{food.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Macro Summary Grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Calorias', value: `${selectedMeal.calories}`, unit: 'kcal', color: 'text-primary' },
                { label: 'Proteína', value: `${selectedMeal.protein}`, unit: 'g', color: 'text-ai-indigo' },
                { label: 'Carbos', value: `${selectedMeal.carbs}`, unit: 'g', color: 'text-alert-gold' },
                { label: 'Gordura', value: `${selectedMeal.fat}`, unit: 'g', color: 'text-primary-container' },
              ].map((m, i) => (
                <div key={i} className="bg-white border border-outline-variant/30 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase mb-0.5">{m.label}</p>
                  <p className={cn('font-display text-lg font-light', m.color)}>
                    {m.value}
                    <span className="text-[10px] text-on-surface-variant ml-0.5">{m.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            {selectedMeal.feedback && (
              <div className="pt-2">
                <CoachInsight message={selectedMeal.feedback} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
