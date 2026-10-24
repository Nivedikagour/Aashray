import { runStructuredAI, type AIContentPart } from './ai.server';
import { getOnlineStoreLinks, type OnlineStore } from './stores';

export type FloorPlanMode = 'floorplan' | 'room_photo';

export type RoomDesign = {
  roomName: string;
  dimensions: string;
  zoning: string;
  imageUrl?: string;
  furniture: Array<{
    item: string;
    placement: string;
    size: string;
    estPriceInr: string;
    imageUrl?: string;
    stores: OnlineStore[];
  }>;
  materialsAndFinishes: string;
  lightingStrategy: string;
  colorPalette: Array<{ name: string; hex: string; role: string }>;
  threeDPlacement: {
    x: number;
    z: number;
    width: number;
    depth: number;
    color: string;
  };
};

export type Free3DTool = {
  name: string;
  description: string;
  badge: string;
  url: string;
  howToUse: string;
};

export type FloorPlanAnalysisResult = {
  mode: FloorPlanMode;
  projectTitle: string;
  overallSummary: string;
  structuralObservations: string[];
  threeDViewDescription: string;
  rooms: RoomDesign[];
  freeTools: Free3DTool[];
  recommendedRenovationSteps: string[];
};

const freeToolsList: Free3DTool[] = [
  {
    name: 'Sweet Home 3D',
    description: '100% Free & Open Source tool to import 2D floor plan images, trace architectural walls, and generate real-time 3D walkthroughs.',
    badge: 'Open Source / Free',
    url: 'http://www.sweethome3d.com/importEnclosure.jsp',
    howToUse: 'Go to Plan → Import Background Image, upload your floor plan, set scale, and it automatically builds the 3D house view.',
  },
  {
    name: 'Planner 5D AI Floor Plan Recognizer',
    description: 'Free AI scanner that automatically converts 2D blueprints into an interactive 3D building with furnished rooms.',
    badge: 'AI Powered / Free Tier',
    url: 'https://planner5d.com/',
    howToUse: 'Click "Upload Plan" → select your drawing. The AI detects walls and creates an interactive 3D house model.',
  },
  {
    name: 'Floorplanner',
    description: 'Cloud-based 2D to 3D house builder. Upload image sketches as a backdrop and click 3D for photorealistic rendering.',
    badge: 'Web Browser / Free Tier',
    url: 'https://floorplanner.com/',
    howToUse: 'Create free account → upload 2D drawing as trace layer → view instant 3D isometric & interior cameras.',
  },
  {
    name: 'RoomGPT / Interior AI',
    description: 'Upload actual room photos to get photorealistic 3D interior design renders and virtual staging.',
    badge: 'AI Vision / Free Tier',
    url: 'https://www.roomgpt.io/',
    howToUse: 'Upload your room photo, select the style (Japandi, Modern), and it generates high-definition 3D redesigned perspectives.',
  },
];

export function resolveRoomImage(roomName: string, style: string = ''): string {
  const r = `${roomName} ${style}`.toLowerCase();
  if (r.includes('bed') || r.includes('master') || r.includes('guest')) {
    return 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80';
  }
  if (r.includes('kitchen') || r.includes('pantry') || r.includes('cooking')) {
    return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80';
  }
  if (r.includes('dining')) {
    return 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=80';
  }
  if (r.includes('bath') || r.includes('washroom') || r.includes('toilet') || r.includes('powder')) {
    return 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1000&q=80';
  }
  if (r.includes('study') || r.includes('office') || r.includes('work') || r.includes('library')) {
    return 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1000&q=80';
  }
  if (r.includes('balcony') || r.includes('terrace') || r.includes('deck') || r.includes('patio') || r.includes('verandah')) {
    return 'https://images.unsplash.com/photo-1519974719765-e6559eac2575?auto=format&fit=crop&w=1000&q=80';
  }
  if (r.includes('pooja') || r.includes('mandir') || r.includes('prayer') || r.includes('meditation')) {
    return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80';
  }
  return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80';
}

