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

async function callAI(tool: ToolId, userContent: ContentPart[]): Promise<Record<string, unknown>> {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error('AI is not configured.');
  const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'Lovable-API-Key': key, 'X-Lovable-AIG-SDK': 'fetch' },
    body: JSON.stringify({
      model: 'openai/gpt-6-astra', stream: true, store: false, reasoning: { effort: 'low' },
      text: { format: { type: 'json_schema', name: `construction_${tool}`, strict: true, schema: schemas[tool] } },
      input: [
        { role: 'system', content: systems[tool] },
        { role: 'user', content: userContent },
      ],
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => '');
    if (res.status === 429) throw new Error('Too many requests right now. Please wait a minute and try again.');
    if (res.status === 402) throw new Error('AI credits have run out for this workspace.');
    throw new Error(`AI request failed (${res.status}). ${t.slice(0, 200)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '', out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const ev = JSON.parse(data) as { type?: string; delta?: string; response?: { error?: { message?: string } } };
        if (ev.type === 'response.output_text.delta' && ev.delta) out += ev.delta;
        if (ev.type === 'response.failed' || ev.type === 'error') throw new Error(ev.response?.error?.message ?? 'AI could not finish.');
      } catch (e) { if (e instanceof Error && e.message.startsWith('AI')) throw e; }
    }
  }
  if (!out) throw new Error('The AI returned no analysis. Please try again.');
  return JSON.parse(out) as Record<string, unknown>;
}

export type AnalysisInput = {
  tool: ToolId;
  image?: string; // data URL
  notes?: string;
  city?: string;
  propertyType?: string;
  areaSqft?: number;
  ageYears?: number;
  projectType?: string;
  areaSqm?: number;
  budgetInr?: number;
  months?: number;
  work?: string;
  question?: string;
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
