# Aashray AI (आश्रय)

> **Intelligent Architectural & Interior Design Platform**  
> 3D Interactive Floor Plans • Room Interior Concepts • Curated Indian Furniture Sourcing • Smart Budget Planning • Construction AI

Aashray AI is a full-stack architectural intelligence platform designed to empower homeowners, architects, and interior designers to transform 2D floor plans and room photos into interactive 3D spatial models, curated interior aesthetics, realistic Indian Rupee budget estimates, and direct-to-retail store recommendations.

---

## ✨ Features

- **🏛️ 2D Floor Plan & Blueprint to 3D Vision Studio**
  - Instant conversion of 2D blueprints into an interactive Three.js 3D isometric house model with 360° orbit, zoom, and cutaway views.
  - Curated links and guides for 100% free external 3D architectural modeling tools (Sweet Home 3D, Planner 5D, Floorplanner, RoomGPT).
  - Room-by-room interior layouts with photorealistic design concept banners and finish schemes.
  - Furniture recommendations with product photography, sizing, and direct store search links on Amazon India, Pepperfry, IKEA India, and Urban Ladder.

- **🎨 Multi-Room Interior Design & Budget Studio**
  - Dynamic interior curation across Japandi, Modern Indian, Scandinavian, and Contemporary aesthetics.
  - Phase-wise cost breakdowns in Indian Rupees (₹) with civil work, cabinetry, and loose furnishings.

- **🛋️ Live Furniture Discovery Catalog**
  - Curated catalog of signature furnishings with realistic INR price bands.
  - Direct store links tailored for the Indian e-commerce landscape.

- **🏗️ Construction Intelligence & Crack Inspection**
  - Multimodal AI site inspection analyzing structural integrity, crack severity, and remedial steps.

- **🔐 Supabase Authentication & Multi-User Workspaces**
  - Individual session-based sign in and sign up.
  - Automated email confirmation powered by Resend API.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm or pnpm

### Installation

```bash
git clone https://github.com/Nivedikagour/Aashray.git
cd Aashray
npm install
```

### Environment Configuration

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Set the following variables in `.env`:

```env
# Supabase Configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"
VITE_GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.5-flash"

# Resend API (Sign up confirmation emails)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Aashray <onboarding@resend.dev>"
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🛠️ Tech Stack

- **Framework**: TanStack Start (SSR + Vite)
- **Styling**: Tailwind CSS & Glassmorphic Design Tokens
- **3D Engine**: Three.js isometric spatial engine
- **AI Engine**: Google Gemini 3.5 Flash Multimodal
- **Database & Auth**: Supabase PostgreSQL & Auth
- **Email Delivery**: Resend API
- **Deployment**: Vercel Serverless Lambdas
