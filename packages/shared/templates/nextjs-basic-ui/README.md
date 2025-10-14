# Next.js Basic UI (App Router + TypeScript)

A minimal, production-ready Next.js starter with:
- App Router (`app/`), TypeScript
- Fixed port **5173** for both dev and start
- `/healthz` route for runner health checks
- Simple JSON API at `/api/echo`
- Clean CSS-only UI (no Tailwind), easy to theme

## Run
```bash
npm i
npm run dev          # http://localhost:5173
# or
npm run build
npm start            # http://localhost:5173
```
## Healthcheck
- `GET /healthz` → `ok`
- `GET /api/echo?msg=hello` → `{ ok: true, method: 'GET', msg: 'hello' }`
- `POST /api/echo` with JSON → echoes back

## Customize
- Edit `app/page.tsx` to add cards/links.
- Add more routes under `app/api/*` or `app/(group)/page.tsx`.
- Replace `app/globals.css` with your design system or Tailwind later.