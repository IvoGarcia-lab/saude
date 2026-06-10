import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 */
export function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female' = 'male'): number {
  if (gender === 'male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  }
  return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
export function calculateTDEE(bmr: number, activityLevel: number = 1.55): number {
  return Math.round(bmr * activityLevel);
}

/**
 * Calculate macro targets based on calorie goal
 */
export function calculateMacros(calories: number, goal: 'lose' | 'maintain' | 'gain') {
  const ratios = {
    lose: { protein: 0.35, carbs: 0.35, fat: 0.30 },
    maintain: { protein: 0.30, carbs: 0.40, fat: 0.30 },
    gain: { protein: 0.30, carbs: 0.45, fat: 0.25 },
  };

  const r = ratios[goal];
  return {
    protein: Math.round((calories * r.protein) / 4),
    carbs: Math.round((calories * r.carbs) / 4),
    fat: Math.round((calories * r.fat) / 9),
  };
}

/**
 * Format a number with locale-aware separators
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('pt-PT');
}

/**
 * Format duration in minutes to "Xh Ym" format
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
