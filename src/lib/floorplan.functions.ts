import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { analyzeFloorPlanOrRoom, type FloorPlanAnalysisResult } from './floorplan.server';

const inputSchema = z.object({
  image: z.string().startsWith('data:image/').max(8_000_000),
  mode: z.enum(['floorplan', 'room_photo']),
  style: z.string().min(2).max(60),
  notes: z.string().max(2000).optional(),
});

export const generateFloorPlanDesign = createServerFn({ method: 'POST' })
  .validator((d) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<FloorPlanAnalysisResult> => {
    return await analyzeFloorPlanOrRoom({
      image: data.image,
      mode: data.mode,
      style: data.style,
      notes: data.notes,
    });
  });
