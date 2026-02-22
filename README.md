# SplitRight

A fair expense splitting PWA for college roommates. Mobile-first, native-feel design with a Slate & Sage color system.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Node.js + Express REST API |
| Database | PostgreSQL |
| Auth | JWT tokens + bcrypt (httpOnly cookies) |
| Frontend deploy | Vercel |
| Backend + DB deploy | Railway |
| PWA | manifest.json + service worker |

## Features

- **Authentication** — Register / login with JWT stored in httpOnly cookies
- **Groups** — Create groups, share 8-char invite codes, members list
- **Expenses** — Add expenses with equal / custom / percentage splits
- **Balances** — Net balance per user with debt simplification algorithm
- **Settle Up** — Record payments to mark debts cleared
- **PWA Ready** — Add to Home Screen on iOS/Android for full-screen experience
- **Offline Banner** — Detects and displays offline state

## Project Structure

```
SplitRight/
├── server/                     # Express backend
│   ├── routes/
│   │   ├── auth.js             # POST /auth/register|login|logout, GET /auth/me
│   │   ├── groups.js           # CRUD groups + invite code join
│   │   ├── expenses.js         # CRUD expenses + splits
│   │   ├── balances.js         # GET balances + simplified settlements
│   │   └── settlements.js      # POST/GET settlements
│   ├── middleware/
│   │   └── auth.js             # JWT verification
│   ├── lib/
│   │   ├── db.js               # PostgreSQL pool
│   │   └── debtSimplifier.js   # Debt minimization algorithm
│   ├── migrations/
│   │   └── 001_init.sql        # Full schema
│   └── server.js               # Express entry point
│
└── client/                     # Next.js frontend
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/         # Login / Register pages
    │   │   └── (app)/          # Protected app pages
    │   │       ├── dashboard/
    │   │       ├── groups/
    │   │       │   ├── new/
    │   │       │   ├── join/
    │   │       │   └── [id]/
    │   │       │       ├── add/
    │   │       │       └── balances/
    │   │       ├── balances/
    │   │       └── profile/
    │   ├── components/         # Reusable UI components
    │   ├── lib/                # API client, types, utils
    │   └── hooks/              # useAuth hook
    └── public/
        ├── manifest.json       # PWA manifest
        ├── sw.js               # Service worker
        └── icons/              # App icons
```

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (or use Railway)

### Backend Setup

```bash
cd server
cp .env.example .env
# Fill in your DATABASE_URL, JWT_SECRET, etc.
npm install
npm run dev
```

### Run Database Migrations

```bash
# Using psql directly
psql $DATABASE_URL -f migrations/001_init.sql

# Or on Railway, run via the Railway CLI:
railway run psql $DATABASE_URL -f migrations/001_init.sql
```

### Frontend Setup

```bash
cd client
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

### Backend (`server/.env`)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/splitright
JWT_SECRET=your-super-secret-key-min-32-chars-long
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Deployment

### 1. Deploy Backend to Railway

1. Create a [Railway](https://railway.app) account
2. New Project → **Add PostgreSQL** → copy the `DATABASE_URL`
3. New Service → **Deploy from GitHub repo** → select `/server` as root
4. Add environment variables:
   ```
   DATABASE_URL=<from Railway PostgreSQL>
   JWT_SECRET=<generate with: openssl rand -hex 32>
   PORT=3001
   FRONTEND_URL=https://your-vercel-app.vercel.app
   NODE_ENV=production
   ```
5. Run migrations via Railway shell or psql:
   ```bash
   psql $DATABASE_URL -f migrations/001_init.sql
   ```
6. Note the Railway service URL (e.g. `https://splitright-api.railway.app`)

### 2. Deploy Frontend to Vercel

1. Push code to GitHub
2. Import repo on [Vercel](https://vercel.com)
3. Set **Root Directory** to `client`
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-backend.railway.app
   ```
5. Deploy → Vercel will auto-build and deploy

### 3. Test PWA on iPhone

1. Open the Vercel URL in Safari on iPhone
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. The app opens full-screen with no browser chrome

## API Reference

```
GET    /health
POST   /auth/register          { name, email, password }
POST   /auth/login             { email, password }
POST   /auth/logout
GET    /auth/me

GET    /groups
POST   /groups                 { name }
POST   /groups/join            { invite_code }
GET    /groups/:id
DELETE /groups/:id/leave

GET    /groups/:id/expenses
POST   /groups/:id/expenses    { title, amount, paid_by, split_type, splits? }
GET    /groups/:id/expenses/:eid
DELETE /groups/:id/expenses/:eid

GET    /groups/:id/balances
POST   /groups/:id/settlements { from_user_id, to_user_id, amount, note? }
GET    /groups/:id/settlements
```

All endpoints return: `{ success: boolean, data?: T, error?: string }`

## Color System — Slate & Sage

| Token | Hex | Usage |
|-------|-----|-------|
| `slate-base` | `#0d1117` | Deepest background |
| `slate-surface` | `#161b22` | Cards, bottom nav |
| `slate-elevated` | `#1f2937` | Modals, inputs |
| `slate-border` | `#2d3748` | Dividers |
| `sage` | `#6b9e78` | Primary buttons, active nav |
| `sage-soft` | `#4a7c59` | Pressed states |
| `sage-subtle` | `#1e3a2a` | Badge backgrounds |
| `positive` | `#5a9e7a` | Amounts owed to you |
| `negative` | `#c17b6b` | Amounts you owe |
| `neutral-muted` | `#64748b` | Settled, disabled |
| `warning` | `#c4a35a` | Offline banner, pending |
