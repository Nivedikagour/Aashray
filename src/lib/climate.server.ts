export type Weather = {
  city: string; region: string; country: string; lat: number; lon: number;
  temp: number; humidity: number; rainMm7d: number; maxTemp7d: number; minTemp7d: number; climate: string;
};

export async function getWeather(city: string): Promise<Weather> {
  const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
  const gj = (await g.json()) as { results?: Array<{ name: string; admin1?: string; country: string; latitude: number; longitude: number }> };
  const loc = gj.results?.[0];
  if (!loc) throw new Error(`We couldn't find "${city}". Try a nearby larger city.`);
  const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=7&timezone=auto`);
  const wj = (await w.json()) as { current: { temperature_2m: number; relative_humidity_2m: number }; daily: { temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[] } };
  const temp = wj.current.temperature_2m, humidity = wj.current.relative_humidity_2m;
  const rain = wj.daily.precipitation_sum.reduce((a, b) => a + (b ?? 0), 0);
  const max = Math.max(...wj.daily.temperature_2m_max), min = Math.min(...wj.daily.temperature_2m_min);
  const climate = max >= 32 && humidity >= 60 ? 'Hot & humid' : max >= 32 ? 'Hot & dry' : rain > 40 ? 'Rainy / monsoon' : min <= 10 ? 'Cold' : humidity >= 70 ? 'Mild & humid' : 'Mild & temperate';
  return { city: loc.name, region: loc.admin1 ?? '', country: loc.country, lat: loc.latitude, lon: loc.longitude, temp, humidity, rainMm7d: Math.round(rain), maxTemp7d: max, minTemp7d: min, climate };
}

export type Advice = {
  summary: string;
  materials: Array<{ name: string; why: string }>;
  furniture: Array<{ item: string; size: string; why: string; priceRangeInr: string }>;
  colors: Array<{ name: string; hex: string }>;
  avoid: string[];
  layoutTips: string[];
};

const str = { type: 'string' };
const schema = {
  type: 'object', additionalProperties: false,
  required: ['summary', 'materials', 'furniture', 'colors', 'avoid', 'layoutTips'],
  properties: {
    summary: str,
    materials: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'why'], properties: { name: str, why: str } } },
    furniture: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['item', 'size', 'why', 'priceRangeInr'], properties: { item: str, size: str, why: str, priceRangeInr: str } } },
    colors: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'hex'], properties: { name: str, hex: str } } },
    avoid: { type: 'array', items: str },
    layoutTips: { type: 'array', items: str },
  },
};

import { runStructuredAI } from './ai.server';

export async function getAdvice(input: { weather: Weather; roomType: string; areaSqm: number; style: string }): Promise<Advice> {
  const { weather: w } = input;
  const system = 'You are an interior designer for Indian homes. Give practical, climate-aware interior and furniture advice. Furniture must fit the given floor area (metric sizes). Prices in INR ranges from typical Indian retail. 4-6 materials, 5-7 furniture items, 4-5 colours with hex, 3-5 things to avoid, 3-5 layout tips. Keep each "why" to one sentence.';
  const userPrompt = `City: ${w.city}, ${w.region}, ${w.country}. Climate: ${w.climate}. Now ${w.temp}°C, humidity ${w.humidity}%. Next 7 days: ${w.minTemp7d}–${w.maxTemp7d}°C, ${w.rainMm7d} mm rain. Room: ${input.roomType}, ${input.areaSqm} m². Preferred style: ${input.style}.`;

  return await runStructuredAI<Advice>({
    system,
    userPrompt,
    schema,
    schemaName: 'interior_advice',
  });
}

