// Firebase types
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  age: number;
  weight: number;
  height: number;
  goal: 'lose' | 'maintain' | 'gain';
  restrictions: string[];
  medication: string;
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Food {
  name: string;
  quantity: string;
}

export interface Meal {
  id: string;
  userId: string;
  imageUrl: string;
  foods: Food[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  feedback: string;
  date: Date;
  confirmed: boolean;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number | string; // "15 reps" or "45 seg"
  instruction: string;
  muscleGroups: string[];
  completed: boolean;
}

export interface Workout {
  id: string;
  userId: string;
  title: string;
  description: string;
  exercises: Exercise[];
  duration: number; // minutes
  caloriesEst: number;
  intensity: 'low' | 'moderate' | 'high';
  completed: boolean;
  date: Date;
  aiRationale: string;
  suggestedLocation?: string;
  coachTip?: string;
}

export interface NutritionAnalysis {
  foods: Food[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  feedback: string;
}

export interface DailySummary {
  caloriesGoal: number;
  caloriesConsumed: number;
  caloriesRemaining: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  steps: number;
  stepsGoal: number;
  sleepHours: number;
  sleepGoal: number;
}

export interface CoachInsight {
  message: string;
  type: 'nutrition' | 'workout' | 'general' | 'warning';
  timestamp: Date;
}

// Navigation types
export type NavTab = 'dashboard' | 'diary' | 'workouts' | 'insights' | 'profile';
