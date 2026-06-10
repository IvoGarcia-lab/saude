import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { goal, restrictions, weight, height } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Simulate Gemini analysis for realistic demo mode
      await new Promise((r) => setTimeout(r, 1500));
      const mockWorkout = {
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
      return NextResponse.json({ success: true, data: mockWorkout });
    }

    // Call real Gemini API
    let prompt = `Generate a customized workout. User profile details:
    - Goal: ${goal || 'maintain'}
    - Restrictions: ${restrictions ? restrictions.join(', ') : 'none'}
    - Weight: ${weight || 'N/A'} kg
    - Height: ${height || 'N/A'} cm
    
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Gemini API error: ${errorText}` }, { status: response.status });
    }

    const resData = await response.json();
    const textResponse = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('Empty response from Gemini');
    }

    const parsedData = JSON.parse(textResponse.trim());
    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error('Error in generate-workout:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
