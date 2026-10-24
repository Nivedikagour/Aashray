import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { getAdvice, getWeather } from './climate.server';

export const generateSuggestion = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({
    city: z.string().trim().min(2).max(80),
    roomType: z.string().min(2).max(40),
    areaSqm: z.number().min(2).max(2000),
    style: z.string().min(2).max(40),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const weather = await getWeather(data.city);
    const result = await getAdvice({ weather, roomType: data.roomType, areaSqm: data.areaSqm, style: data.style });
    const { data: row, error } = await context.supabase.from('climate_suggestions').insert({
      user_id: context.userId, city: weather.city, room_type: data.roomType, area_sqm: data.areaSqm, style: data.style,
      weather: weather as never, result: result as never,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listSuggestions = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('climate_suggestions').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) throw new Error(error.message);
    return data;
  });

export const deleteSuggestion = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from('climate_suggestions').delete().eq('id', data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
