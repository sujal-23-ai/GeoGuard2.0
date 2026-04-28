# GeoGuard — Real-Time Safety Intelligence Platform

A hyper-realistic, 3D interactive, map-first web application combining Uber-style UX, Waze crowdsourcing, Palantir analytics, and Apple Vision Pro-inspired glassmorphism UI.

## Tech Stack

**Frontend:** React (Vite) · Tailwind CSS · ShadCN UI · Framer Motion · Three.js · Mapbox GL JS · Zustand · React Query · Recharts

**Backend:** Node.js · Express.js · Socket.IO · JWT Auth · Google OAuth · Passport.js

**Database:** MongoDB (Mongoose + 2dsphere geo queries) · Redis (caching + pub/sub)

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)
- Redis (optional — app gracefully degrades without it)
- Mapbox account (free tier works)

### 1. Clone & Setup

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev

# Frontend (new terminal)
cd frontend
cp .env.example .env
# Add your VITE_MAPBOX_TOKEN to .env
npm install
npm run dev
```

### Calling Agent (SOS Voice Call & SMS)

```bash
cd calling_agent

# Create & activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt

# Start the server
python3 main.py
```

The calling agent runs on **http://localhost:8000** and exposes the `/api/v1/sos_call` endpoint used by the frontend SOS button.

for all fastapi **http://localhost:8000/docs** 

### 2. Database Setup

MongoDB creates the `geoguard` database and all collections automatically on first run. Indexes (including `2dsphere` for geo queries) are created by Mongoose schema definitions.

For **MongoDB Atlas**: replace `MONGODB_URI` with your Atlas connection string.

### 3. Environment Variables

**Backend** (`backend/.env`):
```
MONGODB_URI=mongodb://localhost:27017/geoguard
# Atlas: mongodb+srv://user:pass@cluster.mongodb.net/geoguard
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=...        # Optional
GOOGLE_CLIENT_SECRET=...    # Optional
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```
VITE_MAPBOX_TOKEN=pk.eyJ1...   # Get from mapbox.com (free)
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

> **Demo mode:** Without a Mapbox token, the map shows a solid dark background. All other features (3D landing, incident feed, analytics, SOS, etc.) work fully.

## Features

### 🗺️ Live Map Dashboard
- Real-time incident markers with severity-colored glow effects
- Mapbox cluster view at low zoom (zoom < 11) — expands on click
- 3D building extrusion layer (with Mapbox token)
- Heatmap toggle for density visualization
- Satellite/dark map toggle
- Safe Zones overlay — hospitals, police stations, fire stations (via Overpass API)

### 📋 Incident Reporting
- 10 categories with emoji icons
- 5-level severity slider with AI tag simulation
- GPS location auto-fill with map click-to-place
- +10 points earned per verified report
- "Still Happening" confirm button — tracks live confirmation count

### ⏱️ Filtering
- Filter by category, severity, and radius
- **Time window filter**: 1h / 6h / 24h / 7d
- Active filter count badge

### 📡 Real-Time Engine
- WebSocket events: `new_incident`, `update_incident`, `sos_alert`, `user_count`
- Live incident feed sidebar with toast notifications
- Socket-based location updates for server-side danger zone detection

### 📊 Analytics Dashboard
- Category breakdown bar chart
- Severity distribution pie chart
- Hourly incident trend line chart
- Dynamic risk score with explainable label ("N incidents · max sev X")

### 🆘 SOS Mode
- One-tap emergency broadcast
- Blinking red border overlay
- Alert pushed to all connected users

### 🔐 Authentication
- JWT email/password
- Google OAuth
- User profile with trust score and gamification points
- Leaderboard

### 🌍 3D Landing Globe
- React Three Fiber globe with Fresnel atmosphere shader
- Instanced data markers per country (severity-colored)
- Animated arcs between high-risk hotspots
- Hover tooltips, click-to-focus camera
- Global / High-Risk-Only toggle

## Screenshots

> Add screenshots to `docs/screenshots/` and reference them here.

## API Reference

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

GET  /api/incidents/nearby?lng=&lat=&radius=
GET  /api/incidents/analytics?days=7
POST /api/incidents
POST /api/incidents/:id/vote

GET  /api/users/leaderboard
POST /api/users/sos
```

## Project Structure

```
GeoGuard/
├── frontend/src/
│   ├── app/              # App entry & routing
│   ├── components/       # Reusable UI (map, 3d, cards, overlays)
│   ├── features/         # Feature modules (auth, incidents, analytics, map, user)
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Zustand global state
│   ├── services/         # API client & Socket.IO
│   └── utils/            # Helpers, constants
└── backend/src/
    ├── config/           # DB, Redis, Passport
    ├── controllers/      # Request handlers
    ├── models/           # PostgreSQL queries
    ├── routes/           # Express routers
    ├── sockets/          # Socket.IO events
    └── middleware/       # Auth, rate limiting, validation
```
# GeoGuard2.0

## Attribution & Credits

- **Design Inspiration:** Apple Vision Pro (Glassmorphism UI), Uber (Map-first interaction), Waze (Crowdsourced incident reporting).
- **Map Data:** [Mapbox GL JS](https://www.mapbox.com/) for map rendering and 3D buildings.
- **Safe Zones Data:** [Overpass API (OpenStreetMap)](https://wiki.openstreetmap.org/wiki/Overpass_API) for fetching nearby hospitals, fire stations, and police stations.
- **3D Engine:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) & [Three.js](https://threejs.org/) for the interactive 3D globe.
- **Icons:** Emojis and standard SVG icons.
