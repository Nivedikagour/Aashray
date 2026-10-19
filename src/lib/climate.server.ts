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

// AI provider: Lovable AI Gateway when hosted on Lovable, otherwise a direct
// OpenAI key (self-hosted). Both expose the same /v1/responses API.
function aiConfig(): { url: string; headers: Record<string, string>; model: string } {
  const lovableKey = process.env['LOVABLE_API_KEY'];
  if (lovableKey) {
    return {
      url: 'https://ai.gateway.lovable.dev/v1/responses',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lovableKey}`, 'Lovable-API-Key': lovableKey, 'X-Lovable-AIG-SDK': 'fetch' },
      model: 'openai/gpt-6-astra',
    };
  }
  const openaiKey = process.env['OPENAI_API_KEY'];
  if (openaiKey) {
    return {
      url: 'https://api.openai.com/v1/responses',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      model: 'gpt-4o',
    };
  }
  throw new Error('AI is not configured. Set LOVABLE_API_KEY or OPENAI_API_KEY.');
}

export async function getAdvice(input: { weather: Weather; roomType: string; areaSqm: number; style: string }): Promise<Advice> {
  const ai = aiConfig();
  const { weather: w } = input;
  const res = await fetch(ai.url, {
    method: 'POST',
    headers: ai.headers,
    body: JSON.stringify({
      model: ai.model, stream: true, store: false, reasoning: { effort: 'low' },
      text: { format: { type: 'json_schema', name: 'interior_advice', strict: true, schema } },
      input: [
        { role: 'system', content: 'You are an interior designer for Indian homes. Give practical, climate-aware interior and furniture advice. Furniture must fit the given floor area (metric sizes). Prices in INR ranges from typical Indian retail. 4-6 materials, 5-7 furniture items, 4-5 colours with hex, 3-5 things to avoid, 3-5 layout tips. Keep each "why" to one sentence.' },
        { role: 'user', content: `City: ${w.city}, ${w.region}, ${w.country}. Climate: ${w.climate}. Now ${w.temp}°C, humidity ${w.humidity}%. Next 7 days: ${w.minTemp7d}–${w.maxTemp7d}°C, ${w.rainMm7d} mm rain. Room: ${input.roomType}, ${input.areaSqm} m². Preferred style: ${input.style}.` },
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
  if (!out) throw new Error('The AI returned no suggestions. Please try again.');
  return JSON.parse(out) as Advice;
}
