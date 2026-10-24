import { runStructuredAI, type AIContentPart } from './ai.server';
import { getOnlineStoreLinks, type OnlineStore } from './stores';

export type FloorPlanMode = 'floorplan' | 'room_photo';

export type RoomDesign = {
  roomName: string;
  dimensions: string;
  zoning: string;
  furniture: Array<{
    item: string;
    placement: string;
    size: string;
    estPriceInr: string;
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
    return {
      roomName: r.roomName || `Room ${idx + 1}`,
      dimensions: r.dimensions || 'Approx 15 x 12 ft',
      zoning: r.zoning || 'Residential Living Space',
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
