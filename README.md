# GeoGuard — Real-Time Safety Intelligence Platform

GeoGuard is a map-first safety intelligence platform that combines crowdsourced incident reporting, live websocket updates, AI-assisted risk scoring, safe routing, emergency alerts, admin moderation, and a polished 3D landing experience.

It is built to help users understand what is happening around them in real time, respond faster during emergencies, and make safer route and location decisions.

## Tech Stack

**Frontend:** React (Vite), Tailwind CSS, Framer Motion, React Query, Zustand, Mapbox GL JS, React Three Fiber, Recharts

**Backend:** Node.js, Express.js, Socket.IO, JWT Auth, Passport.js, Google OAuth

**Database & Cache:** MongoDB (Mongoose + `2dsphere` geo queries), Redis (cache + temporary session storage)

**Emergency Services:** FastAPI calling agent, Twilio SMS, optional external voice-call provider

## Core Idea

GeoGuard turns safety information into a live map experience.

Instead of showing a static list of reports, it continuously collects incidents from users, pushes updates in real time, scores risk for places and routes, and provides tools for emergency response and community moderation.

## Main Features

### 1. Live Map Dashboard

- Real-time incident markers with severity-based glow effects
- Cluster view at low zoom levels to reduce map clutter
- 3D building extrusion layer when a Mapbox token is available
- Heatmap toggle for density visualization
- Satellite / dark map toggle
- Safe-zone overlay showing hospitals, police stations, and fire stations
- User location marker with auto focus and manual map controls

### 2. Incident Reporting

- Multi-step incident reporting flow
- 10 categories with emoji icons
- 5-level severity slider
- Voice input support in the report form
- Media upload for images and videos
- GPS location auto-fill and map click-to-place support
- Confirmation count for live validation of reports
- Point rewards for verified reporting activity

### 3. Realtime Engine

- WebSocket events for `new_incident`, `update_incident`, `sos_alert`, and `user_count`
- Live incident feed sidebar
- Toast notifications for alerts and updates
- Socket-based location updates for danger-zone detection
- Live mode toggle for high-frequency tracking

### 4. AI and Prediction

- AI-assisted incident verification
- Safety assistant for questions like “Is it safe to go there?”
- Risk prediction by area
- Zone analysis using incident data + weather + traffic fusion
- Explainable risk summaries based on visible incidents

### 5. Routing

- Safe route vs fast route comparison
- Route risk scoring based on incident proximity
- Active journey tracking with GPS updates
- Destination arrival detection

### 6. SOS Mode

- One-tap emergency broadcast
- In-app SOS alert overlay
- SMS notification to emergency contacts
- Voice-call escalation through the calling agent
- Emergency event broadcast to all connected clients

### 7. Authentication and Roles

- Email/password login with JWT
- Google OAuth login
- User profile with trust score and points
- Leaderboard for gamified participation
- Role-based access control for admin and moderator tools

### 8. Admin Console

- Dashboard overview for users and reports
- Incident verification and visibility control
- User ban / unban controls
- Role changes between user, moderator, and admin
- Searchable user management

### 9. News Panel

- Local safety news by city or current area
- GNews integration when API key is available
- Demo fallback when the news API is missing

### 10. 3D Landing Experience

- React Three Fiber globe
- Animated arcs and hotspot markers
- Glassmorphism-style hero section
- Interactive, presentation-friendly landing page

## Project Flow

1. The user opens the app and lands on the 3D landing page.
2. The app fetches the user’s location and loads nearby incidents.
3. The frontend connects to Socket.IO for live updates.
4. New reports are submitted through the report panel.
5. The backend validates, enriches, stores, and broadcasts the incident.
6. Analytics, AI assistant, routing, admin tools, and news use the latest data.
7. SOS can notify the community instantly and escalate to SMS / voice call.

## Folder Structure

