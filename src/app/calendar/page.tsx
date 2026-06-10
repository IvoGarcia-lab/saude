'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Sparkles, Loader2, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CoachInsight } from '@/components/dashboard/CoachInsight';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

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

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setShowAddForm(true);
                  }}
                  className="aspect-square border border-surface-container hover:border-primary/45 rounded-lg p-1.5 flex flex-col justify-between cursor-pointer hover:bg-surface-container-lowest transition-all"
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
            <h3 className="font-display text-lg font-semibold text-on-surface mb-4">
              Eventos Agendados
            </h3>

            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 size={24} className="text-primary animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <CalendarIcon size={32} className="mx-auto text-outline mb-2" />
                <p className="text-sm font-semibold">Nenhum evento agendado</p>
                <p className="text-xs mt-1">Toque numa data para adicionar.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {events.map((e, idx) => (
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
                          <Clock size={12} /> {e.dateStr.split('-').reverse().join('/')} às {e.timeStr}
                        </p>
                        {e.description && (
                          <p className="text-on-surface-variant text-[11px] mt-1.5 leading-4">
                            {e.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(e.id, idx)}
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
