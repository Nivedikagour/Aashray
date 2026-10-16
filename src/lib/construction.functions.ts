import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { runAnalysis } from './construction.server';

const inputSchema = z.object({
  tool: z.enum(['safety', 'cracks', 'valuation', 'planning', 'weather', 'assistant']),
  image: z.string().startsWith('data:image/').max(7_000_000).optional(),
  notes: z.string().max(2000).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  propertyType: z.string().max(60).optional(),
  areaSqft: z.number().min(50).max(1_000_000).optional(),
  ageYears: z.number().min(0).max(200).optional(),
  projectType: z.string().max(80).optional(),
  areaSqm: z.number().min(5).max(1_000_000).optional(),
  budgetInr: z.number().min(10_000).max(1e11).optional(),
  months: z.number().min(1).max(120).optional(),
  work: z.string().max(300).optional(),
  question: z.string().trim().min(4).max(2000).optional(),
});

export const generateAnalysis = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { title, result, weather } = await runAnalysis(data);
    const { data: row, error } = await context.supabase.from('construction_analyses').insert({
      user_id: context.userId, tool: data.tool, title,
      input: { ...data, image: data.image ? '[photo]' : undefined, weather: weather ?? null } as never,
      result: result as never,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listAnalyses = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('construction_analyses').select('*').order('created_at', { ascending: false }).limit(30);
    if (error) throw new Error(error.message);
    return data;
  });

export const deleteAnalysis = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from('construction_analyses').delete().eq('id', data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
