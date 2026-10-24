import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Compass,
  Download,
  ExternalLink,
  Layers,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RoomDesign } from '@/lib/floorplan.server';

interface ThreeDHouseViewerProps {
  rooms: RoomDesign[];
  title?: string;
  threeDViewDescription?: string;
}

export function ThreeDHouseViewer({
  rooms,
  title = '3D House Building Model',
  threeDViewDescription,
}: ThreeDHouseViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [yaw, setYaw] = useState<number>(45); // horizontal angle in degrees
  const [pitch, setPitch] = useState<number>(30); // vertical angle in degrees
  const [zoom, setZoom] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'iso' | 'top' | 'front'>('iso');
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle View Mode Preset Changes
  const setPreset = (mode: 'iso' | 'top' | 'front') => {
    setViewMode(mode);
    if (mode === 'iso') {
      setYaw(45);
      setPitch(32);
    } else if (mode === 'top') {
      setYaw(0);
      setPitch(89);
    } else if (mode === 'front') {
      setYaw(0);
      setPitch(5);
    }
  };

  // Mouse drag orbit controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setYaw((prev) => (prev + dx * 0.6) % 360);
    setPitch((prev) => Math.max(5, Math.min(88, prev - dy * 0.6)));
    setViewMode('iso');
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom((prev) => Math.max(0.5, Math.min(2.5, prev + delta)));
  };

  // Render 3D Wireframe / Isometric Projection on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 700;
    const height = canvas.parentElement?.clientHeight || 450;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#0f172a'; // Deep slate architectural background
    ctx.fillRect(0, 0, width, height);

    // 3D Math Projection Functions
    const radYaw = (yaw * Math.PI) / 180;
    const radPitch = (pitch * Math.PI) / 180;

    const cosY = Math.cos(radYaw);
    const sinY = Math.sin(radYaw);
    const cosP = Math.cos(radPitch);
    const sinP = Math.sin(radPitch);

    const centerX = width / 2;
    const centerY = height / 2 + 30;
    const scale = 36 * zoom;

    // 3D Point to 2D Screen
    const project = (x: number, y: number, z: number): [number, number] => {
      // Rotate around Y axis (Yaw)
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      // Rotate around X axis (Pitch)
      const y2 = y * cosP - z1 * sinP;

      const screenX = centerX + x1 * scale;
      const screenY = centerY - y2 * scale;
      return [screenX, screenY];
    };

    // Draw Ground Grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    const gridSize = 14;
    for (let i = -gridSize; i <= gridSize; i += 2) {
      const p1 = project(i, 0, -gridSize);
      const p2 = project(i, 0, gridSize);
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.stroke();

      const p3 = project(-gridSize, 0, i);
      const p4 = project(gridSize, 0, i);
      ctx.beginPath();
      ctx.moveTo(p3[0], p3[1]);
      ctx.lineTo(p4[0], p4[1]);
      ctx.stroke();
    }

    // Default room placements if not generated
    const defaultBoxes = [
      { x: -3.5, z: -2.5, width: 4.5, depth: 4, label: 'Living Room', color: '#10b981' },
      { x: 1.5, z: -2.5, width: 4, depth: 3.5, label: 'Master Bedroom', color: '#6366f1' },
      { x: -3.5, z: 2, width: 3.5, depth: 3, label: 'Modular Kitchen', color: '#f59e0b' },
      { x: 0.5, z: 1.5, width: 4.5, depth: 3.5, label: 'Dining Area', color: '#06b6d4' },
    ];

    const boxesToRender = rooms.length > 0
      ? rooms.map((r, i) => {
          const p = r.threeDPlacement || defaultBoxes[i % defaultBoxes.length];
          return {
            x: p.x,
            z: p.z,
            width: p.width,
            depth: p.depth,
            label: r.roomName,
            color: p.color || defaultBoxes[i % defaultBoxes.length]?.color || '#10b981',
          };
        })
      : defaultBoxes;

    const wallHeight = 2.2;

    // Render Room Slabs and Walls
    boxesToRender.forEach((box, idx) => {
      const isSelected = selectedRoomIndex === idx;

      const x0 = box.x;
      const x1 = box.x + box.width;
      const z0 = box.z;
      const z1 = box.z + box.depth;

      // Base 4 points on floor (y = 0)
      const b0 = project(x0, 0, z0);
      const b1 = project(x1, 0, z0);
      const b2 = project(x1, 0, z1);
      const b3 = project(x0, 0, z1);

      // Top 4 points of walls (y = wallHeight)
      const t0 = project(x0, wallHeight, z0);
      const t1 = project(x1, wallHeight, z0);
      const t2 = project(x1, wallHeight, z1);
      const t3 = project(x0, wallHeight, z1);

      // Floor Fill
      ctx.beginPath();
      ctx.moveTo(b0[0], b0[1]);
      ctx.lineTo(b1[0], b1[1]);
      ctx.lineTo(b2[0], b2[1]);
      ctx.lineTo(b3[0], b3[1]);
      ctx.closePath();
      ctx.fillStyle = isSelected ? 'rgba(52, 211, 153, 0.45)' : 'rgba(30, 41, 59, 0.75)';
      ctx.fill();

      // Floor border
      ctx.strokeStyle = isSelected ? '#34d399' : box.color;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Semi-transparent wall glass panels
      const drawWall = (pA: [number, number], pB: [number, number], pC: [number, number], pD: [number, number]) => {
        ctx.beginPath();
        ctx.moveTo(pA[0], pA[1]);
        ctx.lineTo(pB[0], pB[1]);
        ctx.lineTo(pC[0], pC[1]);
        ctx.lineTo(pD[0], pD[1]);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#34d399' : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
      };

      // Draw vertical wall columns
      drawWall(b0, b1, t1, t0);
      drawWall(b1, b2, t2, t1);
      drawWall(b2, b3, t3, t2);
      drawWall(b3, b0, t0, t3);

      // Interior Furniture Proxy block (Bed/Sofa/Table proxy in center)
      const midX = (x0 + x1) / 2;
      const midZ = (z0 + z1) / 2;
      const furnW = box.width * 0.45;
      const furnD = box.depth * 0.45;
      const furnH = 0.75;

      const fb0 = project(midX - furnW / 2, 0, midZ - furnD / 2);
      const fb1 = project(midX + furnW / 2, 0, midZ - furnD / 2);
      const fb2 = project(midX + furnW / 2, 0, midZ + furnD / 2);
      const fb3 = project(midX - furnW / 2, 0, midZ + furnD / 2);

      const ft0 = project(midX - furnW / 2, furnH, midZ - furnD / 2);
      const ft1 = project(midX + furnW / 2, furnH, midZ - furnD / 2);
      const ft2 = project(midX + furnW / 2, furnH, midZ + furnD / 2);
      const ft3 = project(midX - furnW / 2, furnH, midZ + furnD / 2);

      ctx.beginPath();
      ctx.moveTo(ft0[0], ft0[1]);
      ctx.lineTo(ft1[0], ft1[1]);
      ctx.lineTo(ft2[0], ft2[1]);
      ctx.lineTo(ft3[0], ft3[1]);
      ctx.closePath();
      ctx.fillStyle = isSelected ? 'rgba(52, 211, 153, 0.6)' : 'rgba(148, 163, 184, 0.35)';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Floating Room Label
      const labelPos = project(midX, wallHeight + 0.3, midZ);
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const textWidth = ctx.measureText(box.label).width;

      // Label background badge
      ctx.fillStyle = isSelected ? '#10b981' : 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(labelPos[0] - textWidth / 2 - 8, labelPos[1] - 12, textWidth + 16, 20, 6);
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#34d399' : 'rgba(255, 255, 255, 0.2)';
      ctx.stroke();

      // Text label
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(box.label, labelPos[0], labelPos[1] - 2);
    });
  }, [yaw, pitch, zoom, viewMode, selectedRoomIndex, rooms]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl border border-border bg-slate-950 text-white shadow-xl ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'w-full'
      }`}
    >
      {/* 3D Canvas Header Bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex flex-wrap items-center justify-between border-b border-white/10 bg-slate-950/75 p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
            <Box size={14} />
          </span>
          <div>
            <h3 className="text-xs font-semibold text-white">{title}</h3>
            <span className="text-[10px] text-slate-400">Interactive 3D Architectural Cutaway</span>
          </div>
        </div>

        {/* View Mode Preset Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPreset('iso')}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              viewMode === 'iso' ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            3D Isometric
          </button>
          <button
            onClick={() => setPreset('top')}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              viewMode === 'top' ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            2D Floor Plan
          </button>
          <button
            onClick={() => setPreset('front')}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              viewMode === 'front' ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Front Elevation
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="ml-1 rounded-md bg-white/10 p-1 text-slate-300 hover:bg-white/20 hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative h-[440px] w-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />

        {/* Bottom Floating Controls */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/70 p-1.5 backdrop-blur-md">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
            className="rounded p-1 text-slate-300 hover:bg-white/15 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
            className="rounded p-1 text-slate-300 hover:bg-white/15 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => {
              setYaw(45);
              setPitch(32);
              setZoom(1);
            }}
            className="rounded p-1 text-slate-300 hover:bg-white/15 hover:text-white"
            title="Reset View"
          >
            <RefreshCw size={14} />
          </button>
          <span className="px-1 text-[10px] text-slate-400">Click & Drag to Orbit 360°</span>
        </div>

        {/* Room Selector Strip */}
        {rooms.length > 0 && (
          <div className="absolute bottom-3 right-3 z-10 flex max-w-sm flex-wrap justify-end gap-1.5">
            {rooms.map((r, i) => (
              <button
                key={r.roomName}
                onClick={() => setSelectedRoomIndex(selectedRoomIndex === i ? null : i)}
                className={`rounded-md border px-2 py-1 text-[10px] font-semibold transition-all ${
                  selectedRoomIndex === i
                    ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                    : 'border-white/15 bg-slate-900/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {r.roomName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spatial narrative description */}
      {threeDViewDescription && (
        <div className="border-t border-white/10 bg-slate-900/90 p-4 text-xs leading-relaxed text-slate-300">
          <span className="font-semibold text-emerald-400">Architectural Spatial Vision:</span>{' '}
          {threeDViewDescription}
        </div>
      )}
    </div>
  );
}
