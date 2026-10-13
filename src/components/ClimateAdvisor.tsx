import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { CloudSun, Droplets, Loader2, Thermometer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { deleteSuggestion, generateSuggestion, listSuggestions } from '@/lib/climate.functions';
import type { Advice, Weather } from '@/lib/climate.server';

export function ClimateAdvisor() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (signedIn === null) return <p className="mt-6 text-sm text-muted-foreground">Loading…</p>;
  if (!signedIn) return <section className="mt-7 rounded-xl border border-border bg-card p-6"><CloudSun className="mb-3 text-primary" /><h2 className="text-lg font-semibold">Design for your weather</h2><p className="mt-1 text-sm text-muted-foreground">Sign in to get interior and furniture suggestions based on your city's climate and room size.</p><Button asChild className="mt-4"><Link to="/auth">Sign in to start</Link></Button></section>;
  return <Advisor />;
}

function Advisor() {
  const qc = useQueryClient();
  const list = useServerFn(listSuggestions);
  const gen = useServerFn(generateSuggestion);
  const del = useServerFn(deleteSuggestion);
  const { data: saved = [] } = useQuery({ queryKey: ['climate'], queryFn: () => list() });
  const [city, setCity] = useState('Mumbai');
  const [roomType, setRoomType] = useState('Living room');
  const [area, setArea] = useState('18');
  const [style, setStyle] = useState('Japandi');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const current = saved.find(s => s.id === openId) ?? saved[0];

  const run = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const row = await gen({ data: { city, roomType, areaSqm: Number(area), style } }); await qc.invalidateQueries({ queryKey: ['climate'] }); setOpenId(row.id); }
    catch (x) { setErr(x instanceof Error ? x.message : 'Something went wrong.'); }
    setBusy(false);
  };

  return <section className="mt-7 grid gap-6">
    <form onSubmit={run} className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-5 sm:items-end">
      <label className="text-xs">City<input className="form-field" required value={city} onChange={e => setCity(e.target.value)} /></label>
      <label className="text-xs">Room<select className="form-field" value={roomType} onChange={e => setRoomType(e.target.value)}>{['Living room', 'Bedroom', 'Kitchen', 'Dining', 'Home office', 'Balcony', 'Bathroom'].map(r => <option key={r}>{r}</option>)}</select></label>
      <label className="text-xs">Area (m²)<input className="form-field" type="number" min="2" step="0.5" required value={area} onChange={e => setArea(e.target.value)} /></label>
      <label className="text-xs">Style<select className="form-field" value={style} onChange={e => setStyle(e.target.value)}>{['Japandi', 'Modern Indian', 'Contemporary', 'Minimalist', 'Scandinavian', 'Traditional Indian', 'Bohemian'].map(s => <option key={s}>{s}</option>)}</select></label>
      <Button disabled={busy}>{busy ? <><Loader2 className="animate-spin" />Thinking…</> : <>Get suggestions</>}</Button>
    </form>
    {err && <p className="text-sm text-destructive">{err}</p>}
    {current && <Result row={current} />}
    {saved.length > 0 && <div><h3 className="mb-3 text-sm font-semibold">Saved suggestions</h3><div className="divide-y divide-border rounded-xl border border-border bg-card">{saved.map(s => <div key={s.id} className="flex items-center gap-3 p-3 text-xs"><Button variant="ghost" className="h-auto flex-1 justify-start p-1 text-left" onClick={() => setOpenId(s.id)}><span className="font-semibold">{s.room_type}</span> · {s.city} · {Number(s.area_sqm)} m² · {s.style}</Button><span className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString('en-IN')}</span><Button variant="ghost" size="icon" aria-label="Delete suggestion" onClick={async () => { await del({ data: { id: s.id } }); qc.invalidateQueries({ queryKey: ['climate'] }); }}><Trash2 size={14} /></Button></div>)}</div></div>}
  </section>;
}

function Result({ row }: { row: { city: string; room_type: string; area_sqm: number; style: string; weather: unknown; result: unknown } }) {
  const w = row.weather as Weather; const a = row.result as Advice;
  return <article className="rounded-xl border border-border bg-card p-6">
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="rounded-full bg-sage-soft px-3 py-1 font-semibold text-primary">{w.climate}</span>
      <span className="flex items-center gap-1"><Thermometer size={13} />{w.temp}°C now · {w.minTemp7d}–{w.maxTemp7d}°C this week</span>
      <span className="flex items-center gap-1"><Droplets size={13} />{w.humidity}% humidity · {w.rainMm7d} mm rain</span>
    </div>
    <h2 className="mt-4 text-lg font-semibold">{row.room_type} in {w.city} · {Number(row.area_sqm)} m² · {row.style}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{a.summary}</p>
    <div className="mt-4 flex flex-wrap gap-2">{a.colors.map(c => <span key={c.hex} className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[11px]"><span className="h-3 w-3 rounded-full border border-border" style={{ background: c.hex }} />{c.name}</span>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div><h3 className="mb-2 text-sm font-semibold">Furniture that fits</h3><ul className="space-y-3">{a.furniture.map(f => <li key={f.item} className="text-xs"><div className="flex justify-between gap-3"><strong>{f.item}</strong><span className="text-primary">{f.priceRangeInr}</span></div><div className="text-muted-foreground">{f.size} — {f.why}</div></li>)}</ul></div>
      <div><h3 className="mb-2 text-sm font-semibold">Climate-smart materials</h3><ul className="space-y-3">{a.materials.map(m => <li key={m.name} className="text-xs"><strong>{m.name}</strong><div className="text-muted-foreground">{m.why}</div></li>)}</ul></div>
      <div><h3 className="mb-2 text-sm font-semibold">Layout tips</h3><ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">{a.layoutTips.map(t => <li key={t}>{t}</li>)}</ul></div>
      <div><h3 className="mb-2 text-sm font-semibold">Avoid</h3><ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">{a.avoid.map(t => <li key={t}>{t}</li>)}</ul></div>
    </div>
    <p className="mt-5 text-[10px] text-muted-foreground">AI suggestions from live weather. Prices are typical ranges, not retailer quotes.</p>
  </article>;
}
