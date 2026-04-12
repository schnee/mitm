# Getting Started

## Prerequisites

- Node.js 20+
- npm or pnpm
- Google Maps API key (for ranking)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd mitm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create local environment**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure Google Maps**
   
   Get an API key from [Google Cloud Console](https://console.cloud.google.com):
   - Create a project
   - Enable Places API, Distance Matrix API, Geocoding API
   - Create credentials (API key)
   - Add the key to `.env.local`:
     ```
     GOOGLE_MAPS_API_KEY=your_key_here
     ```

## Running Locally

Requires two terminals:

**Terminal 1 - API server:**
```bash
set -a && source .env.local && set +a && npm run dev:api
```
- API runs on http://localhost:8080
- Health check: http://localhost:8080/health

**Terminal 2 - Web app:**
```bash
npm run dev:web
```
- Web runs on http://localhost:3000

## Testing the Flow

1. Open http://localhost:3000 in Browser A
2. Click "Create session"
3. Copy the invite URL
4. Open the invite URL in Browser B (incognito)
5. In both browsers, enter locations (or use manual coordinates)
6. Set travel preferences (e.g., 70/30)
7. Wait for ranked results
8. Add places to shortlist
9. Confirm final venue

## Next Steps

- See `docs/DEVELOPMENT.md` for contributing
- See `docs/TESTING.md` for running tests
- See `docs/CONFIGURATION.md` for environment options