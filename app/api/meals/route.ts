import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await request.json();
  const { data, error } = await supabase.from('meal_logs').insert({ user_id: user.id, image_url: body.image_url ?? null, food_name: body.food_name, calories: body.calories, protein: body.protein, carbs: body.carbs, fat: body.fat, meal_type: body.meal_type ?? 'snack', servings: body.servings ?? 1, source: body.source ?? 'manual' }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
