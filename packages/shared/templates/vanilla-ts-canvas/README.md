# Vanilla TS Canvas (Vite)

A minimal, **framework-free** TypeScript + Vite canvas runner:
- Fixed port **5173** (dev & preview)
- `/public/healthz.txt` for health checks
- No external assets; pixel art drawn in code
- Jump with ↑ or Space (tap on mobile), obstacles + birds, difficulty ramp, HUD & restart overlay

## Run
```bash
npm i
npm run dev          # http://localhost:5173
# or
npm run build
npm start            # http://localhost:5173
```