import { runStructuredAI } from './ai.server';

export type BudgetDesignInput = {
  totalBudgetInr: number;
  city: string;
  propertyType: string;
  style: string;
  rooms: string[];
  priority: 'quality_materials' | 'cost_effective' | 'balanced' | 'luxury_statement';
  notes?: string | undefined;
};

export type RoomAllocation = {
  room: string;
  sharePercentage: number;
  amountInr: number;
  priority: 'High' | 'Medium' | 'Low';
  keyItems: Array<{
    item: string;
    estimatedInr: string;
    note: string;
  }>;
  costSavingTip: string;
};

export type PhasePlan = {
  phase: string;
  timeframe: string;
  sharePercentage: number;
  amountInr: number;
  description: string;
  milestones: string[];
};

export type DesignGuidance = {
  palette: Array<{ name: string; hex: string; role: string }>;
  recommendedMaterials: Array<{ name: string; where: string; estRateSqft: string; why: string }>;
  splurgeVsSave: Array<{ area: string; recommendation: 'Splurge' | 'Save'; rationale: string }>;
};

export type BudgetDesignResult = {
  summary: string;
  totalBudgetInr: number;
  contingencyInr: number;
  spendableBudgetInr: number;
  allocations: RoomAllocation[];
  phasedPlan: PhasePlan[];
  designGuidance: DesignGuidance;
  cityInsights: string;
};

const systemPrompt = `You are an elite interior architect and financial cost consultant specializing in Indian homes and modern interior design.
Your task is to generate realistic, actionable, and aesthetic budget & design planning recommendations powered by AI.

All monetary estimates must be realistic for the Indian interior market (custom carpentry, modular units, retail furniture, lighting, painting, and soft furnishings).
Calculate room allocations so that the sum of room amounts plus the contingency reserve equals the total budget.
Ensure material picks are climate-appropriate for the specified Indian city (e.g. moisture resistance in coastal cities like Mumbai/Chennai, dust/heat mitigation in Delhi NCR/Jaipur).
Always return strict JSON format conforming to the requested schema.`;

export async function generateBudgetAndDesignPlan(input: BudgetDesignInput): Promise<BudgetDesignResult> {
  const roomsList = input.rooms && input.rooms.length > 0 ? input.rooms.join(', ') : 'Living room, Master bedroom, Modular kitchen, Dining area';
  const notesStr = input.notes ? `\nClient Specific Notes & Requirements: ${input.notes}` : '';

  const userPrompt = `
Generate a comprehensive interior design and budget allocation plan for the following project:
- Total Budget: ₹${input.totalBudgetInr.toLocaleString('en-IN')} INR
- City / Region: ${input.city}
- Property Type: ${input.propertyType}
- Design Direction / Aesthetic: ${input.style}
- Scope of Spaces: ${roomsList}
- Spending Strategy / Priority: ${input.priority}
${notesStr}

Please return a JSON object with:
1. "summary": Executive overview explaining how this budget achieves the ${input.style} look in ${input.city}.
2. "totalBudgetInr": ${input.totalBudgetInr}
3. "contingencyInr": Number representing an 8% to 10% reserve for unforeseen site surprises or electrical/plumbing adjustments.
4. "spendableBudgetInr": Number representing the remaining budget allocated to rooms.
5. "allocations": Array of objects for each space (${roomsList}), each with:
   - "room": string name of space
   - "sharePercentage": number (e.g., 35)
   - "amountInr": number (in INR)
   - "priority": "High" | "Medium" | "Low"
   - "keyItems": array of 3-5 items with "item", "estimatedInr" (e.g., "₹45,000 - ₹55,000"), "note" (why it fits the style)
   - "costSavingTip": 1 sentence smart saving hack without sacrificing aesthetics
6. "phasedPlan": 3-4 phased implementation roadmap (e.g., Phase 1: Civil/Modular, Phase 2: Fixed Furniture & Electrical, Phase 3: Loose Furniture & Soft Furnishings), with "phase", "timeframe", "sharePercentage", "amountInr", "description", "milestones" (array of strings).
7. "designGuidance":
   - "palette": 4-5 complementary colors with "name", "hex", and "role" (e.g., "Primary wall", "Accent", "Wood tone")
   - "recommendedMaterials": 3-5 materials with "name", "where", "estRateSqft" (in INR/sq ft), "why"
   - "splurgeVsSave": 3-4 strategic pairs of items where "area" is identified with "recommendation" ("Splurge" or "Save") and "rationale"
8. "cityInsights": 2-3 sentences regarding local material sourcing, labor rates, and climate considerations for ${input.city}.
`.trim();

  return await runStructuredAI<BudgetDesignResult>({
    system: systemPrompt,
    userPrompt,
    schemaName: 'budget_design_recommendations',
  });
}