```text
GeoGuard/
├── frontend/
│   └── src/
│       ├── app/            # App bootstrap and view switching
│       ├── components/     # Shared UI, map, overlays, and 3D visuals
│       ├── features/       # Feature modules: auth, map, incidents, news, AI, admin, routing, user
│       ├── hooks/          # React hooks for location, incidents, sockets, news
│       ├── services/       # Axios API client and Socket.IO client
│       ├── store/          # Zustand global state
│       └── utils/          # Helpers, constants, and utility functions
├── backend/
│   └── src/
│       ├── config/         # MongoDB, Redis, Passport config
│       ├── controllers/    # Request handlers
│       ├── middleware/     # Auth, validation, and rate limiting
│       ├── models/         # Mongoose models
│       ├── routes/         # Express routers
│       ├── services/       # AI, prediction, email, cloudinary, and data fusion services
│       └── sockets/        # Socket.IO events and background danger-zone checks
└── calling_agent/          # FastAPI service for SOS voice-call escalation
```

## How the App Is Connected

### Frontend shell

- The app starts from [frontend/src/main.jsx](frontend/src/main.jsx)
- View switching happens in [frontend/src/app/App.jsx](frontend/src/app/App.jsx)
- The main map experience is assembled in [frontend/src/features/map/MapDashboard.jsx](frontend/src/features/map/MapDashboard.jsx)

### Server bootstrap

- Express is configured in [backend/src/app.js](backend/src/app.js)
- MongoDB and Redis are initialized in [backend/server.js](backend/server.js)
- Socket.IO is attached to the same HTTP server for realtime updates

### Data flow

1. The frontend calls REST endpoints through the Axios client in [frontend/src/services/api.js](frontend/src/services/api.js).
2. The backend routes forward requests to controllers.
3. Controllers use models and services to read / write data.
4. Socket.IO pushes changes back to the frontend immediately.

## Run Locally

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Calling Agent (optional)

```bash
cd calling_agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

FastAPI docs:

```text
http://localhost:8000/docs
```

## Environment Variables

### Backend (`backend/.env`)

```bash
MONGODB_URI=mongodb://localhost:27017/geoguard
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# Optional integrations
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
GNEWS_API_KEY=...
OPENWEATHER_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
BLAND_API_KEY=...
GEMINI_API_KEY=...
```

### Frontend (`frontend/.env`)

```bash
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_MAPBOX_TOKEN=...
VITE_CALLING_AGENT_URL=http://localhost:8000
```

## API Reference

### Auth

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
GET  /api/auth/google
GET  /api/auth/google/callback
```

### Incidents

```text
GET  /api/incidents/nearby?lng=&lat=&radius=
GET  /api/incidents/analytics?days=7
GET  /api/incidents
GET  /api/incidents/:id
POST /api/incidents
POST /api/incidents/:id/vote
POST /api/incidents/:id/confirm
DELETE /api/incidents/:id
```

### Users

```text
GET  /api/users/me
PUT  /api/users/me
POST /api/users/me/location
GET  /api/users/leaderboard
POST /api/users/sos
POST /api/users/share-location
GET  /api/users/share-location/:token
PUT  /api/users/share-location/:token
DELETE /api/users/share-location/:token
```

### Prediction and AI

```text
GET  /api/prediction/risk?lat=&lng=&radius=
GET  /api/prediction/zone?lat=&lng=
POST /api/prediction/ask
```

### News

```text
GET  /api/news?city=&lat=&lng=
```

### Admin

```text
GET   /api/admin/stats
GET   /api/admin/incidents
PATCH /api/admin/incidents/:id/verify
PATCH /api/admin/incidents/:id/toggle
GET   /api/admin/users
PATCH /api/admin/users/:id/toggle
PATCH /api/admin/users/:id/role
```

## Notes for Evaluation

- Redis is optional. If it is unavailable, GeoGuard keeps running with cache disabled.
- If the Mapbox token is missing, the UI falls back to a dark demo map style.
- Admin access is role-based. A user must have `role: admin` or `role: moderator` to see the admin panel.
- The backend uses geospatial indexes (`2dsphere`) for nearby searches and route/risk computations.
- The calling agent is a separate FastAPI service that handles SOS voice escalation.



## Attribution

- Design inspiration: Apple Vision Pro, Uber, Waze
- Map rendering: Mapbox GL JS
- Safe-zone data: Overpass API / OpenStreetMap
- 3D visuals: React Three Fiber and Three.js
- Icons: Lucide and emoji-based markers
