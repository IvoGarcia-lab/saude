import type { DailySummary, Workout, Exercise, Meal, CoachInsight, UserProfile } from './types';

export const mockUser: UserProfile = {
  uid: 'demo-user-001',
  name: 'João Silva',
  email: 'joao@example.com',
  photoURL: undefined,
  age: 32,
  weight: 68,
  height: 175,
  goal: 'gain',
  restrictions: ['Intolerante à Lactose'],
  medication: '',
  onboardingComplete: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockDailySummary: DailySummary = {
  caloriesGoal: 2150,
  caloriesConsumed: 700,
  caloriesRemaining: 1450,
  protein: 85,
  carbs: 120,
  fat: 42,
  proteinGoal: 140,
  carbsGoal: 260,
  fatGoal: 60,
  steps: 7432,
  stepsGoal: 10000,
  sleepHours: 6.75,
  sleepGoal: 8,
};

export const mockExercises: Exercise[] = [
  {
    name: 'Push-ups (Flexões)',
    sets: 3,
    reps: '12 Reps',
    instruction: 'Mantenha o core ativado e os cotovelos a 45 graus do tronco para proteger os ombros.',
    muscleGroups: ['Peitoral', 'Tríceps'],
    completed: false,
  },
  {
    name: 'Squats (Agachamentos)',
    sets: 4,
    reps: '15 Reps',
    instruction: 'Peso nos calcanhares. Imagine sentar-se numa cadeira invisível.',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    completed: false,
  },
  {
    name: 'Plank (Prancha)',
    sets: 3,
    reps: '45 Seg',
    instruction: 'Linha reta dos ombros aos calcanhares. Respire calmamente pelo nariz.',
    muscleGroups: ['Core', 'Estabilizadores'],
    completed: false,
  },
  {
    name: 'Lunges (Afundos)',
    sets: 3,
    reps: '10 Reps (cada)',
    instruction: 'Passo largo à frente, joelho traseiro quase toca o chão.',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    completed: false,
  },
  {
    name: 'Burpees',
    sets: 3,
    reps: '8 Reps',
    instruction: 'Movimento explosivo. Foco na técnica, não na velocidade.',
    muscleGroups: ['Full Body'],
    completed: false,
  },
  {
    name: 'Mountain Climbers',
    sets: 3,
    reps: '30 Seg',
    instruction: 'Mãos diretamente sob os ombros. Ritmo constante.',
    muscleGroups: ['Core', 'Cardio'],
    completed: false,
  },
];

export const mockWorkout: Workout = {
  id: 'workout-001',
  userId: 'demo-user-001',
  title: 'Calistenia de Intensidade Média',
  description: 'Uma rotina equilibrada focada em resistência muscular e controle corporal, otimizada para o seu nível atual.',
  exercises: mockExercises,
  duration: 45,
  caloriesEst: 320,
  intensity: 'moderate',
  completed: false,
  date: new Date(),
  aiRationale: 'Ajustado com base no seu almoço de 450kcal e 7h30 de sono. Foco em queima calórica moderada para manter o balanço energético negativo de hoje.',
  suggestedLocation: 'Parque da Cidade',
  coachTip: '"Estás a ter uma semana excelente! Se sentires facilidade nas flexões, tenta elevar os pés para aumentar o desafio."',
};

export const mockMeals: Meal[] = [
  {
    id: 'meal-001',
    userId: 'demo-user-001',
    imageUrl: '',
    foods: [
      { name: 'Peito de frango grelhado', quantity: '150g' },
      { name: 'Arroz integral', quantity: '100g' },
      { name: 'Brócolos cozidos', quantity: '80g' },
    ],
    calories: 450,
    protein: 42,
    carbs: 55,
    fat: 8,
    feedback: 'Ótima fonte de proteína magra! Boa escolha de carboidratos complexos. Considere adicionar azeite para gorduras saudáveis.',
    date: new Date(),
    confirmed: true,
    mealType: 'lunch',
  },
  {
    id: 'meal-002',
    userId: 'demo-user-001',
    imageUrl: '',
    foods: [
      { name: 'Aveia', quantity: '50g' },
      { name: 'Banana', quantity: '1 unidade' },
      { name: 'Amendoim', quantity: '20g' },
    ],
    calories: 250,
    protein: 8,
    carbs: 40,
    fat: 10,
    feedback: 'Pequeno-almoço equilibrado! A aveia fornece energia sustentada.',
    date: new Date(),
    confirmed: true,
    mealType: 'breakfast',
  },
];

export const mockCoachInsights: CoachInsight[] = [
  {
    message: 'O seu consumo de proteínas está 15% acima da média matinal. Excelente para a recuperação muscular após o treino de ontem!',
    type: 'nutrition',
    timestamp: new Date(),
  },
  {
    message: 'João, notei que o seu IMC está no intervalo saudável. Manter os treinos de força ajudará no seu objetivo de ganho de massa magra.',
    type: 'general',
    timestamp: new Date(),
  },
];