export function resolveFurnitureImage(itemName: string, roomName: string = ''): string {
  const text = `${itemName} ${roomName}`.toLowerCase();
  if (text.includes('sofa') || text.includes('couch') || text.includes('sectional') || text.includes('diwan') || text.includes('loveseat')) {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('armchair') || text.includes('chair') || text.includes('lounge') || text.includes('recliner') || text.includes('pouffe') || text.includes('ottoman')) {
    return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('dining table') || text.includes('dinner table') || text.includes('dining set')) {
    return 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('coffee table') || text.includes('center table') || text.includes('tea table')) {
    return 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('side table') || text.includes('nightstand') || text.includes('bedside') || text.includes('end table')) {
    return 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('bed') || text.includes('king') || text.includes('queen') || text.includes('headboard') || text.includes('mattress')) {
    return 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('desk') || text.includes('study table') || text.includes('workstation')) {
    return 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('tv') || text.includes('console') || text.includes('media') || text.includes('credenza') || text.includes('cabinet') || text.includes('sideboard') || text.includes('entertainment')) {
    return 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('wardrobe') || text.includes('closet') || text.includes('almirah')) {
    return 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('bookshelf') || text.includes('shelf') || text.includes('racks') || text.includes('display unit')) {
    return 'https://images.unsplash.com/photo-1594040226829-7f251ab46d80?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('light') || text.includes('lamp') || text.includes('chandelier') || text.includes('pendant') || text.includes('sconce')) {
    return 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('rug') || text.includes('carpet') || text.includes('dhurrie') || text.includes('mat')) {
    return 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('mirror') || text.includes('vanity')) {
    return 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('plant') || text.includes('planter') || text.includes('vase')) {
    return 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80';
}

export async function analyzeFloorPlanOrRoom(input: {
  image: string; // base64 data URL
  mode: FloorPlanMode;
  style: string;
  notes?: string | undefined;
}): Promise<FloorPlanAnalysisResult> {
  const isFloorPlan = input.mode === 'floorplan';

  const system = `You are an elite architectural technologist, building information modeling (BIM) specialist, and interior architect.
You specialize in translating 2D floor plans, house map drawings, and room photos into comprehensive 3D interior layouts, spatial planning, and furniture placements.
You understand Indian residential architecture (Vastu considerations, cross-ventilation, load-bearing vs partition walls, metric/sqft dimensions, and practical Indian ergonomics).
Always return strict JSON format with comprehensive details.`;

  const userPromptText = isFloorPlan
    ? `Analyze this uploaded 2D floor plan / architectural house drawing.
Preferred Interior Style: ${input.style}
${input.notes ? `User Notes: ${input.notes}` : ''}

Tasks:
1. Identify all zones and rooms (e.g. Living Room, Master Bedroom, Kitchen, Dining, Balconies, Bathrooms).
2. For each room, provide functional zoning, realistic dimensions, recommended furniture pieces with dimensions and pricing in INR, lighting strategy, and a curated color palette with hex codes.
3. Provide approximate 3D isometric placement coordinates (x: -5 to 5, z: -5 to 5, width: 2 to 5, depth: 2 to 5, and a hex color code) so an interactive 3D canvas can render the house model.
4. Describe the overall 3D architectural perspective and cutaway view of the building.
5. Provide actionable renovation and execution steps.

Return JSON conforming to:
{
  "projectTitle": "...",
  "overallSummary": "...",
  "structuralObservations": ["...", "..."],
  "threeDViewDescription": "...",
  "recommendedRenovationSteps": ["...", "..."],
  "rooms": [
    {
      "roomName": "...",
      "dimensions": "...",
      "zoning": "...",
      "materialsAndFinishes": "...",
      "lightingStrategy": "...",
      "colorPalette": [{ "name": "...", "hex": "#...", "role": "..." }],
      "threeDPlacement": { "x": 0, "z": 0, "width": 4, "depth": 3, "color": "#e2e8f0" },
      "furniture": [
        { "item": "...", "placement": "...", "size": "...", "estPriceInr": "₹..." }
      ]
    }
  ]
}`
    : `Analyze this uploaded room photograph.
Preferred Redesign Style: ${input.style}
${input.notes ? `User Notes: ${input.notes}` : ''}

Tasks:
1. Analyze existing structural elements (visible walls, flooring, natural lighting, window orientation, ceiling).
2. Provide a transformed interior design concept reimagining this room in the ${input.style} aesthetic.
3. Recommend specific furniture pieces with exact placement, sizing, and typical Indian retail price ranges in INR.
4. Describe how the room looks in an imagined 3D wide-angle perspective view.
5. Recommend a color palette, materials, lighting scheme, and renovation execution tips.

Return JSON conforming to:
{
  "projectTitle": "...",
  "overallSummary": "...",
  "structuralObservations": ["...", "..."],
  "threeDViewDescription": "...",
  "recommendedRenovationSteps": ["...", "..."],
  "rooms": [
    {
      "roomName": "...",
      "dimensions": "...",
      "zoning": "...",
      "materialsAndFinishes": "...",
      "lightingStrategy": "...",
      "colorPalette": [{ "name": "...", "hex": "#...", "role": "..." }],
      "threeDPlacement": { "x": 0, "z": 0, "width": 5, "depth": 4, "color": "#dcfce7" },
      "furniture": [
        { "item": "...", "placement": "...", "size": "...", "estPriceInr": "₹..." }
      ]
    }
  ]
}`;

  const parts: AIContentPart[] = [
    { type: 'text', text: userPromptText },
    { type: 'image', dataUrl: input.image },
  ];

  type RawFloorPlanResponse = {
    projectTitle: string;
    overallSummary: string;
    structuralObservations: string[];
    threeDViewDescription: string;
    recommendedRenovationSteps: string[];
    rooms: Array<{
      roomName: string;
      dimensions: string;
      zoning: string;
      materialsAndFinishes: string;
      lightingStrategy: string;
      colorPalette: Array<{ name: string; hex: string; role: string }>;
      threeDPlacement?: { x: number; z: number; width: number; depth: number; color: string };
      furniture: Array<{ item: string; placement: string; size: string; estPriceInr: string }>;
    }>;
  };

  const raw = await runStructuredAI<RawFloorPlanResponse>({
    system,
    parts,
    schemaName: isFloorPlan ? 'floor_plan_3d_design' : 'room_photo_redesign',
  });

  const roomsWithStoreLinks: RoomDesign[] = (raw.rooms || []).map((r, idx) => {
    const roomName = r.roomName || `Room ${idx + 1}`;
    return {
      roomName,
      dimensions: r.dimensions || 'Approx 15 x 12 ft',
      zoning: r.zoning || 'Residential Living Space',
      imageUrl: resolveRoomImage(roomName, input.style),
      materialsAndFinishes: r.materialsAndFinishes || 'Hardwood / vitrified tile flooring, matte emulsion paint',
      lightingStrategy: r.lightingStrategy || 'Warm ambient cove lighting with task accent spots',
      colorPalette: r.colorPalette || [
        { name: 'Warm Cream', hex: '#fdfbf7', role: 'Walls' },
        { name: 'Sage Green', hex: '#a3b18a', role: 'Accent' },
        { name: 'Muted Oak', hex: '#d4a373', role: 'Woodwork' },
      ],
      threeDPlacement: r.threeDPlacement || {
        x: (idx % 2 === 0 ? -1 : 1) * 2.5,
        z: Math.floor(idx / 2) * 3 - 2,
        width: 3.5,
        depth: 3,
        color: idx === 0 ? '#dcfce7' : idx === 1 ? '#e0e7ff' : '#fef3c7',
      },
      furniture: (r.furniture || []).map((f) => ({
        item: f.item,
        placement: f.placement,
        size: f.size,
        estPriceInr: f.estPriceInr || '₹15,000 – ₹25,000',
        imageUrl: resolveFurnitureImage(f.item, roomName),
        stores: getOnlineStoreLinks(f.item, input.style),
      })),
    };
  });

  return {
    mode: input.mode,
    projectTitle: raw.projectTitle || (isFloorPlan ? '3D Floor Plan Architecture & Layout' : 'AI Room Interior Redesign'),
    overallSummary: raw.overallSummary || 'Comprehensive spatial analysis and 3D architectural interior recommendations.',
    structuralObservations: raw.structuralObservations || ['Optimal room proportions', 'Ample natural daylight along perimeter walls'],
    threeDViewDescription: raw.threeDViewDescription || 'Open-plan 3D isometric cutaway displaying cohesive flooring, furnished zones, and warm architectural lighting.',
    recommendedRenovationSteps: raw.recommendedRenovationSteps || ['1. Review wall structural stability', '2. Rough-in electrical & plumbing points', '3. Install modular fixed cabinetry', '4. Place loose furniture'],
    rooms: roomsWithStoreLinks,
    freeTools: freeToolsList,
  };
}
