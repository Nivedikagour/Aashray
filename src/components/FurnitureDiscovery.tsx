import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import {
  ExternalLink,
  Filter,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFurnitureRecommendations } from '@/lib/furniture.functions';
import { getOnlineStoreLinks } from '@/lib/stores';
import type { FurnitureItem } from '@/lib/furniture.server';

const ROOM_OPTIONS = [
  'Living room',
  'Master bedroom',
  'Dining room',
  'Home office',
  'Balcony & outdoor',
  'Modular kitchen & pantry',
];

const STYLE_OPTIONS = [
  'Japandi',
  'Modern Indian',
  'Contemporary',
  'Minimalist',
  'Scandinavian',
  'Bohemian',
];

const INITIAL_CATALOG: FurnitureItem[] = [
  {
    id: 'init-1',
    name: 'Curved Low-Profile 3-Seater Sofa in Cream Bouclé',
    category: 'Seating',
    style: 'Japandi',
    dimensions: '220W x 92D x 72H cm',
    estimatedPriceInr: '₹28,999 – ₹36,500',
    material: 'Textured bouclé upholstery, kiln-dried solid wood internal frame',
    whyRecommended: 'Low horizontal profile creates an expansive feeling in Indian living rooms while retaining warmth.',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    stores: getOnlineStoreLinks('Curved Boucle 3 Seater Sofa', 'Japandi'),
  },
  {
    id: 'init-2',
    name: 'Natural Rattan Cane & Teak Wood Accent Lounge Chair',
    category: 'Seating',
    style: 'Modern Indian',
    dimensions: '68W x 75D x 80H cm',
    estimatedPriceInr: '₹12,499 – ₹16,999',
    material: 'Natural hand-woven cane webbing, seasoned teak finish wood',
    whyRecommended: 'Breathable cane webbing provides exceptional comfort in hot and humid Indian climates.',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    stores: getOnlineStoreLinks('Rattan Cane Teak Accent Chair', 'Modern Indian'),
  },
  {
    id: 'init-3',
    name: 'Fluted Solid Oak TV Entertainment Console with Storage',
    category: 'Storage & Tables',
    style: 'Contemporary',
    dimensions: '180W x 40D x 48H cm',
    estimatedPriceInr: '₹19,500 – ₹26,000',
    material: 'Fluted engineered hardwood, soft-close hardware, matte black legs',
    whyRecommended: 'Vertical fluting creates tactile depth while concealed cable management keeps media setups immaculate.',
    imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    stores: getOnlineStoreLinks('Fluted Wood TV Media Console', 'Contemporary'),
  },
  {
    id: 'init-4',
    name: 'Solid Sheesham Wood 6-Seater Dining Table with Rounded Corners',
    category: 'Dining',
    style: 'Scandinavian',
    dimensions: '160W x 90D x 76H cm',
    estimatedPriceInr: '₹22,000 – ₹31,000',
    material: '100% Solid Indian Sheesham wood with natural matte lacquer finish',
    whyRecommended: 'Extremely durable for everyday dining; rounded organic edges bring softness to linear dining spaces.',
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    stores: getOnlineStoreLinks('Sheesham Wood 6 Seater Dining Table', 'Scandinavian'),
  },
  {
    id: 'init-5',
    name: 'Low Platform King Bed with Floating Nightstands',
    category: 'Bedding',
    style: 'Japandi',
    dimensions: '198W x 215D x 85H cm (King)',
    estimatedPriceInr: '₹34,000 – ₹45,000',
    material: 'High-grade hardwood ply with natural oak veneer finish',
    whyRecommended: 'Low grounding architecture encourages calm and mindfulness, ideal for tranquil bedroom sanctuaries.',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    stores: getOnlineStoreLinks('Low Platform King Bed', 'Japandi'),
  },
  {
    id: 'init-6',
    name: 'Ergonomic Work Desk with Cane Mesh Panel & Wire Cutout',
    category: 'Home Office',
    style: 'Modern Indian',
    dimensions: '120W x 60D x 75H cm',
    estimatedPriceInr: '₹11,500 – ₹15,800',
    material: 'Solid mango wood, natural cane modesty panel, brass accents',
    whyRecommended: 'Blends functional modern ergonomics with timeless Indian handcrafted cane detailing.',
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
    stores: getOnlineStoreLinks('Solid Wood Study Desk With Cane', 'Modern Indian'),
  },
];

