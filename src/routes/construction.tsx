import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, Building2, CloudSun, HardHat, IndianRupee, Loader2, MessagesSquare, Ruler, ScanSearch, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { deleteAnalysis, generateAnalysis, listAnalyses } from '@/lib/construction.functions';
import type { Weather } from '@/lib/climate.server';

export const Route = createFileRoute('/construction')({
  head: () => ({ meta: [
    { title: 'Construction intelligence · SpaceCraft AI' },
    { name: 'description', content: 'AI-powered site safety checks, crack analysis, property valuation, project planning and weather-aware advisory for construction.' },
    { property: 'og:title', content: 'Construction intelligence · SpaceCraft AI' },
    { property: 'og:description', content: 'Multimodal AI decision support for construction planning, execution and monitoring.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ConstructionPage,
});

const tools = [
  { id: 'safety', label: 'Site safety', icon: HardHat, blurb: 'Photo-based hazard scan with PPE and immediate actions.' },
  { id: 'cracks', label: 'Crack analysis', icon: ScanSearch, blurb: 'Classify cracks, severity, likely cause and repair.' },
  { id: 'valuation', label: 'Valuation', icon: IndianRupee, blurb: 'Market value estimate with range and key factors.' },
  { id: 'planning', label: 'Project planning', icon: Ruler, blurb: 'Phase-wise plan with durations, costs and risks.' },
  { id: 'weather', label: 'Weather advisory', icon: CloudSun, blurb: 'Schedule work around live weather and forecasts.' },
  { id: 'assistant', label: 'Site assistant', icon: MessagesSquare, blurb: 'Ask any construction question, get practical steps.' },
] as const;
type ToolId = (typeof tools)[number]['id'];

function ConstructionPage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);
  return <div className="mx-auto max-w-5xl px-5 py-8">
    <Button asChild variant="ghost" className="mb-5 h-8 gap-2 px-2 text-xs text-muted-foreground"><Link to="/"><ArrowLeft size={14} />Back to workspace</Link></Button>
    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground"><Building2 size={13} className="text-clay" /> Construction intelligence</div>
    <h1 className="font-display text-[28px] font-semibold">Decide with data, not guesswork.</h1>
    <p className="mt-1.5 max-w-2xl text-[13px] text-muted-foreground">Multimodal AI for planning, execution and monitoring — analyze site photos, cracks, budgets and weather, and keep every analysis saved to your account.</p>
    {signedIn === null ? <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      : !signedIn ? <section className="mt-7 rounded-xl border border-border bg-card p-6"><HardHat className="mb-3 text-primary" /><h2 className="text-lg font-semibold">Sign in to run analyses</h2><p className="mt-1 text-sm text-muted-foreground">Your reports are saved privately to your account so you can revisit them anytime.</p><Button asChild className="mt-4"><Link to="/auth">Sign in to start</Link></Button></section>
      : <Studio />}
  </div>;
}

function Studio() {
  const qc = useQueryClient();
  const list = useServerFn(listAnalyses);
  const gen = useServerFn(generateAnalysis);
  const del = useServerFn(deleteAnalysis);
  const { data: saved = [] } = useQuery({ queryKey: ['construction'], queryFn: () => list() });
  const [tool, setTool] = useState<ToolId>('safety');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [image, setImage] = useState('');
  const [f, setF] = useState({ notes: '', city: 'Mumbai', propertyType: 'Apartment', areaSqft: '1000', ageYears: '5', projectType: 'Residential G+2 house', areaSqm: '150', budgetInr: '6000000', months: '12', work: 'Concreting and exterior painting', question: '' });
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  const current = saved.find(s => s.id === openId) ?? null;

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('Please choose a JPG or PNG image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setErr('Please choose an image under 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const run = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const payload: Record<string, unknown> = { tool, notes: f.notes || undefined };
      if (tool === 'safety' || tool === 'cracks') payload.image = image || undefined;
      if (tool === 'valuation') Object.assign(payload, { city: f.city, propertyType: f.propertyType, areaSqft: Number(f.areaSqft), ageYears: Number(f.ageYears) });
      if (tool === 'planning') Object.assign(payload, { projectType: f.projectType, areaSqm: Number(f.areaSqm), budgetInr: Number(f.budgetInr), months: Number(f.months) });
      if (tool === 'weather') Object.assign(payload, { city: f.city, work: f.work });
      if (tool === 'assistant') payload.question = f.question;
      const row = await gen({ data: payload as never });
      await qc.invalidateQueries({ queryKey: ['construction'] });
      setOpenId(row.id);
    } catch (x) { setErr(x instanceof Error ? x.message : 'Something went wrong.'); }
    setBusy(false);
  };

  return <div className="mt-7 grid gap-6">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {tools.map(({ id, label, icon: Icon }) => <Button key={id} variant={tool === id ? 'secondary' : 'outline'} className="h-auto flex-col items-start gap-1.5 p-3 text-left" onClick={() => { setTool(id); setErr(''); }}><Icon size={16} className="text-primary" /><span className="text-[11px] font-semibold">{label}</span></Button>)}
    </div>
    <p className="-mt-3 text-[11px] text-muted-foreground">{tools.find(t => t.id === tool)!.blurb}</p>

    <form onSubmit={run} className="grid gap-3 rounded-xl border border-border bg-card p-5">
      {(tool === 'safety' || tool === 'cracks') && <>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
        <div className="upload-zone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}>
          <Upload className="mx-auto mb-2 text-primary" />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>{image ? 'Photo added — change' : 'Choose a photo'}</Button>
          <p className="mt-2 text-[10px] text-muted-foreground">JPG or PNG up to 5 MB · drop it here</p>
        </div>
        {image && <img src={image} className="h-40 w-full rounded-md object-contain" alt="Uploaded site" />}
        <label className="text-xs">Notes (optional)<textarea className="form-field min-h-16" placeholder={tool === 'safety' ? 'e.g. 3rd floor slab work, monsoon season' : 'e.g. crack appeared after last monsoon, wall is 8 years old'} value={f.notes} onChange={set('notes')} /></label>
      </>}
      {tool === 'valuation' && <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs">City<input className="form-field" required value={f.city} onChange={set('city')} /></label>
        <label className="text-xs">Property type<select className="form-field" value={f.propertyType} onChange={set('propertyType')}>{['Apartment', 'Independent house', 'Villa', 'Plot', 'Commercial space'].map(o => <option key={o}>{o}</option>)}</select></label>
        <label className="text-xs">Built-up area (sq ft)<input className="form-field" type="number" min="50" required value={f.areaSqft} onChange={set('areaSqft')} /></label>
        <label className="text-xs">Age (years)<input className="form-field" type="number" min="0" required value={f.ageYears} onChange={set('ageYears')} /></label>
        <label className="text-xs sm:col-span-2">Notes (locality, floor, amenities)<input className="form-field" value={f.notes} onChange={set('notes')} /></label>
      </div>}
      {tool === 'planning' && <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs">Project type<input className="form-field" required value={f.projectType} onChange={set('projectType')} /></label>
        <label className="text-xs">Built-up area (m²)<input className="form-field" type="number" min="5" required value={f.areaSqm} onChange={set('areaSqm')} /></label>
        <label className="text-xs">Budget (₹)<input className="form-field" type="number" min="10000" required value={f.budgetInr} onChange={set('budgetInr')} /></label>
        <label className="text-xs">Target duration (months)<input className="form-field" type="number" min="1" max="120" required value={f.months} onChange={set('months')} /></label>
      </div>}
      {tool === 'weather' && <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs">City<input className="form-field" required value={f.city} onChange={set('city')} /></label>
        <label className="text-xs">Planned work<input className="form-field" required value={f.work} onChange={set('work')} /></label>
      </div>}
      {tool === 'assistant' && <label className="text-xs">Your question<textarea className="form-field min-h-20" required placeholder="e.g. How long should RCC slab curing continue in hot weather?" value={f.question} onChange={set('question')} /></label>}
      <div><Button disabled={busy || ((tool === 'safety' || tool === 'cracks') && !image)}>{busy ? <><Loader2 className="animate-spin" />Analyzing…</> : 'Run analysis'}</Button></div>
      {err && <p className="text-sm text-destructive">{err}</p>}
    </form>

    {current && <Result tool={current.tool} title={current.title} input={current.input as Record<string, unknown>} result={current.result as Record<string, unknown>} />}

    {saved.length > 0 && <div><h3 className="mb-3 text-sm font-semibold">Saved analyses</h3><div className="divide-y divide-border rounded-xl border border-border bg-card">{saved.map(s => <div key={s.id} className="flex items-center gap-3 p-3 text-xs"><Button variant="ghost" className="h-auto flex-1 justify-start p-1 text-left" onClick={() => setOpenId(s.id)}><span className="font-semibold">{s.title}</span><span className="ml-2 text-muted-foreground">{tools.find(t => t.id === s.tool)?.label}</span></Button><span className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString('en-IN')}</span><Button variant="ghost" size="icon" aria-label="Delete analysis" onClick={async () => { await del({ data: { id: s.id } }); qc.invalidateQueries({ queryKey: ['construction'] }); }}><Trash2 size={14} /></Button></div>)}</div></div>}
  </div>;
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: 'warn' | 'danger' | undefined }) {
  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${tone === 'danger' ? 'bg-destructive/10 text-destructive' : tone === 'warn' ? 'bg-clay/15 text-clay' : 'bg-sage-soft text-primary'}`}>{children}</span>;
}

function Result({ tool, title, input, result }: { tool: string; title: string; input: Record<string, unknown>; result: Record<string, unknown> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = result as any;
  const w = input['weather'] as Weather | null;
  return <article className="rounded-xl border border-border bg-card p-6">
    <div className="flex flex-wrap items-center gap-2">
      <Chip>{tools.find(t => t.id === tool)?.label}</Chip>
      {tool === 'safety' && <Chip tone={r.riskLevel === 'Critical' || r.riskLevel === 'High' ? 'danger' : r.riskLevel === 'Moderate' ? 'warn' : undefined}>Risk: {r.riskLevel}</Chip>}
      {tool === 'cracks' && <Chip tone={r.urgency?.startsWith('Urgent') ? 'danger' : r.urgency === 'Repair soon' ? 'warn' : undefined}>{r.urgency}</Chip>}
      {w && <Chip>{w.temp}°C · {w.humidity}% humidity · {w.rainMm7d} mm rain this week</Chip>}
    </div>
    <h2 className="mt-3 text-lg font-semibold">{title}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{r.summary ?? r.answer}</p>

    {tool === 'safety' && <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div><h3 className="mb-2 text-sm font-semibold">Hazards found</h3><ul className="space-y-3">{r.hazards.map((h: { hazard: string; severity: string; fix: string }) => <li key={h.hazard} className="text-xs"><div className="flex justify-between gap-3"><strong>{h.hazard}</strong><Chip tone={h.severity === 'High' ? 'danger' : h.severity === 'Medium' ? 'warn' : undefined}>{h.severity}</Chip></div><div className="mt-0.5 text-muted-foreground">{h.fix}</div></li>)}</ul></div>
      <div className="grid gap-5 content-start"><div><h3 className="mb-2 text-sm font-semibold">Required PPE</h3><div className="flex flex-wrap gap-2">{r.ppe.map((p: string) => <Chip key={p}>{p}</Chip>)}</div></div>
      <div><h3 className="mb-2 text-sm font-semibold">Do immediately</h3><ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">{r.immediate.map((s: string) => <li key={s}>{s}</li>)}</ul></div></div>
    </div>}

    {tool === 'cracks' && <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div><h3 className="mb-2 text-sm font-semibold">Cracks identified</h3><ul className="space-y-3">{r.cracks.map((c: { type: string; severity: string; cause: string; repair: string }) => <li key={c.type} className="text-xs"><div className="flex justify-between gap-3"><strong>{c.type}</strong><Chip tone={c.severity === 'Structural' ? 'danger' : c.severity === 'Moderate' ? 'warn' : undefined}>{c.severity}</Chip></div><div className="mt-0.5 text-muted-foreground">Cause: {c.cause}</div><div className="text-muted-foreground">Repair: {c.repair}</div></li>)}</ul></div>
      <div><h3 className="mb-2 text-sm font-semibold">How to monitor</h3><ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">{r.monitor.map((m: string) => <li key={m}>{m}</li>)}</ul></div>
    </div>}

    {tool === 'valuation' && <div className="mt-5 grid gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Estimate', r.estimateInr], ['Range', `${r.rangeLowInr} – ${r.rangeHighInr}`], ['Rate', `${r.ratePerSqftInr} / sq ft`]].map(([l, v]) => <div key={l as string} className="rounded-lg border border-border p-3"><div className="text-[10px] text-muted-foreground">{l}</div><div className="mt-1 text-sm font-semibold">{v}</div></div>)}</div>
      <div><h3 className="mb-2 text-sm font-semibold">What drives this value</h3><ul className="space-y-2">{r.factors.map((x: { factor: string; impact: string }) => <li key={x.factor} className="text-xs"><strong>{x.factor}</strong><div className="text-muted-foreground">{x.impact}</div></li>)}</ul></div>
      <p className="text-xs text-muted-foreground">{r.outlook}</p>
    </div>}

    {tool === 'planning' && <div className="mt-5 grid gap-5">
      <ol className="space-y-3">{r.phases.map((p: { name: string; durationWeeks: number; costInr: string; tasks: string[] }, i: number) => <li key={p.name} className="rounded-lg border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2 text-xs"><strong>{i + 1}. {p.name}</strong><span className="text-muted-foreground">{p.durationWeeks} weeks · <span className="font-semibold text-primary">{p.costInr}</span></span></div><ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] text-muted-foreground">{p.tasks.map(t => <li key={t}>{t}</li>)}</ul></li>)}</ol>
      <div className="grid gap-5 lg:grid-cols-2"><div><h3 className="mb-2 text-sm font-semibold">Key risks</h3><ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">{r.risks.map((x: string) => <li key={x}>{x}</li>)}</ul></div><div><h3 className="mb-2 text-sm font-semibold">Practical tips</h3><ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">{r.tips.map((x: string) => <li key={x}>{x}</li>)}</ul></div></div>
    </div>}

    {tool === 'weather' && <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div className="grid gap-5 content-start"><div><h3 className="mb-2 text-sm font-semibold">Best work window</h3><p className="text-xs text-muted-foreground">{r.workWindow}</p></div><div><h3 className="mb-2 text-sm font-semibold">Precautions</h3><ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">{r.precautions.map((x: string) => <li key={x}>{x}</li>)}</ul></div></div>
      <div><h3 className="mb-2 text-sm font-semibold">Material handling</h3><ul className="space-y-2">{r.materials.map((m: { material: string; advice: string }) => <li key={m.material} className="text-xs"><strong>{m.material}</strong><div className="text-muted-foreground">{m.advice}</div></li>)}</ul></div>
    </div>}

    {tool === 'assistant' && <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div><h3 className="mb-2 text-sm font-semibold">Steps</h3><ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">{r.steps.map((s: string) => <li key={s}>{s}</li>)}</ol></div>
      <div><h3 className="mb-2 text-sm font-semibold">Cautions</h3><ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">{r.cautions.map((c: string) => <li key={c}>{c}</li>)}</ul></div>
    </div>}

    <p className="mt-5 text-[10px] text-muted-foreground">AI-generated guidance for decision support. Verify structural, safety and valuation matters with licensed professionals.</p>
  </article>;
}
