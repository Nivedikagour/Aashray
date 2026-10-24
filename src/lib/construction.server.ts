import { getWeather, type Weather } from './climate.server';

export type ToolId = 'safety' | 'cracks' | 'valuation' | 'planning' | 'weather' | 'assistant';

type ContentPart = { type: 'input_text'; text: string } | { type: 'input_image'; image_url: string };

const str = { type: 'string' };

const schemas: Record<ToolId, object> = {
  safety: {
    type: 'object', additionalProperties: false,
    required: ['riskLevel', 'summary', 'hazards', 'ppe', 'immediate'],
    properties: {
      riskLevel: { type: 'string', enum: ['Low', 'Moderate', 'High', 'Critical'] },
      summary: str,
      hazards: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['hazard', 'severity', 'fix'], properties: { hazard: str, severity: { type: 'string', enum: ['Low', 'Medium', 'High'] }, fix: str } } },
      ppe: { type: 'array', items: str },
      immediate: { type: 'array', items: str },
    },
  },
  cracks: {
    type: 'object', additionalProperties: false,
    required: ['summary', 'cracks', 'urgency', 'monitor'],
    properties: {
      summary: str,
      cracks: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'severity', 'cause', 'repair'], properties: { type: str, severity: { type: 'string', enum: ['Cosmetic', 'Moderate', 'Structural'] }, cause: str, repair: str } } },
      urgency: { type: 'string', enum: ['Monitor', 'Repair soon', 'Urgent — engineer review'] },
      monitor: { type: 'array', items: str },
    },
  },
  valuation: {
    type: 'object', additionalProperties: false,
    required: ['estimateInr', 'rangeLowInr', 'rangeHighInr', 'ratePerSqftInr', 'factors', 'outlook'],
    properties: {
      estimateInr: str, rangeLowInr: str, rangeHighInr: str, ratePerSqftInr: str,
      factors: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['factor', 'impact'], properties: { factor: str, impact: str } } },
      outlook: str,
    },
  },
  planning: {
    type: 'object', additionalProperties: false,
    required: ['summary', 'phases', 'risks', 'tips'],
    properties: {
      summary: str,
      phases: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'durationWeeks', 'costInr', 'tasks'], properties: { name: str, durationWeeks: { type: 'number' }, costInr: str, tasks: { type: 'array', items: str } } } },
      risks: { type: 'array', items: str },
      tips: { type: 'array', items: str },
    },
  },
  weather: {
    type: 'object', additionalProperties: false,
    required: ['summary', 'workWindow', 'precautions', 'materials'],
    properties: {
      summary: str,
      workWindow: str,
      precautions: { type: 'array', items: str },
      materials: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['material', 'advice'], properties: { material: str, advice: str } } },
    },
  },
  assistant: {
    type: 'object', additionalProperties: false,
    required: ['answer', 'steps', 'cautions'],
    properties: {
      answer: str,
      steps: { type: 'array', items: str },
      cautions: { type: 'array', items: str },
    },
  },
};

const systems: Record<ToolId, string> = {
  safety: 'You are a construction site safety officer for Indian sites. Analyze the site photo and notes. Identify visible hazards (fall risks, electrical, scaffolding, housekeeping, PPE gaps). Give 3-8 hazards with a one-sentence fix each, required PPE, and 2-5 immediate actions. Be practical and specific to what is visible; do not invent details not supported by the input.',
  cracks: 'You are a structural engineer inspecting cracks in Indian buildings. Analyze the photo and context. Classify each visible crack (hairline, settlement, thermal, structural shear, etc.), its severity, likely cause, and a repair method. Give an overall urgency and 2-5 monitoring tips. Be conservative: when in doubt, recommend a structural engineer.',
  valuation: 'You are a real estate valuer for the Indian market. Estimate the property value in INR using typical market rates for the city and property type. Give a point estimate, a realistic low-high range, an approximate rate per sq ft, 4-6 value factors with impact, and a one-paragraph outlook. Use Indian numbering (lakh/crore) in the strings.',
  planning: 'You are a construction project planner for India. Build a phase plan for the given project: 5-8 phases (design/approvals, excavation, foundation, structure, masonry, MEP, finishing, handover as applicable) each with duration in weeks, an estimated cost in INR that sums roughly to the budget, and 2-4 key tasks. Add 3-5 risks and 3-5 practical tips. Costs in lakh/crore strings.',
  weather: 'You are a construction planning advisor. Given live weather and the planned work, advise on the best work window this week, 3-6 site precautions, and 3-5 material handling/storage tips suited to the conditions. Be concrete (curing, concreting, painting, excavation).',
  assistant: 'You are a construction knowledge assistant for Indian sites and homes. Answer the question clearly and practically: a direct answer paragraph, 3-6 actionable steps, and 1-4 cautions or standards notes (mention relevant IS codes only when confident).',
};

