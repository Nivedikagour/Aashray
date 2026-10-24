import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import {
  AlertTriangle,
  BookmarkCheck,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Compass,
  ExternalLink,
  FileText,
  IndianRupee,
  Layers,
  Lightbulb,
  Loader2,
  Palette,
  Percent,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateBudgetPlan } from '@/lib/budget-design.functions';
import { getOnlineStoreLinks } from '@/lib/stores';
import type { BudgetDesignResult } from '@/lib/budget-design.server';

const CITIES = [
  'Mumbai',
  'Bengaluru',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Goa',
  'Chandigarh',
  'Kochi',
];

const PROPERTY_TYPES = [
  '1 BHK Apartment',
  '2 BHK Apartment',
  '3 BHK Apartment',
  '4 BHK Apartment',
  'Independent Villa / House',
  'Studio / 1 RK',
  'Penthouse / Duplex',
];

const STYLES = [
  'Japandi',
  'Modern Indian',
  'Contemporary',
  'Minimalist',
  'Scandinavian',
  'Traditional Indian',
  'Bohemian',
  'Industrial Chic',
];

const AVAILABLE_ROOMS = [
  'Living room',
  'Master bedroom',
  'Modular kitchen',
  'Dining area',
  'Kids / Guest bedroom',
  'Balcony / Sit-out',
  'Home office nook',
  'Bathrooms',
];

const PRIORITIES = [
  { id: 'balanced', label: 'Balanced Allocation', desc: 'Harmonious split between fixed woodwork and loose furnishings' },
  { id: 'quality_materials', label: 'Durable Materials', desc: 'Focus on termite-proof ply, acrylic/PU finishes and hardware' },
  { id: 'cost_effective', label: 'Cost-Effective / Value', desc: 'Clever hacks, modular retail picks, and high visual impact' },
  { id: 'luxury_statement', label: 'Luxury Statement', desc: 'Premium veneers, Italian marble accents, and designer lighting' },
] as const;

const BUDGET_PRESETS = [
  { label: '₹3 Lakhs', value: 300000 },
  { label: '₹5 Lakhs', value: 500000 },
  { label: '₹8 Lakhs', value: 800000 },
  { label: '₹12 Lakhs', value: 1200000 },
  { label: '₹20 Lakhs', value: 2000000 },
];

