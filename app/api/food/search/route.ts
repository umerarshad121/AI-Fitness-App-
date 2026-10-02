import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim();
  if (!query) return NextResponse.json({ foods: [] });
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`;
  const response = await fetch(url, { headers: { 'User-Agent': 'CalorieTracker/1.0' }, next: { revalidate: 3600 } });
  if (!response.ok) return NextResponse.json({ error: 'Food database unavailable' }, { status: 502 });
  const data = await response.json();
  const foods = (data.products ?? []).map((food: Record<string, unknown>) => ({
    name: food.product_name || food.generic_name || 'Unknown food',
    brand: food.brands || '',
    barcode: food.code || null,
    calories: Number((food.nutriments as Record<string, unknown> | undefined)?.['energy-kcal_100g'] ?? 0),
    protein: Number((food.nutriments as Record<string, unknown> | undefined)?.proteins_100g ?? 0),
    carbs: Number((food.nutriments as Record<string, unknown> | undefined)?.carbohydrates_100g ?? 0),
    fat: Number((food.nutriments as Record<string, unknown> | undefined)?.fat_100g ?? 0),
  })).filter((food: { calories: number }) => food.calories > 0);
  return NextResponse.json({ foods });
}
