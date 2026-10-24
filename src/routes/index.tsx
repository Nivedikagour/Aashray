import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowDownRight, ArrowRight, Bell, Box, Check, ChevronDown, ChevronRight, CircleHelp, Cuboid, FolderOpen, HardHat, Heart, House, LayoutDashboard, LayoutGrid, Leaf, List, LogIn, LogOut, Menu, MoreHorizontal, Plus, Search, Settings, ShoppingBag, SlidersHorizontal, Sparkles, Upload, User as UserIcon, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import living from '@/assets/japandi-living.jpg';
import bedroom from '@/assets/modern-bedroom.jpg';
import kitchen from '@/assets/sage-kitchen.jpg';
import { BudgetDesignStudio } from '@/components/BudgetDesignStudio';
import { ClimateAdvisor } from '@/components/ClimateAdvisor';
import { FloorPlanStudio } from '@/components/FloorPlanStudio';
import { FurnitureDiscovery } from '@/components/FurnitureDiscovery';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Your workspace · Aashray AI' },
    { name: 'description', content: 'Explore 3D floor plans, beautiful interior concepts, smart budget planning, and construction intelligence with Aashray AI.' },
    { property: 'og:title', content: 'Your workspace · Aashray AI' },
    { property: 'og:description', content: 'An inspired architectural and interior workspace for modern homes.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Dashboard,
});
type Project = { id: number; name: string; image: string; style: string; rooms: string; area: string; edited: string; favorite: boolean };
const initialProjects: Project[] = [
  { id: 1, name: 'The Greenview Apartment', image: living, style: 'Japandi', rooms: '3 rooms', area: '112 m²', edited: '2 hours ago', favorite: false },
  { id: 2, name: 'A little more calm', image: bedroom, style: 'Modern Indian', rooms: '1 room', area: '24 m²', edited: 'Yesterday', favorite: true },
  { id: 3, name: 'Sage & sunlight', image: kitchen, style: 'Contemporary', rooms: '1 room', area: '18 m²', edited: '2 days ago', favorite: false },
];
const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: '3D Floor Plan Studio', icon: Cuboid },
  { label: 'My projects', icon: FolderOpen },
  { label: 'Design studio', icon: Sparkles },
  { label: 'Furniture discovery', icon: ShoppingBag },
  { label: 'Saved collection', icon: Heart },
  { label: 'Budget planner', icon: Wallet },
];
function Dashboard() {
  const [active, setActive] = useState('Overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState(initialProjects);
  const [tab, setTab] = useState('All projects');
  const [modal, setModal] = useState<'create'|'upload'|'redesign'|'search'|'notifications'|'settings'|'help'|null>(null);
  const [selected, setSelected] = useState<Project|null>(null);
  const [name, setName] = useState('');
  const [style, setStyle] = useState('Japandi');
  const [query, setQuery] = useState('');
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState('');
  const [sort, setSort] = useState(false);
  const [list, setList] = useState(false);
  const [budget, setBudget] = useState('500000');
  const [notice, setNotice] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNotice('Signed out of your session.');
  };

  const rawName = (user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : '')) as string;
  const displayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : (user ? 'Homeowner' : '');
  const initials = rawName ? rawName.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() : (user ? 'U' : 'G');

  const filtered = projects.filter(p => (tab !== 'Favorites' && active !== 'Saved collection' || p.favorite) && p.name.toLowerCase().includes(query.toLowerCase()));
  if (sort) filtered.reverse();
  const openCreate = (mode: 'create'|'upload'|'redesign') => { setName(''); setFile(null); setPreview(''); setModal(mode); };
  const addProject = () => { if (!name.trim()) return; setProjects(p => [{ id: Date.now(), name: name.trim(), image: preview || (style === 'Modern Indian' ? bedroom : style === 'Contemporary' ? kitchen : living), style, rooms: '1 room', area: 'Unmeasured', edited: 'Just now', favorite: false }, ...p]); setModal(null); setActive('My projects'); setTab('All projects'); setNotice('Project added to this session.'); };
  const onFile = (f?: File) => { if (!f) return; if (!['image/jpeg','image/png','application/pdf'].includes(f.type)) { setNotice('Please choose a JPG, PNG, or PDF.'); return; } setFile(f); if(f.type.startsWith('image/')) { const reader = new FileReader(); reader.onload = () => setPreview(String(reader.result)); reader.readAsDataURL(f); } if (!name) setName(f.name.replace(/\.[^.]+$/, '')); };
  const favorite = (id: number) => setProjects(ps => ps.map(p => p.id === id ? {...p, favorite: !p.favorite} : p));
  return <div>
    <aside className="sidebar">
      <div className="brand flex items-center gap-2.5 px-6 py-7">
        <span className="brand-symbol"><Box size={23} strokeWidth={1.6}/></span>
        <span className="brand-word font-display text-[20px] font-extrabold tracking-tight">aashray<span className="ml-1 text-[10px] font-bold text-primary">AI</span></span>
      </div>
      <div className="sidebar-label px-6 pb-3 pt-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Workspace</div>
      <nav className="space-y-1 px-3">{navItems.map(({label,icon: Icon}) => <Button key={label} variant="nav" className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => { setActive(label); setQuery(''); }} title={label}><Icon size={18}/><span className="sidebar-label text-[13px]">{label}</span></Button>)}<Button asChild variant="nav" className="nav-item" title="Construction intelligence"><Link to="/construction"><HardHat size={18}/><span className="sidebar-label text-[13px]">Construction AI</span></Link></Button></nav>
      <div className="sidebar-extra mx-5 mt-auto mb-6 rounded-lg border border-border bg-background p-4"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Sparkles size={14} className="text-primary"/>A little more possibility</div><p className="text-[11px] leading-relaxed text-muted-foreground">Your next beautiful space<br/>starts with an idea.</p><Button variant="outline" className="mt-3 h-8 w-full text-[11px]" onClick={() => openCreate('create')}>Start creating <ArrowUpRightIcon/></Button></div>
      <div className="mb-3 px-3"><Button variant="nav" className="nav-item" title="Settings" onClick={() => setModal('settings')}><Settings/><span className="sidebar-label text-[13px]">Settings</span></Button><Button variant="nav" className="nav-item" title="Help & support" onClick={() => setModal('help')}><CircleHelp/><span className="sidebar-label text-[13px]">Help & support <ArrowUpRightIcon/></span></Button></div>
      <div className="border-t border-border px-4 py-3">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {initials}
              </span>
              <div className="sidebar-label min-w-0">
                <div className="truncate text-xs font-semibold text-foreground">{displayName || 'My Account'}</div>
                <div className="truncate text-[10px] text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="sidebar-label h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              title="Sign out of your session"
              onClick={handleSignOut}
            >
              <LogOut size={13} />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                <UserIcon size={13} />
              </span>
              <div className="sidebar-label">
                <div className="text-xs font-semibold text-foreground">Guest Workspace</div>
                <div className="text-[10px] text-muted-foreground">Session mode</div>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="sidebar-label h-7 w-full gap-1.5 text-[11px] font-semibold">
              <Link to="/auth">
                <LogIn size={12} /> Sign in / Register
              </Link>
            </Button>
          </div>
        )}
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card"><div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"><Button variant="ghost" size="icon" className="mobile-menu shrink-0" aria-label="Open navigation" onClick={()=>setMobileNav(true)}><Menu/></Button><House size={15} className="breadcrumb-home shrink-0"/><ChevronRight size={12} className="breadcrumb-home shrink-0"/><span className="truncate text-foreground">{active}</span></div><div className="header-tools flex shrink-0 items-center gap-3"><Button variant="ghost" className="search-trigger h-8 gap-3 text-xs text-muted-foreground" onClick={() => setModal('search')}><Search size={15}/>Search anything<span className="rounded border border-border px-1.5 py-0.5 text-[10px]">⌘ K</span></Button><div className="h-5 border-l border-border"/><Button size="icon" variant="ghost" title="Notifications" aria-label="Notifications" onClick={() => setModal('notifications')}><Bell size={18}/></Button>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary" title={user.email ?? displayName}>
              {initials}
            </span>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive" onClick={handleSignOut} title="Sign out">
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        ) : (
          <Button asChild size="sm" className="h-8 gap-1.5 px-3 text-xs font-semibold">
            <Link to="/auth">
              <LogIn size={13} /> Sign in
            </Link>
          </Button>
        )}
      </div></header>
      <main className="main-content enter">
        <div className="welcome-row mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"><div className="min-w-0"><div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground"><span className="text-clay">✦</span> A SPACE FOR YOUR IDEAS</div><h1 className="text-[29px] font-semibold">{active === 'Overview' ? (user ? `Welcome home, ${displayName}` : 'Welcome to Aashray') : active}</h1><p className="mt-1.5 text-[13px] text-muted-foreground">{active === 'Overview' ? (user ? 'Good spaces start with a little imagination. What will you create today?' : 'Intelligent 3D floor planning, interior design, and construction decision platform.') : 'A fresh perspective on your personal space.'}</p></div><Button className="new-project h-10 shrink-0 px-4 text-xs" onClick={() => openCreate('create')}><Plus size={16}/>New project</Button></div>
        {(active === 'Overview' || active === 'Design studio') && <><section className="feature-scene"><img src={living} width={1536} height={1024} alt="Sunlit Japandi living room with natural materials and a sage accent wall"/><div className="hero-copy"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass px-3 py-1.5 text-[10px] backdrop-blur-md"><Sparkles size={12}/>YOUR SPACE. REIMAGINED.</div><h2>A home that feels<br/>a little more like you.</h2><p className="mt-3 text-xs leading-relaxed text-image-foreground/80">From the first idea to the finishing touches.<br/>Make room for something extraordinary.</p><Button variant="glass" className="mt-5 h-9 px-4 text-[11px]" onClick={() => openCreate('redesign')}>Reimagine my space <ArrowRight size={14}/></Button></div><div className="hero-meta"><span className="h-1.5 w-1.5 rounded-full bg-image-foreground"/> The Japandi edit <span className="mx-1 opacity-60">/</span> Concept inspiration</div></section>
        <section className="quick-actions">
          {[
            {
              icon: Upload,
              title: 'Upload a floor plan',
              text: 'Convert 2D blueprint to interactive 3D house model',
              action: () => setActive('3D Floor Plan Studio'),
            },
            {
              icon: Sparkles,
              title: 'Redesign a room',
              text: 'Upload room photos for interior & furniture styling',
              action: () => setActive('3D Floor Plan Studio'),
            },
            {
              icon: Box,
              title: 'Start from scratch',
              text: 'A blank canvas, endless possibility',
              action: () => openCreate('create'),
            },
          ].map(({ icon: Icon, title, text, action }) => (
            <Button key={title} variant="outline" className="action-tile" onClick={action}>
              <span className="action-icon"><Icon /></span>
              <span className="action-text ml-1 min-w-0 text-left">
                <span className="block text-xs font-semibold">{title}</span>
                <small className="mt-1 block text-[10px] font-normal text-muted-foreground">{text}</small>
              </span>
              <ArrowUpRightIcon className="tile-arrow ml-auto text-muted-foreground" />
            </Button>
          ))}
        </section></>}
        {(active === 'Overview' || active === 'Budget planner') && <section className="stats">{[{label:'Your projects',value:String(projects.length).padStart(2,'0'),icon:FolderOpen,detail:'Ideas taking shape'},{label:'Saved favorites',value:String(projects.filter(p=>p.favorite).length).padStart(2,'0'),icon:Heart,detail:'Spaces you love'},{label:'Furnishing budget',value:'₹5,00,000',icon:Wallet,detail:'Sample home estimate'},{label:'Style discoveries',value:'12',icon:Sparkles,detail:'Curated for your space'}].map(({label,value,icon:Icon,detail})=><div className="stat" key={label}><div className="flex items-center gap-2 text-[11px] text-muted-foreground"><Icon size={14}/>{label}</div><div className="mt-2 font-display text-[25px] font-semibold">{value}</div><div className="mt-1 text-[10px] text-muted-foreground">{detail}</div></div>)}</section>}
        {active === 'Design studio' && (
          <section className="mt-6 mb-8">
            <ClimateAdvisor />
          </section>
        )}
        {active === '3D Floor Plan Studio' ? (
          <FloorPlanStudio />
        ) : active === 'Budget planner' ? (
          <BudgetDesignStudio />
        ) : active === 'Furniture discovery' ? (
          <FurnitureDiscovery />
        ) : <>
        <section className="mt-7"><div className="section-heading mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><h2 className="min-w-0 text-[18px] font-semibold">{active === 'Saved collection' ? 'Your saved spaces' : active === 'Design studio' ? 'Find your next direction' : 'Your recent projects'}</h2><Button variant="ghost" className="h-7 gap-2 px-0 text-[11px] text-muted-foreground" onClick={()=> {setActive(active === 'My projects' ? 'Overview' : 'My projects');setTab('All projects');}}> {active === 'My projects' ? 'Back to overview' : 'View all projects'}<ArrowRight size={13}/></Button></div>
        <div className="project-controls mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="flex gap-1">{['All projects','Favorites'].map(t=><Button key={t} variant={tab===t?'secondary':'ghost'} className="h-7 px-3 text-[11px]" onClick={()=>setTab(t)}>{t}{t==='All projects' && <span className="ml-1 text-[9px] text-muted-foreground">{projects.length}</span>}</Button>)}</div><div className="flex items-center gap-2"><Button variant="ghost" className="h-7 gap-2 text-[10px] text-muted-foreground" onClick={()=>setSort(!sort)}>Last edited {sort?<ArrowDown size={12}/>:<ChevronDown size={12}/>}</Button><span className="h-4 border-l border-border"/><Button variant={!list?'secondary':'ghost'} size="icon" className="h-7 w-7" aria-label="Grid view" onClick={()=>setList(false)}><LayoutGrid size={14}/></Button><Button variant={list?'secondary':'ghost'} size="icon" className="h-7 w-7" aria-label="List view" onClick={()=>setList(true)}><List size={14}/></Button></div></div>
        <div className={list?'grid grid-cols-1 gap-4':'project-grid'}>{filtered.map(p=><article key={p.id} className={`project-card ${list?'project-list-item':''}`}><div className="project-image"><Button variant="ghost" className="project-open" aria-label={`Open ${p.name}`} onClick={()=>setSelected(p)}><img src={p.image} alt={p.name} width={1024} height={768} loading="lazy"/></Button><span className="project-label">{p.style}</span><Button variant="glass" className="project-heart" aria-label={`${p.favorite?'Unsave':'Save'} ${p.name}`} onClick={()=>favorite(p.id)}><Heart size={13} fill={p.favorite?'currentColor':'none'}/></Button></div><div className="min-w-0 p-4"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><h3 className="truncate text-xs font-semibold">{p.name}</h3><Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" aria-label={`Manage ${p.name}`} onClick={()=>setSelected(p)}><MoreHorizontal size={14}/></Button></div><p className="mt-2 flex gap-2 text-[10px] text-muted-foreground"><House size={12}/>{p.rooms}<span>·</span>{p.area}</p><div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[9px] text-muted-foreground"><span>Edited {p.edited}</span><span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-primary"/> {p.area==='Unmeasured'?'Draft':'Concept'}</span></div></div></article>)}</div>{filtered.length===0 && <div className="py-14 text-center text-sm text-muted-foreground"><Heart className="mx-auto mb-3"/>No projects here yet.</div>}
        </section>
        <section className="inspiration-strip"><Leaf size={27} strokeWidth={1.3} className="shrink-0 text-primary"/><div className="min-w-0"><h3 className="text-xs font-semibold">Less noise. More you.</h3><p className="mt-1 text-[11px] text-muted-foreground">Discover the Japandi edit — natural textures, quiet tones, intentional living.</p></div><Button variant="ghost" className="shrink-0 gap-2 text-[11px] text-primary" onClick={()=>{setSelected(initialProjects[0] ?? null);}}>Explore the edit <ArrowRight size={14}/></Button></section></>}
        <footer className="workspace-footer mt-7 text-[9px] text-muted-foreground"><span>Thoughtfully designed. Beautifully lived.</span><span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-primary"/>Made for your kind of home</span></footer>
      </main>
    </div>
    {notice && <div className="workspace-notice fixed bottom-5 right-5 z-50 flex max-w-[300px] items-center gap-3 rounded-lg border border-border bg-card p-4 text-xs shadow-lg">{notice}<Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Dismiss message" onClick={()=>setNotice('')}><X/></Button></div>}
    <Dialog open={mobileNav} onOpenChange={setMobileNav}><DialogContent className="workspace-dialog max-h-[calc(100dvh-32px)] max-w-[calc(100vw-32px)] overflow-y-auto sm:max-w-sm"><DialogTitle>Aashray AI</DialogTitle><DialogDescription>{user ? `Signed in as ${user.email}` : 'Personal workspace'}</DialogDescription><nav className="space-y-1">{navItems.map(({label,icon:Icon})=><Button key={label} variant="nav" className={`nav-item ${active===label?'active':''}`} onClick={()=>{setActive(label);setQuery('');setMobileNav(false);}}><Icon/><span>{label}</span></Button>)}<Button asChild variant="nav" className="nav-item"><Link to="/construction" onClick={()=>setMobileNav(false)}><HardHat/><span>Construction AI</span></Link></Button></nav><div className="border-t border-border pt-3 space-y-2">{user ? <Button variant="outline" className="w-full justify-start text-xs text-destructive hover:text-destructive" onClick={() => { setMobileNav(false); handleSignOut(); }}><LogOut size={14} className="mr-2"/>Sign out ({user.email})</Button> : <Button asChild className="w-full justify-start text-xs" onClick={() => setMobileNav(false)}><Link to="/auth"><LogIn size={14} className="mr-2"/>Sign in / Register</Link></Button>}<div className="grid grid-cols-2 gap-2"><Button variant="ghost" onClick={()=>{setMobileNav(false);setModal('settings');}}><Settings/>Settings</Button><Button variant="ghost" onClick={()=>{setMobileNav(false);setModal('help');}}><CircleHelp/>Help</Button></div></div></DialogContent></Dialog>
    <Dialog open={modal!==null} onOpenChange={o=>{if(!o)setModal(null);}}><DialogContent className="workspace-dialog max-h-[calc(100dvh-32px)] max-w-[calc(100vw-32px)] overflow-y-auto sm:max-w-lg"><DialogTitle>{modal==='search'?'Find your space':modal==='notifications'?'You’re all caught up':modal==='settings'?'Workspace preferences':modal==='help'?'A little guidance':modal==='upload'?'Bring your floor plan':modal==='redesign'?'Reimagine your room':'Make room for a new idea'}</DialogTitle><DialogDescription>{modal==='notifications'?'Price-drop alerts will appear here when retailer tracking is connected.':modal==='settings'?'A personal architecture and interior design workspace for Indian homes.':modal==='help'?'Explore 3D floor plans, interactive architectural models, interior layouts, and construction decision tools.':modal==='search'?'Find a project in your workspace.':'Start a concept project. Upload blueprints or room photos to generate 3D models and interior layouts.'}</DialogDescription>
      {modal==='search' ? <><input className="form-field" placeholder="Search projects…" value={query} onChange={e=>setQuery(e.target.value)} autoFocus/>{filtered.map(p=><Button variant="ghost" className="justify-start" key={p.id} onClick={()=>{setModal(null);setSelected(p);}}><FolderOpen/>{p.name}<ArrowRight className="ml-auto"/></Button>)}</> : modal==='settings' ? <><label className="text-xs">Units<select className="form-field"><option>Metric (m, m²)</option><option>Imperial (ft, ft²)</option></select></label><label className="text-xs">Currency<select className="form-field"><option>Indian rupee (₹ INR)</option></select></label><Button onClick={()=>{setModal(null);setNotice('Preferences selected for this preview.');}}>Done <Check/></Button></> : modal==='notifications'||modal==='help' ? <Button variant="outline" onClick={()=>setModal(null)}>Got it</Button> : <>
      {modal!=='create' && <>
        <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
          <div>
            <div className="font-semibold text-foreground">Interactive 3D Floor Plan Studio</div>
            <div className="text-[11px] text-muted-foreground">Upload 2D blueprints or room photos to generate 3D house models & furniture recommendations.</div>
          </div>
          <Button size="sm" className="h-7 shrink-0 text-[11px]" onClick={() => { setModal(null); setActive('3D Floor Plan Studio'); }}>
            Open Studio <ArrowRight size={12} className="ml-1" />
          </Button>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={e=>onFile(e.target.files?.[0])}/>
        <div className="upload-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onFile(e.dataTransfer.files[0]);}}><Upload className="mx-auto mb-3 text-primary"/><Button variant="outline" onClick={()=>inputRef.current?.click()}>{file?file.name:'Choose a file'}</Button><p className="mt-3 text-[10px] text-muted-foreground">JPG, PNG or PDF · Drop your file here</p></div>{preview && <img src={preview} className="h-36 w-full rounded-md object-contain" alt="Your uploaded space"/>}
      </>}
      <label className="text-xs font-medium">Project name<input className="form-field" placeholder="e.g. My Mumbai apartment" value={name} onChange={e=>setName(e.target.value)} autoFocus={modal==='create'}/></label><label className="text-xs font-medium">Design direction<select className="form-field" value={style} onChange={e=>setStyle(e.target.value)}>{['Japandi','Modern Indian','Contemporary','Minimalist','Scandinavian','Traditional Indian','Bohemian'].map(s=><option key={s}>{s}</option>)}</select></label>{modal==='upload' && <label className="text-xs font-medium">Known measurement (optional, metres)<input type="number" min="0.1" step="0.1" placeholder="e.g. one wall is 4.2 m" className="form-field"/></label>}<Button onClick={addProject} disabled={!name.trim() || (modal==='upload'&&!file)}>Create concept project<ArrowRight/></Button></>}
    </DialogContent></Dialog>
    <Dialog open={selected!==null} onOpenChange={o=>{if(!o)setSelected(null);}}><DialogContent className="workspace-dialog max-h-[calc(100dvh-32px)] max-w-[calc(100vw-32px)] overflow-y-auto sm:max-w-2xl"><DialogTitle>{selected?.name}</DialogTitle><DialogDescription>{selected?.style} · {selected?.rooms} · {selected?.area} — Inspiration preview, not a measured 3D model.</DialogDescription>{selected && <><img src={selected.image} className="design-preview" alt={selected.name}/><label className="text-xs">Project name<input className="form-field" value={selected.name} onChange={e=>{const value=e.target.value;setSelected({...selected,name:value});setProjects(ps=>ps.map(p=>p.id===selected.id?{...p,name:value}:p));}}/></label><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>{favorite(selected.id);setSelected({...selected,favorite:!selected.favorite});}}><Heart fill={selected.favorite?'currentColor':'none'}/>{selected.favorite?'Saved':'Save favorite'}</Button><Button variant="outline" onClick={()=>{setProjects(ps=>[{...selected,id:Date.now(),name:`${selected.name} (copy)`,edited:'Just now'},...ps]);setSelected(null);setNotice('Project duplicated in this session.');}}><Plus/>Duplicate</Button><Button variant="ghost" className="ml-auto text-destructive" onClick={()=>{setProjects(ps=>ps.filter(p=>p.id!==selected.id));setSelected(null);}}>Delete project</Button></div></>}</DialogContent></Dialog>
  </div>;
}
function ArrowUpRightIcon({className=''}:{className?:string}) { return <ArrowDownRight className={`-rotate-90 ${className}`} size={14}/>; }