import { runStructuredAI, type AIContentPart } from './ai.server';

async function callAI(tool: ToolId, userContent: ContentPart[]): Promise<Record<string, unknown>> {
  const parts: AIContentPart[] = userContent.map((c) => {
    if (c.type === 'input_image') {
      return { type: 'image', dataUrl: c.image_url };
    }
    return { type: 'text', text: c.text };
  });

  return await runStructuredAI<Record<string, unknown>>({
    system: systems[tool],
    parts,
    schema: schemas[tool],
    schemaName: `construction_${tool}`,
  });
}


export type AnalysisInput = {
  tool: ToolId;
  image?: string | undefined; // data URL
  notes?: string | undefined;
  city?: string | undefined;
  propertyType?: string | undefined;
  areaSqft?: number | undefined;
  ageYears?: number | undefined;
  projectType?: string | undefined;
  areaSqm?: number | undefined;
  budgetInr?: number | undefined;
  months?: number | undefined;
  work?: string | undefined;
  question?: string | undefined;
};

export async function runAnalysis(input: AnalysisInput): Promise<{ title: string; result: Record<string, unknown>; weather?: Weather }> {
  const text = (t: string): ContentPart => ({ type: 'input_text', text: t });
  switch (input.tool) {
    case 'safety': {
      if (!input.image) throw new Error('Please add a site photo.');
      const parts: ContentPart[] = [text(`Site notes: ${input.notes || 'none provided'}. Analyze this construction site photo for safety.`), { type: 'input_image', image_url: input.image }];
      return { title: 'Site safety check', result: await callAI('safety', parts) };
    }
    case 'cracks': {
      if (!input.image) throw new Error('Please add a photo of the crack.');
      const parts: ContentPart[] = [text(`Context: ${input.notes || 'none provided'}. Analyze the cracks visible in this photo.`), { type: 'input_image', image_url: input.image }];
      return { title: 'Crack analysis', result: await callAI('cracks', parts) };
    }
    case 'valuation': {
      const parts = [text(`City: ${input.city}. Property type: ${input.propertyType}. Built-up area: ${input.areaSqft} sq ft. Age: ${input.ageYears} years. Notes: ${input.notes || 'none'}. Estimate the market value.`)];
      return { title: `Valuation · ${input.city}`, result: await callAI('valuation', parts) };
    }
    case 'planning': {
      const parts = [text(`Project: ${input.projectType}. Built-up area: ${input.areaSqm} m². Budget: ₹${input.budgetInr}. Target duration: ${input.months} months. Notes: ${input.notes || 'none'}. Build the phase plan.`)];
      return { title: `Plan · ${input.projectType}`, result: await callAI('planning', parts) };
    }
    case 'weather': {
      const w = await getWeather(input.city!);
      const parts = [text(`City: ${w.city}, ${w.region}, ${w.country}. Now ${w.temp}°C, humidity ${w.humidity}%. Next 7 days: ${w.minTemp7d}–${w.maxTemp7d}°C, ${w.rainMm7d} mm rain. Planned work: ${input.work}. Advise on scheduling and precautions.`)];
      return { title: `Weather advisory · ${w.city}`, result: await callAI('weather', parts), weather: w };
    }
    case 'assistant': {
      const parts = [text(`Question: ${input.question}${input.notes ? `\nContext: ${input.notes}` : ''}`)];
      return { title: 'Site assistant', result: await callAI('assistant', parts) };
    }
  }
}
