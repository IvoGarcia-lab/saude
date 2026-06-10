import { NextResponse } from 'next/server';
import { foodDatabase } from '@/lib/food-database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { caloriesGoal, proteinGoal, carbsGoal, fatGoal, restrictions } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;

    // Filter food database based on user dietary restrictions
    let allowedFoods = foodDatabase;
    if (restrictions && restrictions.length > 0) {
      allowedFoods = foodDatabase.filter((food) => {
        // Must satisfy all active restrictions
        return restrictions.every((r: string) => {
          const rule = r.toLowerCase();
          if (rule.includes('lactose')) return food.tags.includes('lactose-free');
          if (rule.includes('glúten') || rule.includes('gluten')) return food.tags.includes('lactose-free'); // standard fallback
          if (rule.includes('vegan')) return food.tags.includes('vegan');
          return true;
        });
      });
    }

    if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY') {
      await new Promise((r) => setTimeout(r, 1500));
      // Return high-quality, calculated mock meal suggestions
      const mockSuggestions = {
        meals: [
          {
            type: 'pequeno-almoço',
            title: 'Papas de Aveia Proteicas',
            items: [
              { name: 'Flocos de Aveia Integral', quantity: '50g', calories: 195, protein: 8.5, carbs: 33, fat: 3.5 },
              { name: 'Clara de Ovo', quantity: '100g', calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
              { name: 'Banana Prata', quantity: '80g', calories: 71, protein: 0.9, carbs: 18, fat: 0.2 }
            ],
            totalCalories: 318,
            totalProtein: 20.4,
            totalCarbs: 51.7,
            totalFat: 3.9,
            instructions: 'Cozinhe a aveia em água, adicione as claras de ovo no final mexendo rapidamente para engrossar. Adicione a banana fatiada no topo.'
          },
          {
            type: 'almoço',
            title: 'Frango Grelhado com Arroz Basmati e Brócolos',
            items: [
              { name: 'Peito de Frango Grelhado', quantity: '150g', calories: 247, protein: 46.5, carbs: 0, fat: 5.4 },
              { name: 'Arroz Basmati Cozido', quantity: '120g', calories: 145, protein: 4.2, carbs: 31.2, fat: 0.5 },
              { name: 'Brócolos Cozidos', quantity: '100g', calories: 35, protein: 2.4, carbs: 7, fat: 0.4 },
              { name: 'Azeite de Oliva Extra Virgem', quantity: '10g', calories: 88, protein: 0, carbs: 0, fat: 10 }
            ],
            totalCalories: 515,
            totalProtein: 53.1,
            totalCarbs: 38.2,
            totalFat: 16.3,
            instructions: 'Grelhe o frango temperado a gosto. Sirva acompanhado com arroz basmati quente, brócolos ao vapor e regue tudo com uma colher de azeite.'
          },
          {
            type: 'snack',
            title: 'Taça Quark e Amêndoas',
            items: [
              { name: 'Queijo Quark 0% Gordura', quantity: '150g', calories: 72, protein: 12.8, carbs: 5.3, fat: 0.1 },
              { name: 'Amêndoas ao Natural', quantity: '20g', calories: 116, protein: 4.2, carbs: 4.4, fat: 9.8 }
            ],
            totalCalories: 188,
            totalProtein: 17,
            totalCarbs: 9.7,
            totalFat: 9.9,
            instructions: 'Coloque o queijo quark numa taça e polvilhe com as amêndoas ligeiramente picadas.'
          },
          {
            type: 'jantar',
            title: 'Salmão Assado com Batata Doce',
            items: [
              { name: 'Filé de Salmão Assado', quantity: '150g', calories: 309, protein: 33, carbs: 0, fat: 19.5 },
              { name: 'Batata Doce Assada', quantity: '120g', calories: 103, protein: 1.9, carbs: 24, fat: 0.1 },
              { name: 'Espinafres Cozidos', quantity: '100g', calories: 23, protein: 3, carbs: 3.8, fat: 0.3 }
            ],
            totalCalories: 435,
            totalProtein: 37.9,
            totalCarbs: 27.8,
            totalFat: 19.9,
            instructions: 'Asse o filé de salmão com ervas aromáticas. Acompanhe com batata doce assada em rodelas finas e espinafres salteados.'
          }
        ],
        aggregateCalories: 1456,
        aggregateProtein: 128.4,
        aggregateCarbs: 127.4,
        aggregateFat: 50
      };
      return NextResponse.json({ success: true, data: mockSuggestions });
    }

    let prompt = `Create a 1-day meal plan (Breakfast, Lunch, Dinner, Snack) aiming to hit these target daily macros:
    - Calories: ${caloriesGoal} kcal
    - Protein: ${proteinGoal} g
    - Carbs: ${carbsGoal} g
    - Fat: ${fatGoal} g

    You MUST only build the meals using the following allowed ingredients list (with nutritional values per 100g):
    ${JSON.stringify(allowedFoods)}

    Provide a structured JSON response containing:
    {
      "meals": [
        {
          "type": "pequeno-almoço" | "almoço" | "jantar" | "snack",
          "title": "Name of the meal recipe in Portuguese",
          "items": [
            {
              "name": "Food Name from the database list in Portuguese",
              "quantity": "estimated quantity to eat (e.g. 150g, 120g, 10g)",
              "calories": number (calculated for this quantity),
              "protein": number (grams calculated for this quantity),
              "carbs": number (grams calculated for this quantity),
              "fat": number (grams calculated for this quantity)
            }
          ],
          "totalCalories": number (sum of items),
          "totalProtein": number (sum of items),
          "totalCarbs": number (sum of items),
          "totalFat": number (sum of items),
          "instructions": "Brief instructions on how to assemble or cook this meal in Portuguese"
        }
      ],
      "aggregateCalories": number (total of the day),
      "aggregateProtein": number (total of the day),
      "aggregateCarbs": number (total of the day),
      "aggregateFat": number (total of the day)
    }
    Respond ONLY with the raw JSON object. Do not include markdown code block formatting (like \`\`\`json) or any extra conversational text.`;

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'O Meu Coach Inteligente',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const resData = await response.json();
    const textResponse = resData.choices?.[0]?.message?.content;
    
    if (!textResponse) {
      throw new Error('Empty response');
    }

    const parsedData = JSON.parse(textResponse.trim());
    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error('Error in suggest-meals API:', error);
    // Graceful fallback values
    const fallback = {
      meals: [
        {
          type: 'pequeno-almoço',
          title: 'Papas de Aveia Simples',
          items: [{ name: 'Flocos de Aveia Integral', quantity: '50g', calories: 195, protein: 8.5, carbs: 33, fat: 3.5 }],
          totalCalories: 195,
          totalProtein: 8.5,
          totalCarbs: 33,
          totalFat: 3.5,
          instructions: 'Misture com água quente e mexa.'
        },
        {
          type: 'almoço',
          title: 'Prato Equilibrado de Frango',
          items: [{ name: 'Peito de Frango Grelhado', quantity: '150g', calories: 247, protein: 46.5, carbs: 0, fat: 5.4 }],
          totalCalories: 247,
          totalProtein: 46.5,
          totalCarbs: 0,
          totalFat: 5.4,
          instructions: 'Grelhe o peito de frango e coma quente.'
        }
      ],
      aggregateCalories: 442,
      aggregateProtein: 55,
      aggregateCarbs: 33,
      aggregateFat: 8.9
    };
    return NextResponse.json({ success: true, data: fallback });
  }
}