export function BudgetDesignStudio() {
  const genPlan = useServerFn(generateBudgetPlan);

  const [totalBudget, setTotalBudget] = useState<number>(500000);
  const [city, setCity] = useState<string>('Mumbai');
  const [propertyType, setPropertyType] = useState<string>('2 BHK Apartment');
  const [style, setStyle] = useState<string>('Japandi');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([
    'Living room',
    'Master bedroom',
    'Modular kitchen',
    'Dining area',
  ]);
  const [priority, setPriority] = useState<'quality_materials' | 'cost_effective' | 'balanced' | 'luxury_statement'>('balanced');
  const [notes, setNotes] = useState<string>('');

  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');
  const [result, setResult] = useState<BudgetDesignResult | null>(null);
  const [activeTab, setActiveTab] = useState<'rooms' | 'phases' | 'materials'>('rooms');

  const toggleRoom = (room: string) => {
    setSelectedRooms((prev) =>
      prev.includes(room) ? (prev.length > 1 ? prev.filter((r) => r !== room) : prev) : [...prev, room],
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      const data = await genPlan({
        data: {
          totalBudgetInr: totalBudget,
          city,
          propertyType,
          style,
          rooms: selectedRooms,
          priority,
          notes: notes.trim() || undefined,
        },
      });
      setResult(data as BudgetDesignResult);
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Failed to generate budget plan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 grid gap-8">
      {/* Configuration & Input Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles size={16} />
              </span>
              <h2 className="text-lg font-semibold tracking-tight">AI Budget Planner & Design Studio</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Powered by Google Gemini — get intelligent, climate-smart room allocations, pricing in INR, and style curation.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-sage-soft px-3 py-1 text-[11px] font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" /> Gemini AI Engine
          </span>
        </div>

        <form onSubmit={handleGenerate} className="grid gap-6">
          {/* Budget presets & numeric input */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Total Interior & Furnishing Budget
              </label>
              <span className="font-display text-base font-bold text-primary">
                ₹{totalBudget.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {BUDGET_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => setTotalBudget(p.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    totalBudget === p.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  ₹
                </span>
                <input
                  type="number"
                  min="25000"
                  step="10000"
                  required
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Math.max(0, Number(e.target.value)))}
                  className="form-field w-full pl-8 font-medium"
                  placeholder="Enter custom budget in INR"
                />
              </div>
            </div>
          </div>

          {/* City, Property Type, Style Selectors */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                City / Location
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="form-field w-full text-xs"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Property Configuration
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="form-field w-full text-xs"
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Design Aesthetic
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="form-field w-full text-xs"
              >
                {STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scope of Spaces */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground">
              Spaces Included in Scope ({selectedRooms.length} selected)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ROOMS.map((room) => {
                const isSelected = selectedRooms.includes(room);
                return (
                  <button
                    type="button"
                    key={room}
                    onClick={() => toggleRoom(room)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-sage-soft text-primary font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    {isSelected ? <Check size={13} strokeWidth={2.5} /> : <Plus size={13} />}
                    {room}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spending Strategy */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground">
              Spending Strategy & Focus
            </label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-foreground">{p.label}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specific preferences/notes */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              Special Requirements & Preferences (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pet-friendly upholstery, hidden work desk, fluted oak panelling, mandir unit..."
              className="form-field w-full text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Estimates reflect verified Indian retail & modular carpentry rates.
            </span>
            <Button disabled={busy} className="gap-2 px-6">
              {busy ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Generating with Gemini…
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Generate AI Budget & Design Plan
                </>
              )}
            </Button>
          </div>
        </form>

        {err && (
          <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {err}
          </div>
        )}
      </div>

      {/* Generated Recommendations Display */}
      {result && (
        <div className="grid gap-6 animate-in fade-in duration-300">
          {/* Executive Overview Banner */}
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-sage-soft to-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {style} · {city}
                </span>
                <h3 className="mt-2 font-display text-xl font-bold">
                  ₹{(result.totalBudgetInr / 100000).toFixed(1)} Lakhs Project Plan
                </h3>
              </div>
              <div className="flex gap-4">
                <div className="rounded-lg bg-card/80 p-3 text-right border border-border/50">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                    Allocated Spend
                  </div>
                  <div className="font-display text-base font-bold text-foreground">
                    ₹{result.spendableBudgetInr.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="rounded-lg bg-card/80 p-3 text-right border border-border/50">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                    Contingency (Safety)
                  </div>
                  <div className="font-display text-base font-bold text-primary">
                    ₹{result.contingencyInr.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {result.summary}
            </p>
            {result.cityInsights && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-background/60 p-3 text-[11px] text-muted-foreground">
                <Compass size={14} className="mt-0.5 shrink-0 text-primary" />
                <span>
                  <strong>Local City Advisory ({city}):</strong> {result.cityInsights}
                </span>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'rooms'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <CircleDollarSign size={15} /> Room Allocations ({result.allocations.length})
            </button>
            <button
              onClick={() => setActiveTab('phases')}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'phases'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock size={15} /> Phased Spending Roadmap
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'materials'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Palette size={15} /> Design Palette & Splurge vs Save
            </button>
          </div>

          {/* TAB 1: Room Allocations */}
          {activeTab === 'rooms' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {result.allocations.map((alloc) => (
                <div
                  key={alloc.room}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-foreground">{alloc.room}</h4>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {alloc.sharePercentage}%
                      </span>
                    </div>

                    <div className="mt-1 font-display text-lg font-bold text-primary">
                      ₹{alloc.amountInr.toLocaleString('en-IN')}
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Key Recommendations
                      </div>
                      {alloc.keyItems.map((item, idx) => {
                        const stores = getOnlineStoreLinks(item.item, style);
                        return (
                          <div key={idx} className="rounded-lg bg-muted/40 p-2.5 text-xs">
                            <div className="flex justify-between font-medium text-foreground">
                              <span>{item.item}</span>
                              <span className="font-bold text-primary">{item.estimatedInr}</span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-muted-foreground">{item.note}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-1 pt-1.5 border-t border-border/40">
                              <span className="text-[9px] text-muted-foreground font-semibold">Stores:</span>
                              {stores.slice(0, 3).map((st) => (
                                <a
                                  key={st.id}
                                  href={st.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold border ${st.badgeColor} hover:scale-105 transition-transform`}
                                  title={`Buy ${item.item} on ${st.name}`}
                                >
                                  {st.name}
                                  <ExternalLink size={8} />
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {alloc.costSavingTip && (
                    <div className="mt-4 flex items-start gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
                      <Lightbulb size={13} className="mt-0.5 shrink-0 text-clay" />
                      <span>
                        <strong className="text-foreground">Saving Hack:</strong> {alloc.costSavingTip}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Phased Plan */}
          {activeTab === 'phases' && (
            <div className="space-y-4">
              {result.phasedPlan.map((phase, idx) => (
                <div
                  key={phase.phase}
                  className="relative rounded-xl border border-border bg-card p-5 pl-7 shadow-sm"
                >
                  <span className="absolute left-0 top-0 bottom-0 w-2 rounded-l-xl bg-primary" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                        Phase {idx + 1} · {phase.timeframe}
                      </span>
                      <h4 className="text-base font-semibold text-foreground">{phase.phase}</h4>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-base font-bold text-foreground">
                        ₹{phase.amountInr.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {phase.sharePercentage}% of total budget
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">{phase.description}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {phase.milestones.map((m, mIdx) => (
                      <span
                        key={mIdx}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-foreground"
                      >
                        <Check size={11} className="text-primary" /> {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Design Guidance & Splurge vs Save */}
          {activeTab === 'materials' && (
            <div className="grid gap-6">
              {/* Color Palette */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Curated Aesthetic Palette ({style})
                </h4>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {result.designGuidance.palette.map((col) => (
                    <div key={col.hex} className="rounded-lg border border-border p-3 text-center">
                      <div
                        className="mx-auto h-12 w-full rounded-md border border-border/40 shadow-inner"
                        style={{ backgroundColor: col.hex }}
                      />
                      <div className="mt-2 text-xs font-semibold">{col.name}</div>
                      <div className="text-[10px] text-muted-foreground">{col.role}</div>
                      <div className="mt-1 font-mono text-[9px] uppercase opacity-75">{col.hex}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Materials */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Climate & Budget Appropriate Materials
                </h4>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {result.designGuidance.recommendedMaterials.map((mat) => (
                    <div key={mat.name} className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex justify-between font-semibold text-xs text-foreground">
                        <span>{mat.name}</span>
                        <span className="text-primary">{mat.estRateSqft}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        <strong>Application:</strong> {mat.where}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{mat.why}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Splurge vs Save Strategy */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Strategic Splurge vs. Save Matrix
                </h4>
                <div className="mt-3 divide-y divide-border">
                  {result.designGuidance.splurgeVsSave.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-4 py-3 text-xs">
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{item.area}</div>
                        <div className="mt-0.5 text-muted-foreground">{item.rationale}</div>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.recommendation === 'Splurge'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        }`}
                      >
                        {item.recommendation === 'Splurge' ? (
                          <TrendingUp size={11} />
                        ) : (
                          <TrendingDown size={11} />
                        )}
                        {item.recommendation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