export function FurnitureDiscovery() {
  const getAIRecommendations = useServerFn(getFurnitureRecommendations);

  const [room, setRoom] = useState<string>('Living room');
  const [style, setStyle] = useState<string>('Japandi');
  const [budgetTier, setBudgetTier] = useState<'budget_friendly' | 'mid_range' | 'premium_luxury'>('mid_range');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [items, setItems] = useState<FurnitureItem[]>(INITIAL_CATALOG);
  const [summary, setSummary] = useState<string>('Explore curated furniture picks with direct links to major Indian home stores.');
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');

  const handleCurate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      const res = await getAIRecommendations({
        data: {
          room,
          style,
          budgetTier,
          query: searchQuery.trim() || undefined,
        },
      });
      setItems(res.items);
      setSummary(res.summary);
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Could not generate furniture recommendations.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 grid gap-6">
      {/* Search & Custom Recommendation Bar */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShoppingBag size={16} />
              </span>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Furniture Discovery & Online Stores
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Direct purchase links to verified Indian online retailers: Amazon India, Pepperfry, IKEA India, Urban Ladder & WoodenStreet.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-sage-soft px-3 py-1 text-[11px] font-medium text-primary">
            <Sparkles size={12} /> Gemini Powered Curation
          </span>
        </div>

        <form onSubmit={handleCurate} className="mt-5 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Room Space
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="form-field w-full text-xs"
              >
                {ROOM_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Design Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="form-field w-full text-xs"
              >
                {STYLE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Price / Budget Tier
              </label>
              <select
                value={budgetTier}
                onChange={(e) => setBudgetTier(e.target.value as typeof budgetTier)}
                className="form-field w-full text-xs"
              >
                <option value="budget_friendly">Value / Budget Friendly (₹)</option>
                <option value="mid_range">Balanced / Mid-Range (₹₹)</option>
                <option value="premium_luxury">Premium / Luxury (₹₹₹)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Optional focus: e.g. space saving sofa bed, fluted storage, cane dining chairs..."
                className="form-field w-full pl-9 text-xs"
              >
              </input>
            </div>
            <Button disabled={busy} className="gap-2 shrink-0">
              {busy ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Curating with Gemini…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Curate Furniture Picks
                </>
              )}
            </Button>
          </div>
        </form>

        {err && (
          <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
            {err}
          </div>
        )}
      </div>

      {/* Summary notice */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{summary}</span>
        <span className="font-semibold text-foreground">{items.length} items curated</span>
      </div>

      {/* Grid of Furniture Items with Direct Store Links */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
          >
            <div>
              {item.imageUrl && (
                <div className="relative -mx-5 -mt-5 mb-4 aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 rounded bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                    {item.style}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 rounded bg-background/90 px-2 py-0.5 text-[10px] font-bold text-primary shadow backdrop-blur-md">
                    {item.estimatedPriceInr}
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-2">
                <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {item.category}
                </span>
                {!item.imageUrl && (
                  <span className="font-display text-sm font-bold text-primary">
                    {item.estimatedPriceInr}
                  </span>
                )}
              </div>

              <h3 className="mt-2 text-sm font-semibold text-foreground leading-snug">
                {item.name}
              </h3>

              <div className="mt-2 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Specs:</span> {item.dimensions}
              </div>

              <div className="mt-1 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Material:</span> {item.material}
              </div>

              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground bg-muted/30 rounded-lg p-2.5">
                {item.whyRecommended}
              </p>
            </div>

            {/* Direct Purchase Links Section */}
            <div className="mt-4 border-t border-border pt-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Direct Online Store Links
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.stores.map((store) => (
                  <a
                    key={store.id}
                    href={store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition-transform hover:scale-105 ${store.badgeColor}`}
                    title={`Search and buy "${item.name}" on ${store.name}`}
                  >
                    {store.name}
                    <ExternalLink size={10} className="opacity-70" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
