import { NextResponse } from 'next/server';

function getFallbackWorkout(goal: string, restrictions: string[], weight: number) {
  return {
    title: goal === 'lose' ? 'Cardio & Definição Inteligente' : 'Hipertrofia Funcional Acelerada',
    description: `Treino desenhado para otimizar os seus resultados considerando um objetivo de ${
      goal === 'lose' ? 'perda de gordura' : goal === 'gain' ? 'ganho muscular' : 'manutenção'
    } com peso de ${weight || 74}kg.`,
    suggestedLocation: 'Ginásio Local ou Ao Ar Livre',
    aiRationale: `Com base nas restrições ${
      restrictions && restrictions.length > 0 ? restrictions.join(', ') : 'nenhuma'
    }, estruturámos exercícios de baixo impacto articular, focando na ativação muscular máxima.`,
    duration: 45,
    caloriesEst: goal === 'lose' ? 380 : 310,
    intensity: 'moderate',
    exercises: [
      {
        name: 'Agachamento Goblet',
        sets: 3,
        reps: '12-15 reps',
        instruction: 'Mantenha o peito elevado e desça até os quadris passarem a linha dos joelhos.',
        muscleGroups: ['Quadríceps', 'Glúteos'],
        completed: false
      },
      {
        name: 'Flexões de Braço (Modificadas se necessário)',
        sets: 3,
        reps: '10-12 reps',
        instruction: 'Corpo alinhado, cotovelos a 45 graus em relação ao tronco.',
        muscleGroups: ['Peito', 'Tríceps'],
        completed: false
      },
      {
        name: 'Puxada Dorsal com Elástico',
        sets: 3,
        reps: '15 reps',
        instruction: 'Foque na contração das escápulas no ponto máximo da puxada.',
        muscleGroups: ['Costas', 'Bíceps'],
        completed: false
      },
      {
        name: 'Prancha Abdominal Estática',
        sets: 3,
        reps: '45 seg',
        instruction: 'Contraia o core e glúteos, mantendo a coluna numa linha neutra.',
        muscleGroups: ['Core'],
        completed: false
      }
    ],
    coachTip: 'Mantenha-se hidratado durante a sessão. Controle a respiração: expire no esforço máximo e inspire no retorno.'
  };
}

export async function POST(request: Request) {
  let goal = 'maintain';
  let restrictions: string[] = [];
  let weight = 70;

  try {
    const body = await request.json();
    goal = body.goal || 'maintain';
    restrictions = body.restrictions || [];
    weight = body.weight || 70;

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY') {
      await new Promise((r) => setTimeout(r, 1000));
      return NextResponse.json({ success: true, data: getFallbackWorkout(goal, restrictions, weight) });
    }

    // Call OpenRouter API with Llama 3.3 70B Free
    let prompt = `Generate a customized workout. User profile details:
    - Goal: ${goal}
    - Restrictions: ${restrictions.length > 0 ? restrictions.join(', ') : 'none'}
    - Weight: ${weight} kg
    
    Provide a structured JSON response containing:
    {
      "title": "Workout Title",
      "description": "Short description of the workout alignment",
      "suggestedLocation": "e.g., Ginásio, Casa, Ao Ar Livre",
      "aiRationale": "Brief explanation of why this workout fits their goals/restrictions",
      "duration": number (minutes),
      "caloriesEst": number (calories burned estimation),
      "intensity": "low" | "moderate" | "high",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": number,
          "reps": "number of reps (e.g. 12-15 reps) or duration (e.g. 45 seg)",
          "instruction": "Short proper form instruction",
          "muscleGroups": ["Muscle Name"],
          "completed": false
        }
      ],
      "coachTip": "A short motivational tip for this session"
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
      console.warn(`OpenRouter returned status ${response.status}. Falling back to default generator.`);
      return NextResponse.json({ success: true, data: getFallbackWorkout(goal, restrictions, weight) });
    }

    const resData = await response.json();
    const textResponse = resData.choices?.[0]?.message?.content;
    
    if (!textResponse) {
      throw new Error('Empty response from OpenRouter');
    }

    const parsedData = JSON.parse(textResponse.trim());
    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error('Error in generate-workout, using fallback:', error);
    return NextResponse.json({ success: true, data: getFallbackWorkout(goal, restrictions, weight) });
  }
}
