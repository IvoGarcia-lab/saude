export interface FoodDatabaseItem {
  name: string;
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit' | 'dairy' | 'snack';
  calories: number; // per 100g
  protein: number;  // per 100g
  carbs: number;    // per 100g
  fat: number;      // per 100g
  defaultServingGrams: number;
  tags: string[]; // e.g., 'vegan', 'lactose-free', 'gluten-free'
}

export const foodDatabase: FoodDatabaseItem[] = [
  // --- Proteins ---
  {
    name: 'Peito de Frango Grelhado',
    category: 'protein',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    defaultServingGrams: 150,
    tags: ['lactose-free', 'gluten-free']
  },
  {
    name: 'Filé de Salmão Assado',
    category: 'protein',
    calories: 206,
    protein: 22,
    carbs: 0,
    fat: 13,
    defaultServingGrams: 150,
    tags: ['lactose-free', 'gluten-free']
  },
  {
    name: 'Atum em Lata ao Natural',
    category: 'protein',
    calories: 116,
    protein: 26,
    carbs: 0,
    fat: 1,
    defaultServingGrams: 120,
    tags: ['lactose-free', 'gluten-free']
  },
  {
    name: 'Bife de Peru Grelhado',
    category: 'protein',
    calories: 135,
    protein: 30,
    carbs: 0,
    fat: 1.5,
    defaultServingGrams: 150,
    tags: ['lactose-free', 'gluten-free']
  },
  {
    name: 'Ovo Inteiro Cozido',
    category: 'protein',
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    defaultServingGrams: 100, // approx 2 large eggs
    tags: ['lactose-free', 'gluten-free']
  },
  {
    name: 'Clara de Ovo',
    category: 'protein',
    calories: 52,
    protein: 11,
    carbs: 0.7,
    fat: 0.2,
    defaultServingGrams: 150,
    tags: ['lactose-free', 'gluten-free']
  },
  {
    name: 'Tofu Firme',
    category: 'protein',
    calories: 76,
    protein: 8,
    carbs: 1.9,
    fat: 4.8,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Lentilhas Cozidas',
    category: 'protein',
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },

  // --- Carbs ---
  {
    name: 'Arroz Integral Cozido',
    category: 'carb',
    calories: 111,
    protein: 2.6,
    carbs: 23,
    fat: 0.9,
    defaultServingGrams: 120,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Arroz Basmati Cozido',
    category: 'carb',
    calories: 121,
    protein: 3.5,
    carbs: 26,
    fat: 0.4,
    defaultServingGrams: 120,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Batata Doce Assada',
    category: 'carb',
    calories: 86,
    protein: 1.6,
    carbs: 20,
    fat: 0.1,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Flocos de Aveia Integral',
    category: 'carb',
    calories: 389,
    protein: 16.9,
    carbs: 66,
    fat: 6.9,
    defaultServingGrams: 50,
    tags: ['vegan', 'lactose-free'] // standard oats may contain trace gluten
  },
  {
    name: 'Massa Integral Cozida',
    category: 'carb',
    calories: 124,
    protein: 5.3,
    carbs: 25,
    fat: 0.8,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free']
  },
  {
    name: 'Quinoa Cozida',
    category: 'carb',
    calories: 120,
    protein: 4.4,
    carbs: 21.3,
    fat: 1.9,
    defaultServingGrams: 120,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },

  // --- Fats ---
  {
    name: 'Azeite de Oliva Extra Virgem',
    category: 'fat',
    calories: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
    defaultServingGrams: 10, // ~ 1 spoon
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Abacate',
    category: 'fat',
    calories: 160,
    protein: 2,
    carbs: 8.5,
    fat: 14.7,
    defaultServingGrams: 80,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Amêndoas ao Natural',
    category: 'fat',
    calories: 579,
    protein: 21,
    carbs: 22,
    fat: 49,
    defaultServingGrams: 30,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Nozes descascadas',
    category: 'fat',
    calories: 654,
    protein: 15,
    carbs: 13.7,
    fat: 65,
    defaultServingGrams: 30,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Manteiga de Amendoim Pura',
    category: 'fat',
    calories: 588,
    protein: 25,
    carbs: 20,
    fat: 50,
    defaultServingGrams: 20,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },

  // --- Vegetables (low calorie micronutrient hubs) ---
  {
    name: 'Brócolos Cozidos',
    category: 'vegetable',
    calories: 35,
    protein: 2.4,
    carbs: 7,
    fat: 0.4,
    defaultServingGrams: 100,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Espinafres Cozidos',
    category: 'vegetable',
    calories: 23,
    protein: 3,
    carbs: 3.8,
    fat: 0.3,
    defaultServingGrams: 100,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Tomate Fresco',
    category: 'vegetable',
    calories: 18,
    protein: 0.9,
    carbs: 3.9,
    fat: 0.2,
    defaultServingGrams: 120,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Alface Variada',
    category: 'vegetable',
    calories: 15,
    protein: 1.4,
    carbs: 2.9,
    fat: 0.2,
    defaultServingGrams: 80,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },

  // --- Fruits ---
  {
    name: 'Banana Prata',
    category: 'fruit',
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    defaultServingGrams: 100, // approx 1 medium banana
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Maçã com casca',
    category: 'fruit',
    calories: 52,
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Morangos Frescos',
    category: 'fruit',
    calories: 32,
    protein: 0.7,
    carbs: 7.7,
    fat: 0.3,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },

  // --- Dairy & Dairy Alternatives ---
  {
    name: 'Queijo Quark 0% Gordura',
    category: 'dairy',
    calories: 48,
    protein: 8.5,
    carbs: 3.5,
    fat: 0.1,
    defaultServingGrams: 150,
    tags: ['gluten-free']
  },
  {
    name: 'Iogurte Grego Ligeiro',
    category: 'dairy',
    calories: 73,
    protein: 10,
    carbs: 4,
    fat: 1.9,
    defaultServingGrams: 150,
    tags: ['gluten-free']
  },
  {
    name: 'Bebida de Amêndoa Sem Açúcar',
    category: 'dairy',
    calories: 13,
    protein: 0.4,
    carbs: 0.2,
    fat: 1.1,
    defaultServingGrams: 200,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Whey Protein Isolado (Pó)',
    category: 'dairy',
    calories: 360,
    protein: 82,
    carbs: 3,
    fat: 2,
    defaultServingGrams: 30, // 1 scoop
    tags: ['gluten-free']
  }
];
