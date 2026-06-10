import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, text } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY') {
      // Simulate OpenRouter analysis with realistic demo mode
      await new Promise((r) => setTimeout(r, 1500));
      const mockResult = {
        foods: [
          { name: 'Frango Grelhado', quantity: '150g' },
          { name: 'Arroz Basmati', quantity: '120g' },
          { name: 'Brócolos ao Vapor', quantity: '100g' },
          { name: 'Azeite de Oliva', quantity: '1 colher de chá' }
        ],
        calories: 490,
        protein: 44,
        carbs: 48,
        fat: 12,
        feedback: 'Uma excelente refeição equilibrada! Rica em proteína magra e com carboidratos de absorção gradual. Adicionar brócolos garante micronutrientes essenciais e fibra.'
      };
      return NextResponse.json({ success: true, data: mockResult });
    }

    // Call OpenRouter API with Llama 3.2 Vision Free
    let prompt = `Analise detalhadamente esta refeição na imagem. Identifique com precisão todos os alimentos visíveis.
    Forneça uma resposta estritamente estruturada em JSON contendo:
    {
      "foods": [{"name": "Nome do Alimento em Português", "quantity": "Quantidade Estimada (ex: 150g, 1 colher)"}],
      "calories": número,
      "protein": número (gramas de proteína),
      "carbs": número (gramas de hidratos de carbono),
      "fat": número (gramas de gordura),
      "feedback": "Um comentário breve de coach desportivo sobre a refeição, escrito em Português de Portugal (pt-PT)"
    }
    IMPORTANTE: Todos os textos em "name" e "feedback" DEVEM ser escritos em Português (pt-PT).
    Responda APENAS com o objeto JSON puro. Não inclua blocos de código markdown (como \`\`\`json) ou qualquer outro texto explicativo.`;

    const contentArray: any[] = [{ type: 'text', text: text ? `${prompt}\nContext: ${text}` : prompt }];

    if (image) {
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: image
        }
      });
    }

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
          model: 'nvidia/nemotron-nano-12b-v2-vl:free',
          messages: [
            {
              role: 'user',
              content: contentArray
            }
          ],
          response_format: { type: 'json_object' }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `OpenRouter API error: ${errorText}` }, { status: response.status });
    }

    const resData = await response.json();
    const textResponse = resData.choices?.[0]?.message?.content;
    
    if (!textResponse) {
      throw new Error('Empty response from OpenRouter');
    }

    const parsedData = JSON.parse(textResponse.trim());
    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error('Error in analyze-meal:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
