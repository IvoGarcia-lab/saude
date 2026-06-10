'use client';

import { useState } from 'react';
import { Sparkles, Info, TrendingDown, Scale, TrendingUp, Check, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const restrictions = ['Vegan', 'Lactose', 'Glúten', 'Keto', 'Paleo', 'Frutos do Mar'];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    restrictions: [] as string[],
    medication: '',
    goal: '' as '' | 'lose' | 'maintain' | 'gain',
  });

  const totalSteps = 4;

  const goNext = () => {
    if (step < totalSteps) setStep((s) => s + 1);
    else window.location.href = '/dashboard';
  };
  const goPrev = () => step > 1 && setStep((s) => s - 1);

  const toggleRestriction = (r: string) => {
    setFormData((d) => ({
      ...d,
      restrictions: d.restrictions.includes(r)
        ? d.restrictions.filter((x) => x !== r)
        : [...d.restrictions, r],
    }));
  };

  const selectGoal = (g: 'lose' | 'maintain' | 'gain') => {
    setFormData((d) => ({ ...d, goal: g }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-10 relative overflow-hidden bg-surface">
      {/* Background decorative */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-bl from-primary-container/40 via-transparent to-transparent" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Onboarding Card */}
        <div className="glass-panel border border-outline-variant/30 rounded-xl p-8 md:p-12 ambient-shadow">
          {/* Progress Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-xl font-semibold text-primary">
                O Meu Coach Inteligente
              </span>
              <span className="text-[13px] font-semibold text-on-surface-variant tracking-wide">
                Passo {step} de {totalSteps}
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 ease-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="min-h-[320px]">
            {/* Step 1: Biometrics */}
            {step === 1 && (
              <div className="step-enter">
                <h1 className="font-display text-[28px] md:text-[36px] font-bold leading-tight text-on-surface mb-3">
                  Bem-vindo à sua jornada de saúde.
                </h1>
                <p className="text-on-surface-variant text-lg mb-8">
                  Para personalizar o seu plano de inteligência, precisamos de conhecer a sua base biométrica.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    { label: 'Idade', placeholder: 'Anos', key: 'age' as const },
                    { label: 'Peso (kg)', placeholder: '00.0', key: 'weight' as const },
                    { label: 'Altura (cm)', placeholder: '000', key: 'height' as const },
                  ].map((field) => (
                    <div key={field.key} className="flex flex-col gap-2">
                      <label className="text-[13px] font-semibold text-on-surface-variant tracking-wide">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        placeholder={field.placeholder}
                        value={formData[field.key]}
                        onChange={(e) =>
                          setFormData((d) => ({ ...d, [field.key]: e.target.value }))
                        }
                        className="bg-surface-container-low border-none rounded-lg p-4 text-primary font-medium focus:ring-2 focus:ring-primary outline-none transition-shadow"
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-secondary-container/20 p-5 rounded-xl flex gap-3 items-start">
                  <Info size={20} className="text-secondary shrink-0 mt-0.5" />
                  <p className="text-on-secondary-container text-[14px] leading-6">
                    Estes dados permitem ao nosso algoritmo clínico calcular a sua Taxa Metabólica Basal com precisão.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Restrictions */}
            {step === 2 && (
              <div className="step-enter">
                <h2 className="font-display text-2xl font-semibold text-on-surface mb-2">
                  Restrições e Saúde
                </h2>
                <p className="text-on-surface-variant mb-8">
                  Segurança clínica é a nossa prioridade. Indique alergias ou medicações ativas.
                </p>

                <div className="mb-8">
                  <label className="text-[13px] font-semibold text-on-surface-variant tracking-wide block mb-3">
                    Restrições Alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {restrictions.map((r) => {
                      const active = formData.restrictions.includes(r);
                      return (
                        <button
                          key={r}
                          onClick={() => toggleRestriction(r)}
                          className={cn(
                            'px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all active:scale-95',
                            active
                              ? 'bg-primary-container text-white border border-transparent'
                              : 'bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                          )}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-semibold text-on-surface-variant tracking-wide">
                    Medicação Ativa
                  </label>
                  <textarea
                    placeholder="Ex: Metformina 500mg, Atorvastatina..."
                    value={formData.medication}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, medication: e.target.value }))
                    }
                    rows={3}
                    className="bg-surface-container-low border-none rounded-lg p-4 text-primary font-medium resize-none focus:ring-2 focus:ring-primary outline-none transition-shadow"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Goal */}
            {step === 3 && (
              <div className="step-enter">
                <h2 className="font-display text-2xl font-semibold text-on-surface mb-2">
                  Qual é o seu foco?
                </h2>
                <p className="text-on-surface-variant mb-8">
                  Adaptamos as sugestões do coach inteligente ao seu objetivo atual.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      key: 'lose' as const,
                      icon: TrendingDown,
                      title: 'Perder',
                      desc: 'Défice calórico controlado.',
                    },
                    {
                      key: 'maintain' as const,
                      icon: Scale,
                      title: 'Manter',
                      desc: 'Otimização metabólica.',
                    },
                    {
                      key: 'gain' as const,
                      icon: TrendingUp,
                      title: 'Ganhar',
                      desc: 'Hipertrofia e força muscular.',
                    },
                  ].map(({ key, icon: Icon, title, desc }) => {
                    const active = formData.goal === key;
                    return (
                      <button
                        key={key}
                        onClick={() => selectGoal(key)}
                        className={cn(
                          'relative text-left p-6 rounded-xl border-2 transition-all active:scale-[0.98]',
                          active
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent bg-surface-container-low hover:border-primary/30'
                        )}
                      >
                        <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center mb-4 text-white">
                          <Icon size={20} />
                        </div>
                        <h3 className="font-display text-lg font-semibold text-on-surface mb-1">
                          {title}
                        </h3>
                        <p className="text-on-surface-variant text-sm">{desc}</p>
                        {active && (
                          <div className="absolute top-4 right-4">
                            <Check
                              size={22}
                              className="text-primary"
                              strokeWidth={3}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: AI Analysis */}
            {step === 4 && (
              <div className="step-enter text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-ai-indigo/10 text-ai-indigo rounded-full mb-6">
                  <Sparkles size={36} fill="currentColor" />
                </div>
                <h2 className="font-display text-[28px] font-bold text-on-surface mb-3">
                  Análise Concluída
                </h2>
                <p className="text-on-surface-variant text-lg max-w-md mx-auto mb-8">
                  O Coach Inteligente está a processar o seu perfil clínico para gerar as primeiras recomendações.
                </p>

                <div className="ai-gradient border border-ai-indigo/10 rounded-xl p-8 text-left max-w-md mx-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-ai-indigo" />
                    <span className="text-[11px] font-bold text-ai-indigo tracking-widest uppercase">
                      AI Insight Inicial
                    </span>
                  </div>
                  <p className="text-on-surface text-[15px] leading-7 italic">
                    &quot;Com base na sua idade e objetivo de{' '}
                    {formData.goal === 'gain'
                      ? 'ganho muscular'
                      : formData.goal === 'lose'
                      ? 'perda de peso'
                      : 'manutenção'}
                    , identificamos uma oportunidade para otimizar o seu rácio proteico matinal.&quot;
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={goPrev}
                className="px-6 py-3 rounded-full border-[1.5px] border-secondary text-secondary text-[13px] font-semibold hover:bg-secondary/5 active:scale-95 transition-all flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={goNext}
              className={cn(
                'px-8 py-3 rounded-full text-white text-[13px] font-semibold active:scale-95 transition-all shadow-lg',
                step === totalSteps
                  ? 'bg-medical-green shadow-medical-green/20 hover:opacity-90'
                  : 'bg-primary-container shadow-primary/10 hover:opacity-90'
              )}
            >
              {step === totalSteps ? 'Começar Agora' : 'Seguinte'}
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-[13px] font-semibold text-on-surface-variant/60 tracking-wide">
          Os seus dados estão protegidos por encriptação biomédica de nível hospitalar.
        </p>
      </div>
    </div>
  );
}
