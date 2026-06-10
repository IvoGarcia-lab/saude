import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, text } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Simulate Gemini analysis with slight variation for realistic demo mode
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

    // Call real Gemini API
    let prompt = `Analyze this meal. Provide a structured JSON response containing:
    {
      "foods": [{"name": "Food Item Name", "quantity": "Estimated Quantity"}],
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams),
      "feedback": "A short, encouraging fitness coaching insight about this meal"
    }
    Respond ONLY with the raw JSON object. Do not include markdown code block formatting (like \`\`\`json) or any extra conversational text.`;

    let contents: any[] = [];
    if (image) {
      // Extract base64 data and mime type
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        contents.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }
    }

    contents.push({
      text: text ? `${prompt}\nAdditional user context/description: ${text}` : prompt
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: contents }],
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
    console.error('Error in analyze-meal:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
