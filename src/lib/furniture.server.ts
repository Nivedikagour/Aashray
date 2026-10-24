import { runStructuredAI } from './ai.server';
import { getOnlineStoreLinks } from './stores';

export type FurnitureRecommendationInput = {
  room: string;
  style: string;
  budgetTier?: 'budget_friendly' | 'mid_range' | 'premium_luxury' | undefined;
  query?: string | undefined;
};

export type FurnitureItem = {
  id: string;
  name: string;
  category: string;
  style: string;
  dimensions: string;
  estimatedPriceInr: string;
  material: string;
  whyRecommended: string;
  imageUrl?: string | undefined;
  stores: Array<{
    id: string;
    name: string;
    badgeColor: string;
    url: string;
  }>;
};

export type FurnitureRecommendationResult = {
  summary: string;
  items: FurnitureItem[];
};

function resolveFurnitureImage(name: string, category: string): string {
  const text = `${name} ${category}`.toLowerCase();
  if (text.includes('sofa') || text.includes('couch') || text.includes('sectional')) {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('armchair') || text.includes('chair') || text.includes('lounge')) {
    return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('dining table') || text.includes('dinner')) {
    return 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('coffee table') || text.includes('side table') || text.includes('center table')) {
    return 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('bed') || text.includes('headboard') || text.includes('mattress')) {
    return 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('desk') || text.includes('work') || text.includes('study')) {
    return 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('tv') || text.includes('console') || text.includes('media') || text.includes('credenza') || text.includes('cabinet') || text.includes('storage') || text.includes('wardrobe')) {
    return 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('shelf') || text.includes('bookshelf') || text.includes('bookcase')) {
    return 'https://images.unsplash.com/photo-1594040226829-7f251ab46d80?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('light') || text.includes('lamp') || text.includes('chandelier') || text.includes('pendant')) {
    return 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('rug') || text.includes('carpet')) {
    return 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('balcony') || text.includes('patio') || text.includes('outdoor')) {
    return 'https://images.unsplash.com/photo-1519974719765-e6559eac2575?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80';
}

const systemPrompt = `You are an elite interior furniture curator and e-commerce product sourcing specialist for Indian homes.
Your role is to recommend specific, highly aesthetic furniture pieces and fixtures suited to the specified room and design aesthetic.
Ensure all recommended pieces are standard products available on major Indian home decor stores (Amazon India, Pepperfry, Urban Ladder, IKEA India, WoodenStreet).
Return realistic price ranges in INR (e.g. "₹18,000 – ₹24,000").
Always return a strict JSON format with summary and an array of items.`;

export async function recommendFurniture(input: FurnitureRecommendationInput): Promise<FurnitureRecommendationResult> {
  const queryStr = input.query ? `\nUser Specific Focus: ${input.query}` : '';
  const tierStr = input.budgetTier ? `\nBudget Tier: ${input.budgetTier}` : '\nBudget Tier: mid_range';

  const userPrompt = `
Curate 6 to 8 signature furniture pieces for:
- Room: ${input.room}
- Design Style: ${input.style}${tierStr}${queryStr}

For each furniture item, provide:
- "name": Concise product title (e.g., "Minimalist Low-Slung 3-Seater Sofa in Warm Beige", "Fluted Oak Wood TV Media Console", "Rattan Cane Accent Armchair", "Solid Sheesham Wood 6-Seater Dining Table")
- "category": Category (e.g., "Seating", "Storage & Tables", "Lighting", "Bedding", "Dining", "Accents")
- "dimensions": Practical dimensions in cm or inches (e.g., "210W x 90D x 75H cm")
- "estimatedPriceInr": Estimated typical retail price range in INR (e.g., "₹24,999 - ₹32,000")
- "material": Primary materials and finish (e.g., "Kiln-dried Sheesham wood, high-density foam, textured boucle fabric")
- "whyRecommended": 1 concise sentence on why this piece elevates the ${input.style} look and fits Indian home ergonomics.
- "storeSearchKeyword": Search keyword optimal for finding this piece on Amazon, Pepperfry, and IKEA.

Return JSON conforming to:
{
  "summary": "...",
  "items": [
    {
      "name": "...",
      "category": "...",
      "dimensions": "...",
      "estimatedPriceInr": "...",
      "material": "...",
      "whyRecommended": "...",
      "storeSearchKeyword": "..."
    }
  ]
}
`.trim();

  type RawResponse = {
    summary: string;
    items: Array<{
      name: string;
      category: string;
      dimensions: string;
      estimatedPriceInr: string;
      material: string;
      whyRecommended: string;
      storeSearchKeyword?: string;
    }>;
  };

  const raw = await runStructuredAI<RawResponse>({
    system: systemPrompt,
    userPrompt,
    schemaName: 'furniture_recommendations',
  });

  const formattedItems: FurnitureItem[] = (raw.items || []).map((item, idx) => {
    const searchKeyword = item.storeSearchKeyword || item.name;
    const storeLinks = getOnlineStoreLinks(searchKeyword, input.style);

    return {
      id: `furn-${Date.now()}-${idx}`,
      name: item.name,
      category: item.category || 'Furniture',
      style: input.style,
      dimensions: item.dimensions || 'Standard',
      estimatedPriceInr: item.estimatedPriceInr,
      material: item.material,
      whyRecommended: item.whyRecommended,
      imageUrl: resolveFurnitureImage(item.name, item.category),
      stores: storeLinks,
    };
  });

  return {
    summary: raw.summary || `Curated ${input.style} furniture collection for ${input.room}.`,
    items: formattedItems,
  };
}
