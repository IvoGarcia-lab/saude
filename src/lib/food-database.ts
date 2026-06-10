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
  // --- PROTEINS (Animal & Seafood) ---
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
    name: 'Pescada Cozida',
    category: 'protein',
    calories: 96,
    protein: 20,
    carbs: 0,
    fat: 1.8,
    defaultServingGrams: 150,
    tags: ['lactose-free', 'gluten-free']
  },
  {
    name: 'Bacalhau Desfiado Cozido',
    category: 'protein',
    calories: 82,
    protein: 19,
    carbs: 0,
    fat: 0.7,
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
    name: 'Ovo Inteiro Cozido',
    category: 'protein',
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    defaultServingGrams: 100,
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
    name: 'Carne de Vaca Magra Grelhada',
    category: 'protein',
    calories: 180,
    protein: 28,
    carbs: 0,
    fat: 7.5,
    defaultServingGrams: 150,
    tags: ['lactose-free', 'gluten-free']
  },
  {
    name: 'Sardinhas Assadas',
    category: 'protein',
    calories: 210,
    protein: 25,
    carbs: 0,
    fat: 12.4,
    defaultServingGrams: 120,
    tags: ['lactose-free', 'gluten-free']
  },
  {
    name: 'Camarão Cozido',
    category: 'protein',
    calories: 99,
    protein: 24,
    carbs: 0.2,
    fat: 0.3,
    defaultServingGrams: 120,
    tags: ['lactose-free', 'gluten-free']
  },

  // --- PROTEINS (Plant-Based / Vegan) ---
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
    name: 'Seitan Bio',
    category: 'protein',
    calories: 130,
    protein: 25,
    carbs: 4,
    fat: 1.8,
    defaultServingGrams: 120,
    tags: ['vegan', 'lactose-free']
  },
  {
    name: 'Tempeh Integral',
    category: 'protein',
    calories: 193,
    protein: 19,
    carbs: 9,
    fat: 11,
    defaultServingGrams: 120,
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
  {
    name: 'Feijão Preto Cozido',
    category: 'protein',
    calories: 132,
    protein: 8.9,
    carbs: 23.7,
    fat: 0.5,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Grão-de-Bico Cozido',
    category: 'protein',
    calories: 164,
    protein: 8.9,
    carbs: 27.4,
    fat: 2.6,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Feijão Frade Cozido',
    category: 'protein',
    calories: 118,
    protein: 8,
    carbs: 21,
    fat: 0.5,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },

  // --- CARBS (Grains, Breads, Tubers) ---
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
    name: 'Batata Branca Cozida',
    category: 'carb',
    calories: 87,
    protein: 2,
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
    tags: ['vegan', 'lactose-free']
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
  {
    name: 'Pão de Centeio Integral',
    category: 'carb',
    calories: 259,
    protein: 9,
    carbs: 48,
    fat: 3.3,
    defaultServingGrams: 60,
    tags: ['vegan', 'lactose-free']
  },
  {
    name: 'Pão Alentejano Tradicional',
    category: 'carb',
    calories: 265,
    protein: 8.2,
    carbs: 55,
    fat: 1,
    defaultServingGrams: 60,
    tags: ['vegan', 'lactose-free']
  },
  {
    name: 'Couscous Cozido',
    category: 'carb',
    calories: 112,
    protein: 3.8,
    carbs: 23,
    fat: 0.2,
    defaultServingGrams: 120,
    tags: ['vegan', 'lactose-free']
  },
  {
    name: 'Massa de Espelta Cozida',
    category: 'carb',
    calories: 128,
    protein: 5.5,
    carbs: 26,
    fat: 0.9,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free']
  },

  // --- FATS (Oils, Seeds, Nuts) ---
  {
    name: 'Azeite de Oliva Extra Virgem',
    category: 'fat',
    calories: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
    defaultServingGrams: 10,
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
    name: 'Nozes Descascadas',
    category: 'fat',
    calories: 654,
    protein: 15,
    carbs: 13.7,
    fat: 65,
    defaultServingGrams: 30,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Manteiga de Amendoim 100%',
    category: 'fat',
    calories: 588,
    protein: 25,
    carbs: 20,
    fat: 50,
    defaultServingGrams: 20,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Sementes de Chia',
    category: 'fat',
    calories: 486,
    protein: 17,
    carbs: 42,
    fat: 31,
    defaultServingGrams: 15,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Sementes de Linhaça Moída',
    category: 'fat',
    calories: 534,
    protein: 18,
    carbs: 29,
    fat: 42,
    defaultServingGrams: 15,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Azeitonas Pretas Galega',
    category: 'fat',
    calories: 115,
    protein: 0.8,
    carbs: 6.3,
    fat: 10.7,
    defaultServingGrams: 30,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },

  // --- VEGETABLES ---
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
  {
    name: 'Courgette (Abobrinha) Cozida',
    category: 'vegetable',
    calories: 17,
    protein: 1.2,
    carbs: 3.1,
    fat: 0.3,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Cenoura Crua Ralada',
    category: 'vegetable',
    calories: 41,
    protein: 0.9,
    carbs: 9.6,
    fat: 0.2,
    defaultServingGrams: 80,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Couve-Flor Cozida',
    category: 'vegetable',
    calories: 25,
    protein: 1.9,
    carbs: 5,
    fat: 0.3,
    defaultServingGrams: 120,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Feijão Verde Cozido',
    category: 'vegetable',
    calories: 31,
    protein: 1.8,
    carbs: 7,
    fat: 0.2,
    defaultServingGrams: 100,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Cogumelos Paris Frescos',
    category: 'vegetable',
    calories: 22,
    protein: 3.1,
    carbs: 3.3,
    fat: 0.3,
    defaultServingGrams: 100,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Espargos Grelhados',
    category: 'vegetable',
    calories: 20,
    protein: 2.2,
    carbs: 3.9,
    fat: 0.1,
    defaultServingGrams: 100,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },

  // --- FRUITS ---
  {
    name: 'Banana Prata',
    category: 'fruit',
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    defaultServingGrams: 100,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Maçã com Casca',
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
  {
    name: 'Pêra Rocha',
    category: 'fruit',
    calories: 57,
    protein: 0.4,
    carbs: 15,
    fat: 0.1,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Laranja do Algarve',
    category: 'fruit',
    calories: 47,
    protein: 0.9,
    carbs: 11.8,
    fat: 0.1,
    defaultServingGrams: 150,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Mirtilos Frescos',
    category: 'fruit',
    calories: 57,
    protein: 0.7,
    carbs: 14.5,
    fat: 0.3,
    defaultServingGrams: 100,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Kiwi Verde',
    category: 'fruit',
    calories: 61,
    protein: 1.1,
    carbs: 14.7,
    fat: 0.5,
    defaultServingGrams: 100,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },

  // --- DAIRY & DAIRY ALTERNATIVES ---
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
    name: 'Bebida de Soja Natural',
    category: 'dairy',
    calories: 33,
    protein: 3.3,
    carbs: 0.2,
    fat: 1.8,
    defaultServingGrams: 200,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Queijo Fresco Magro',
    category: 'dairy',
    calories: 80,
    protein: 12,
    carbs: 3,
    fat: 2,
    defaultServingGrams: 80,
    tags: ['gluten-free']
  },
  {
    name: 'Requeijão de Ovelha Ligeiro',
    category: 'dairy',
    calories: 140,
    protein: 11,
    carbs: 3.5,
    fat: 9,
    defaultServingGrams: 100,
    tags: ['gluten-free']
  },
  {
    name: 'Leite Desnatado (UHT)',
    category: 'dairy',
    calories: 35,
    protein: 3.4,
    carbs: 4.9,
    fat: 0.1,
    defaultServingGrams: 200,
    tags: ['gluten-free']
  },
  {
    name: 'Whey Protein Isolado (Pó)',
    category: 'dairy',
    calories: 360,
    protein: 82,
    carbs: 3,
    fat: 2,
    defaultServingGrams: 30,
    tags: ['gluten-free']
  },
  {
    name: 'Proteína de Ervilha (Pó)',
    category: 'dairy',
    calories: 380,
    protein: 80,
    carbs: 4,
    fat: 3,
    defaultServingGrams: 30,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },

  // --- SNACKS & HEALTHY EXTRAS ---
  {
    name: 'Gelatina Sem Açúcar',
    category: 'snack',
    calories: 10,
    protein: 1.8,
    carbs: 0,
    fat: 0,
    defaultServingGrams: 100,
    tags: ['gluten-free', 'lactose-free']
  },
  {
    name: 'Chocolate Negro 85%',
    category: 'snack',
    calories: 530,
    protein: 9,
    carbs: 19,
    fat: 46,
    defaultServingGrams: 20,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Tortitas de Arroz Integral',
    category: 'snack',
    calories: 387,
    protein: 8,
    carbs: 81,
    fat: 2.8,
    defaultServingGrams: 20,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  },
  {
    name: 'Tremoços Cozidos',
    category: 'snack',
    calories: 119,
    protein: 15.6,
    carbs: 9.9,
    fat: 2.9,
    defaultServingGrams: 50,
    tags: ['vegan', 'lactose-free', 'gluten-free']
  }
];

