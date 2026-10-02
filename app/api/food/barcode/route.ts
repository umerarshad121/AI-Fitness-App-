import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')?.trim();
  if (!code) return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`, { headers: { 'User-Agent': 'CalorieTracker/1.0' }, next: { revalidate: 3600 } });
  const data = await response.json();
  if (!response.ok || data.status !== 1) return NextResponse.json({ error: 'Food not found for this barcode' }, { status: 404 });
  const nutrition = data.product.nutriments ?? {};
  return NextResponse.json({ name: data.product.product_name || 'Unknown food', brand: data.product.brands || '', barcode: code, calories: Number(nutrition['energy-kcal_100g'] ?? 0), protein: Number(nutrition.proteins_100g ?? 0), carbs: Number(nutrition.carbohydrates_100g ?? 0), fat: Number(nutrition.fat_100g ?? 0) });
}
