import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { recommendFurniture, type FurnitureRecommendationResult } from './furniture.server';

const inputSchema = z.object({
  room: z.string().min(2).max(60),
  style: z.string().min(2).max(60),
  budgetTier: z.enum(['budget_friendly', 'mid_range', 'premium_luxury']).optional(),
  query: z.string().max(200).optional(),
});

export const getFurnitureRecommendations = createServerFn({ method: 'POST' })
  .validator((d) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<FurnitureRecommendationResult> => {
    return await recommendFurniture({
      room: data.room,
      style: data.style,
      budgetTier: data.budgetTier,
      query: data.query,
    });
  });
