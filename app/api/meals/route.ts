import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await request.json();
  const foodName = String(body.food_name ?? '').trim();
  if (!foodName) return NextResponse.json({ error: 'Food name is required.' }, { status: 400 });
  const { data, error } = await supabase.from('meal_logs').insert({
    user_id: user.id,
    image_url: body.image_url ?? null,
    food_name: foodName,
    calories: Number(body.calories) || 0,
    protein: Number(body.protein) || 0,
    carbs: Number(body.carbs) || 0,
    fat: Number(body.fat) || 0,
    meal_type: body.meal_type ?? 'snack',
    servings: body.servings ?? 1,
    source: body.source ?? 'manual',
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
