'use client';

import { useState, useCallback, useRef } from 'react';
import { Camera, Upload, Check, Pencil, X, Loader2 } from 'lucide-react';
import { CoachInsight } from '@/components/dashboard/CoachInsight';
import { mockMeals } from '@/lib/mock-data';
import type { NutritionAnalysis } from '@/lib/types';
import { cn } from '@/lib/utils';

const mockAnalysis: NutritionAnalysis = {
  foods: [
    { name: 'Peito de frango grelhado', quantity: '150g' },
    { name: 'Arroz integral', quantity: '100g' },
    { name: 'Brócolos cozidos', quantity: '80g' },
  ],
  calories: 450,
  protein: 42,
  carbs: 55,
  fat: 8,
  feedback:
    'Ótima fonte de proteína magra! Boa escolha de carboidratos complexos. Considere adicionar azeite para gorduras saudáveis.',
};

type DiaryState = 'upload' | 'analyzing' | 'result' | 'history';

export default function DiaryPage() {
  const [state, setState] = useState<DiaryState>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setState('analyzing');

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
        setAnalysis(mockAnalysis);
        setState('result');
      }
    };
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleConfirm = () => {
    setState('history');
  };

  const resetUpload = () => {
    setState('upload');
    setPreview(null);
    setAnalysis(null);
  };

  return (
    <div className="px-4 md:px-10 max-w-[1280px] mx-auto py-8 page-enter">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold text-primary mb-2">
          Registo de Refeição
        </h2>
        <p className="text-on-surface-variant">
          Capture o seu prato e deixe a nossa IA calcular os seus macros instantaneamente.
        </p>
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
                    A analisar a sua refeição...
                  </p>
                  <p className="text-on-surface-variant text-sm">
                    A IA está a identificar os alimentos
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
            Refeições de Hoje
          </h3>

          {mockMeals.map((meal) => (
            <div
              key={meal.id}
              className="bg-white border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between"
            >
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
                <p className="text-on-surface-variant text-sm">
                  {meal.foods.map((f) => f.name).join(', ')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-semibold text-primary">
                  {meal.calories}
                </p>
                <p className="text-xs text-on-surface-variant">kcal</p>
              </div>
            </div>
          ))}

          <button
            onClick={resetUpload}
            className="w-full bg-primary-container text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Camera size={18} />
            Adicionar Outra Refeição
          </button>
        </div>
      )}
    </div>
  );
}
