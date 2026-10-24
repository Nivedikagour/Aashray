import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { generateBudgetAndDesignPlan, type BudgetDesignResult } from './budget-design.server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const inputSchema = z.object({
  totalBudgetInr: z.number().min(10_000).max(1e11),
  city: z.string().trim().min(2).max(80),
  propertyType: z.string().min(2).max(80),
  style: z.string().min(2).max(60),
  rooms: z.array(z.string()).min(1).max(12),
  priority: z.enum(['quality_materials', 'cost_effective', 'balanced', 'luxury_statement']),
  notes: z.string().max(2000).optional(),
});

/**
 * Generates an AI-driven budget allocation and interior design planning recommendation.
 * Automatically saves the recommendation to the user's account if authenticated.
 */
export const generateBudgetPlan = createServerFn({ method: 'POST' })
  .validator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const result: BudgetDesignResult = await generateBudgetAndDesignPlan(data);

    // Optional persist: if user is authenticated with Supabase, store in construction_analyses
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
          const title = `Budget & Design · ₹${(data.totalBudgetInr / 100000).toFixed(1)}L · ${data.city}`;
          const { data: row } = await client.from('construction_analyses').insert({
            user_id: userData.user.id,
            tool: 'budget_design',
            title,
            input: data as never,
            result: result as never,
          }).select().single();

          return {
            ...result,
            savedId: row?.id,
          };
        }
      }
    } catch (saveErr) {
      console.warn('[BudgetDesign] Could not persist to Supabase, returning generated result directly:', saveErr);
    }

    return result;
  });

export const listSavedBudgetPlans = createServerFn({ method: 'GET' })
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
        .eq('tool', 'budget_design')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  });
