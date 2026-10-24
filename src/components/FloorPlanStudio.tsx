import { useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Compass,
  ExternalLink,
  Layers,
  Lightbulb,
  Loader2,
  Maximize2,
  Palette,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateFloorPlanDesign } from '@/lib/floorplan.functions';
import { ThreeDHouseViewer } from './ThreeDHouseViewer';
import type { FloorPlanAnalysisResult, FloorPlanMode } from '@/lib/floorplan.server';

const STYLES = [
  'Japandi',
  'Modern Indian',
  'Contemporary',
  'Minimalist',
  'Scandinavian',
  'Traditional Indian',
  'Bohemian',
];

export function FloorPlanStudio() {
  const analyzePlan = useServerFn(generateFloorPlanDesign);

  const [mode, setMode] = useState<FloorPlanMode>('floorplan');
  const [style, setStyle] = useState<string>('Japandi');
  const [notes, setNotes] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');
  const [result, setResult] = useState<FloorPlanAnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErr('Please upload an image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 7 * 1024 * 1024) {
      setErr('Please select an image smaller than 7 MB.');
      return;
    }
    setFileName(file.name);
    setErr('');

    const reader = new FileReader();
    reader.onload = () => {
      setImage(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setErr('Please upload an image first.');
      return;
    }

    setBusy(true);
    setErr('');

    try {
      const res = await analyzePlan({
        data: {
          image,
          mode,
          style,
          notes: notes.trim() || undefined,
        },
      });
      setResult(res as FloorPlanAnalysisResult);
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Analysis failed. Please check your Gemini API key in .env.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 grid gap-8">
      {/* Upload and Configuration Studio Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Box size={16} />
              </span>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                2D Floor Plan & Room to 3D Vision Studio
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload your architectural drawing or actual room photo to generate an interactive 3D model, interior layouts, and furniture recommendations.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-sage-soft px-3 py-1 text-[11px] font-semibold text-primary">
            <Sparkles size={12} /> Multimodal Gemini AI
          </span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('floorplan');
              setResult(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
              mode === 'floorplan'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Compass size={14} /> 1. Upload 2D Floor Plan / House Map
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('room_photo');
              setResult(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
              mode === 'room_photo'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wand2 size={14} /> 2. Upload Actual Room Photo
          </button>
        </div>

        <form onSubmit={handleRun} className="mt-5 grid gap-5">
          {/* Upload Zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className="group cursor-pointer rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/20"
          >
            <Upload className="mx-auto mb-2 text-primary transition-transform group-hover:-translate-y-0.5" />
            <div className="text-xs font-semibold text-foreground">
              {fileName ? fileName : mode === 'floorplan' ? 'Click or drag & drop house blueprint / drawing' : 'Click or drag & drop room photo'}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Supports JPG, PNG, and WebP (up to 7 MB)
            </p>
          </div>

          {image && (
            <div className="relative mx-auto max-h-56 overflow-hidden rounded-lg border border-border">
              <img src={image} alt="Uploaded spatial input" className="h-56 w-auto object-contain" />
              <button
                type="button"
                onClick={() => {
                  setImage('');
                  setFileName('');
                }}
                className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white hover:bg-black"
              >
                Change Image
              </button>
            </div>
          )}

          {/* Style & Preferences */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Desired Interior Design Aesthetic
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

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Specific Goals & Constraints (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Vastu compliant master bed, open kitchen island, low maintenance"
                className="form-field w-full text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-muted-foreground">
              Multimodal AI extracts architectural boundaries, furniture coordinates & materials.
            </span>
            <Button disabled={busy || !image} className="gap-2 px-6">
              {busy ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating 3D Vision…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate 3D Building & Interior Layout
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

      {/* Results Section */}
      {result && (
        <div className="grid gap-8 animate-in fade-in duration-300">
          {/* Section 1: Interactive 3D Model Viewer */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Interactive Visualization
                </span>
                <h3 className="text-lg font-bold text-foreground">{result.projectTitle}</h3>
              </div>
              <span className="text-xs text-muted-foreground">Orbit 360° • Zoom • Floor Plan Preset</span>
            </div>

            <ThreeDHouseViewer
              rooms={result.rooms}
              title={result.projectTitle}
              threeDViewDescription={result.threeDViewDescription}
            />
          </div>

          {/* Section 2: Free 3D House Conversion Tools Card */}
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-card to-sage-soft/30 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ExternalLink size={16} />
                </span>
                <h4 className="font-semibold text-sm text-foreground">
                  Free Tools to Convert Your 2D Drawing / Photos into 3D Buildings
                </h4>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                100% Free / Open Options
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              You can import your floor plan image into these free tools for full first-person walkthroughs, architectural CAD exports, and interactive 3D house renders:
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {result.freeTools.map((tool) => (
                <div
                  key={tool.name}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-foreground/30"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{tool.name}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                        {tool.badge}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                      {tool.description}
                    </p>
                    <div className="mt-2 rounded bg-muted/40 p-2 text-[10px] text-foreground/80">
                      <strong>How to:</strong> {tool.howToUse}
                    </div>
                  </div>

                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Launch {tool.name} <ExternalLink size={11} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Room by Room Breakdown & Direct Store Links */}
          <div>
            <h4 className="mb-4 text-base font-bold text-foreground">
              Room-by-Room Interior Layout & Furniture Shopping Links
            </h4>

            <div className="grid gap-5 sm:grid-cols-2">
              {result.rooms.map((room) => (
                <div
                  key={room.roomName}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-sm text-foreground">{room.roomName}</h5>
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {room.dimensions}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">{room.zoning}</p>

                  {/* Color Palette */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground">Palette:</span>
                    {room.colorPalette.map((c) => (
                      <span
                        key={c.hex}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px]"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-border"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.name}
                      </span>
                    ))}
                  </div>

                  {/* Materials & Lighting */}
                  <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                    <div>
                      <strong>Materials:</strong> {room.materialsAndFinishes}
                    </div>
                    <div>
                      <strong>Lighting:</strong> {room.lightingStrategy}
                    </div>
                  </div>

                  {/* Recommended Furniture with Store Links */}
                  <div className="mt-4 border-t border-border pt-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Furniture & Fixture Recommendations
                    </div>
                    <div className="space-y-2.5">
                      {room.furniture.map((f, fIdx) => (
                        <div key={fIdx} className="rounded-lg bg-muted/30 p-2.5 text-xs">
                          <div className="flex justify-between font-semibold text-foreground">
                            <span>{f.item}</span>
                            <span className="text-primary">{f.estPriceInr}</span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {f.placement} • {f.size}
                          </div>

                          {/* Online store links */}
                          <div className="mt-2 flex flex-wrap items-center gap-1 pt-1.5 border-t border-border/40">
                            <span className="text-[9px] text-muted-foreground font-semibold">Buy online:</span>
                            {f.stores.slice(0, 3).map((st) => (
                              <a
                                key={st.id}
                                href={st.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold border ${st.badgeColor} hover:scale-105 transition-transform`}
                                title={`Search ${f.item} on ${st.name}`}
                              >
                                {st.name}
                                <ExternalLink size={8} />
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Renovation Execution Checklist */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Renovation & Execution Strategy
            </h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {result.recommendedRenovationSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-lg bg-muted/20 p-2.5 text-xs text-foreground">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primary" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Free Tools to Convert Images into 3D Buildings */}
          {result.freeTools && result.freeTools.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Box size={16} />
                  </span>
                  <h4 className="text-sm font-semibold tracking-tight text-foreground">
                    Free External Tools to Convert Your Blueprint / Photos into 3D Buildings
                  </h4>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  100% Free / Free-Tier Tools
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Want interactive full-house walkthroughs or photo-realistic renders? Use these tested free tools with your uploaded floor plan drawing:
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {result.freeTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex flex-col justify-between rounded-xl border border-border bg-muted/20 p-4 transition-all hover:border-foreground/30 hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-xs font-bold text-foreground">{tool.name}</h5>
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                          {tool.badge}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                        {tool.description}
                      </p>
                      <div className="mt-2 rounded-lg bg-card/70 p-2 text-[10px] text-muted-foreground border border-border/50">
                        <strong className="text-foreground">How to use:</strong> {tool.howToUse}
                      </div>
                    </div>

                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <span>Open {tool.name}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
