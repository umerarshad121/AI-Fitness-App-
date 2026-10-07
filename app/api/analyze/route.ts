import { NextResponse } from 'next/server';

export const maxDuration = 60;

function coerceNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    if (typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image upload. Please choose a photo and try again.' }, { status: 400 });
    }
    if (imageBase64.length > 6_000_000) {
      return NextResponse.json({ error: 'Image is too large. Try a smaller photo.' }, { status: 413 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Cal Fit Count',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image. Return ONLY a JSON object with keys: is_food (boolean), food_name (string), calories (number), protein (number), carbs (number), fat (number). If the image does not clearly contain food, set is_food to false, food_name to "NO_FOOD", and all nutrition numbers to 0. Never invent nutrition for a non-food image.',
              },
              { type: 'image_url', image_url: { url: imageBase64 } },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.choices?.[0]?.message?.content) {
      return NextResponse.json({ error: data.error?.message ?? 'AI provider request failed' }, { status: 502 });
    }
    const rawContent = data.choices[0].message.content;
    const content = Array.isArray(rawContent) ? rawContent.map((part: { text?: string }) => part.text ?? '').join('') : rawContent;
    const normalized = String(content).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const start = normalized.indexOf('{');
    const end = normalized.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) throw new Error('AI returned an invalid nutrition response.');
    const result = JSON.parse(normalized.slice(start, end + 1));
    if (result.is_food === false) return NextResponse.json({ error: 'No food detected. Please capture a clear food image.' }, { status: 422 });
    return NextResponse.json({
      food_name: String(result.food_name ?? 'Meal'),
      calories: coerceNumber(result.calories),
      protein: coerceNumber(result.protein),
      carbs: coerceNumber(result.carbs),
      fat: coerceNumber(result.fat),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to analyze image' }, { status: 500 });
  }
}
