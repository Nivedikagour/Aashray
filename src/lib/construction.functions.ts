import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
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
  .validator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const { title, result, weather } = await runAnalysis({
      tool: data.tool,
      image: data.image,
      notes: data.notes,
      city: data.city,
      propertyType: data.propertyType,
      areaSqft: data.areaSqft,
      ageYears: data.ageYears,
      projectType: data.projectType,
      areaSqm: data.areaSqm,
      budgetInr: data.budgetInr,
      months: data.months,
      work: data.work,
      question: data.question,
    });

    try {
      const request = getRequest();
      const authHeader = request?.headers?.get('authorization');
      const supabaseUrl = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'];
      const publishableKey = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['VITE_SUPABASE_PUBLISHABLE_KEY'];

      if (authHeader && authHeader.startsWith('Bearer ') && supabaseUrl && publishableKey) {
        const token = authHeader.replace('Bearer ', '');
        const client = createClient<Database>(supabaseUrl, publishableKey, {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

        const { data: userData } = await client.auth.getUser(token);
        if (userData?.user?.id) {
          const { data: row } = await client.from('construction_analyses').insert({
            user_id: userData.user.id,
            tool: data.tool,
            title,
            input: { ...data, image: data.image ? '[photo]' : undefined, weather: weather ?? null } as never,
            result: result as never,
          }).select().single();

          if (row) return row;
        }
      }
    } catch (saveErr) {
      console.warn('[Construction] Could not persist analysis, returning guest result:', saveErr);
    }

    return {
      id: `guest-${Date.now()}`,
      tool: data.tool,
      title,
      input: { ...data, image: data.image ? '[photo]' : undefined, weather: weather ?? null } as never,
      result: result as never,
      created_at: new Date().toISOString(),
      user_id: 'guest',
    };
  });

export const listAnalyses = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const request = getRequest();
      const authHeader = request?.headers?.get('authorization');
      const supabaseUrl = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'];
      const publishableKey = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['VITE_SUPABASE_PUBLISHABLE_KEY'];

      if (!authHeader || !authHeader.startsWith('Bearer ') || !supabaseUrl || !publishableKey) {
        return [];
      }

      const token = authHeader.replace('Bearer ', '');
      const client = createClient<Database>(supabaseUrl, publishableKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });

      const { data, error } = await client
        .from('construction_analyses')
        .select('*')
        .neq('tool', 'budget_design')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  });

export const deleteAnalysis = createServerFn({ method: 'POST' })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const request = getRequest();
      const authHeader = request?.headers?.get('authorization');
      const supabaseUrl = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'];
      const publishableKey = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['VITE_SUPABASE_PUBLISHABLE_KEY'];

      if (!authHeader || !authHeader.startsWith('Bearer ') || !supabaseUrl || !publishableKey) {
        return { ok: true };
      }

      const token = authHeader.replace('Bearer ', '');
      const client = createClient<Database>(supabaseUrl, publishableKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });

      await client.from('construction_analyses').delete().eq('id', data.id);
      return { ok: true };
    } catch {
      return { ok: true };
    }
  });
