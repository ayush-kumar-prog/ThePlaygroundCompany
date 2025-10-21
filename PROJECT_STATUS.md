# Playground Sim - Project Status & Context

> **Last Updated**: Environment configuration phase complete. Ready for business logic implementation.

## 📖 Project Overview

**Playground Sim** simulates how Twitter/X audiences will react to an idea before launch. Users paste their idea, select an audience (Tech Twitter, Crypto Twitter, etc.), and get 10-100 AI-generated realistic tweet responses.

### Core Features
- User pastes idea or link
- Select target audience
- Choose tweet count (10-100)
- AI generates realistic reactions with personality diversity
- 2-pass generation: initial tweets + threaded reply conversations
- Analyze sentiment: top 6 praises + top 6 worries
- Download PDF summary
- Email PDF to anyone
- Edit idea and rerun simulation

### Monetization Path
- Freemium: 3 simulations/month free
- Pro ($19/mo): Unlimited, 100 tweets, all audiences
- One-time packages: Deep dive analysis, multi-audience comparison

---

## 🏗️ Architecture

### Tech Stack
```
Frontend:  Vite + React + TypeScript + shadcn/ui + TailwindCSS + React Router
Auth:      Clerk (JWT-based)
Database:  Supabase (PostgreSQL with Row Level Security)
API:       Vercel Serverless Functions
LLM:       OpenAI GPT-4 (2-pass generation)
Email:     Resend
PDF:       jsPDF (client-side generation)
Hosting:   Vercel
Domain:    playgroundsim.xyz (active)
```

### System Flow
```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Vite + React)                                    │
│                                                              │
│  Landing (/) → Clerk Auth → Dashboard (/dashboard)          │
│                                  ↓                           │
│                    Create Simulation Dialog                  │
│                    (idea + audience + count)                 │
│                                  ↓                           │
│                    POST /api/simulations/create             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  API LAYER (Vercel Serverless)                              │
│                                                              │
│  1. Verify Clerk JWT → Extract user_id                      │
│  2. Ensure user exists in Supabase                          │
│  3. Create simulation record (status: "generating")         │
│  4. Call POST /api/llm/generate-tweets (async)              │
│  5. Return simulation_id                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  LLM GENERATION (OpenAI GPT-4)                              │
│                                                              │
│  Pass 1: Generate 70-80 initial tweet reactions             │
│          - Mix of supporters, skeptics, confused users      │
│          - Varied lengths: short, medium, detailed          │
│          - Different personalities & archetypes             │
│                                                              │
│  Pass 2: Generate 20-30 threaded replies                    │
│          - Select 5-8 controversial tweets                  │
│          - Generate 2-3 replies per thread                  │
│          - Authentic Twitter back-and-forth                 │
│                                                              │
│  Classify sentiment: "praise" | "neutral" | "worry"         │
│  Save to Supabase → Update status: "completed"              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  RESULTS (/simulation/:id)                                  │
│                                                              │
│  - Frontend polls GET /api/simulations/:id every 2s         │
│  - When status = "completed", display tweets                │
│  - Twitter-style cards with sentiment indicators            │
│  - Edit & Rerun button                                      │
│  - Download PDF (client-side jsPDF)                         │
│  - Email PDF (POST /api/pdf/email)                          │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema (Supabase)
```sql
users
├── id (UUID)
├── clerk_id (TEXT) ← Synced from Clerk
├── email (TEXT)
├── simulation_count (INT)
└── created_at (TIMESTAMP)

simulations
├── id (UUID)
├── user_id (FK → users.id)
├── idea_text (TEXT)
├── audience (TEXT) ← "Tech Twitter", "Crypto Twitter", etc.
├── tweet_count (INT) ← 10-100
├── status (TEXT) ← "generating" | "completed" | "failed"
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

generated_tweets
├── id (UUID)
├── simulation_id (FK → simulations.id)
├── author_name (TEXT) ← "@fake_username"
├── tweet_text (TEXT)
├── sentiment (TEXT) ← "praise" | "neutral" | "worry"
├── is_reply (BOOLEAN)
├── reply_to_id (FK → generated_tweets.id)
├── order_index (INT) ← For sorting
└── created_at (TIMESTAMP)
```

**Key Features:**
- Row Level Security (RLS) enforced - users only see their own data
- Clerk JWT integration via `auth.jwt() ->> 'sub'`
- Indexes on user_id, status, sentiment, simulation_id
- Cascade delete: deleting simulation deletes tweets

---

## ✅ Current Status: Configuration Phase COMPLETE

### What's Been Built & Configured

#### 1. ✅ Environment Variables
**File:** `.env.local` (created, gitignored)

All API keys configured:
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_bWlnaHR5LXBhbmRhLTYuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_r78ZnyU8BwSGvWHT8t7VEZCinLJZihxHSN64XCZb7t
VITE_SUPABASE_URL=https://txyerrwezxrtpqnllpxa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (anon public key)
SUPABASE_SERVICE_KEY=eyJhbGc... (service_role key)
OPENAI_API_KEY=sk-proj-gfAsvGXQ...
RESEND_API_KEY=re_hnKkQwnM...
```

**Action Required:** Import these to Vercel environment variables.

#### 2. ✅ Packages Installed
```json
{
  "@clerk/clerk-react": "latest",      // Authentication
  "@supabase/supabase-js": "latest",   // Database client
  "openai": "latest",                  // LLM API
  "resend": "latest",                  // Email service
  "jspdf": "latest",                   // PDF generation
  "@vercel/node": "latest"             // Serverless types
}
```

#### 3. ✅ Authentication (Clerk)
**Configured in:** `src/main.tsx`, `src/pages/Index.tsx`

- ClerkProvider wraps entire app
- Landing page: Sign In / Sign Up buttons with modal
- Auto-redirect to `/dashboard` after authentication
- Dashboard: UserButton for account management
- Uses `fallbackRedirectUrl` prop for routing

#### 4. ✅ Database (Supabase)
**Configured in:** `src/lib/supabase.ts`, `supabase-schema.sql`

- Supabase client initialized with env vars
- TypeScript types defined for all tables
- Complete SQL schema ready to run
- RLS policies configured for security

**Action Required:** Run `supabase-schema.sql` in Supabase SQL Editor.

#### 5. ✅ Frontend Pages (UI Complete, Logic Pending)

**Landing Page** (`src/pages/Index.tsx`)
- Beautiful animated design with floating tweet backgrounds
- Clerk Sign In / Sign Up buttons
- Auto-redirects to dashboard if already signed in
- Status: ✅ Complete

**Dashboard** (`src/pages/Dashboard.tsx`)
- Header with user profile (UserButton)
- "Create New Simulation" button (opens dialog)
- Create simulation dialog with:
  - Textarea for idea (supports links for future scraping)
  - Dropdown: Tech Twitter, Crypto Twitter, VC Twitter, Designer Twitter, Indie Hackers
  - Slider: 10-100 tweets (default: 30)
- Previous simulations grid (shows mock data, needs API)
- Status: ✅ UI complete, ⏸️ Needs API connection

**Simulation View** (`src/pages/Simulation.tsx`)
- Displays idea text
- "Edit & Rerun" button with textarea
- Tweet cards grid (currently shows mock data)
- "Download Summary" button
- Loading state with animation
- Status: ✅ UI complete, ⏸️ Needs API connection

#### 6. ✅ API Structure (Stubs Created)

All Vercel serverless functions created as stubs:

```
/api
├── simulations/
│   ├── create.ts       → POST   Create simulation + trigger LLM
│   ├── [id].ts         → GET    Fetch simulation + tweets
│   ├── list.ts         → GET    List user's simulations
│   └── rerun.ts        → POST   Edit idea + regenerate
├── llm/
│   └── generate-tweets.ts → POST   Core LLM generation logic
└── pdf/
    └── email.ts        → POST   Generate + email PDF
```

**Status:** ⏸️ All are placeholder implementations with TODO comments.

#### 7. ✅ Configuration Files
- `src/lib/clerk.ts` - Clerk publishable key validation
- `src/lib/supabase.ts` - Supabase client + TypeScript types
- `src/lib/api.ts` - API client functions (stubs)
- `supabase-schema.sql` - Complete database schema with RLS
- `.env.local` - All API keys (gitignored)
- `.env.example` - Template for team sharing

#### 8. ✅ Routing
```
/                     → Landing page (public)
/dashboard            → User dashboard (protected)
/simulation/:id       → Simulation results (protected)
```

**Note:** Protected routes don't have auth guards yet (need to implement).

---

## ⚠️ What YOU Must Do Before Development (20 minutes)

### Step 1: Vercel Environment Variables (5 min)
1. Go to https://vercel.com → Your project
2. Settings → Environment Variables
3. Add all variables from `.env.local`
4. Select: Production, Preview, Development for each

### Step 2: Run Supabase Schema (3 min)
1. Go to https://supabase.com/dashboard → Your project
2. SQL Editor → New Query
3. Copy entire `supabase-schema.sql` contents
4. Paste and Run
5. Verify: Table Editor should show 3 tables

### Step 3: Clerk + Supabase JWT Integration (5 min)
**In Clerk:**
1. Dashboard → Integrations → Supabase
2. Configure → Enter `https://txyerrwezxrtpqnllpxa.supabase.co`
3. Generate JWT Template → Copy it

**In Supabase:**
1. Authentication → Settings → JWT Settings
2. Paste Clerk JWT template into JWT Secret
3. Save

This allows Supabase RLS policies to recognize Clerk user IDs.

### Step 4: Clerk Redirect URLs (2 min)
**In Clerk Dashboard → Paths:**
- After sign-in URL: `/dashboard`
- After sign-up URL: `/dashboard`
- After sign-out URL: `/`

**Allowed redirect URLs:**
- `http://localhost:8080/dashboard`
- `https://the-playground-company.vercel.app/dashboard`
- `https://playgroundsim.xyz/dashboard`

### Step 5: Test Locally (3 min)
```bash
npm run dev
```
- Visit http://localhost:8080
- Click "New Simulation" → Sign up
- Should redirect to `/dashboard`
- Dashboard loads correctly

### Step 6: Deploy (2 min)
```bash
git add .
git commit -m "Environment configuration complete"
git push
```

---

## 🚧 What Needs to Be Built (Implementation Phase)

### Current Bottleneck: API Endpoints Are Stubs

**The entire frontend is ready.** The database is ready. The auth is ready.

**What's missing:** Business logic in API endpoints.

### Critical Path (Priority Order)

#### Priority 1: LLM Tweet Generation ⭐ MOST IMPORTANT
**File:** `api/llm/generate-tweets.ts`

**Why first:** This is the core value proposition. Everything else depends on this.

**What to implement:**
1. Initialize OpenAI client with API key
2. Build prompt template:
   ```typescript
   const systemPrompt = `You are simulating realistic Twitter reactions to an idea.
   
   Rules:
   - Generate exactly ${tweetCount} unique responses
   - Audience: ${audience} (tech-savvy, opinionated, diverse)
   - Mix lengths: short (1-10 words), medium (1-2 sentences), detailed (3-4)
   - Mix sentiments: supporters, critics, confused, skeptics, haters
   - Be realistic: typos, casual language, occasional emojis
   - Some users didn't read carefully and misunderstood
   - Include specific technical questions
   
   Return JSON array:
   [
     {
       "author": "@username",
       "text": "tweet content",
       "sentiment": "praise" | "neutral" | "worry"
     }
   ]`;
   ```

3. **Pass 1:** Generate 70-80% of tweets (initial reactions)
4. **Pass 2:** Select 5-8 controversial tweets, generate 2-3 replies each
5. Parse LLM response → validate JSON
6. Classify sentiment (if LLM doesn't do it well, add keyword matching)
7. Batch insert to `generated_tweets` table
8. Update simulation status to "completed"

**Time estimate:** 4-6 hours

---

#### Priority 2: Create Simulation Endpoint
**File:** `api/simulations/create.ts`

**What to implement:**
1. Install `@clerk/backend` package
2. Verify Clerk JWT: `await clerkClient.verifyToken(req.headers.authorization)`
3. Extract user ID from JWT: `verifiedToken.sub`
4. Check if user exists in Supabase `users` table
5. If not, create user record with clerk_id and email
6. Insert simulation record with status "generating"
7. Call `generate-tweets.ts` asynchronously (fire and forget)
8. Return `{ simulationId, status: "generating" }`

**Time estimate:** 2-3 hours

---

#### Priority 3: Get Simulation Endpoint
**File:** `api/simulations/[id].ts`

**What to implement:**
1. Verify JWT, extract user ID
2. Fetch simulation from Supabase by ID
3. Verify simulation.user_id matches requesting user
4. Fetch all tweets for this simulation (ordered by order_index)
5. Return `{ simulation, tweets }`

**Time estimate:** 1-2 hours

---

#### Priority 4: Connect Dashboard to API
**File:** `src/pages/Dashboard.tsx`

**What to implement:**
1. Create React Query hook:
   ```typescript
   const { data: simulations } = useQuery({
     queryKey: ['simulations'],
     queryFn: async () => {
       const response = await fetch('/api/simulations/list');
       return response.json();
     }
   });
   ```

2. Replace mock data with real simulations
3. Connect "Create Simulation" form to `POST /api/simulations/create`
4. Show loading state while creating
5. Navigate to `/simulation/:id` after creation
6. Handle errors with toast notifications

**Time estimate:** 2-3 hours

---

#### Priority 5: Connect Simulation Page to API
**File:** `src/pages/Simulation.tsx`

**What to implement:**
1. Get simulation ID from URL: `const { id } = useParams()`
2. Fetch simulation data with polling:
   ```typescript
   const { data } = useQuery({
     queryKey: ['simulation', id],
     queryFn: () => fetch(`/api/simulations/${id}`).then(r => r.json()),
     refetchInterval: (data) => {
       return data?.simulation.status === 'generating' ? 2000 : false;
     }
   });
   ```

3. Show loading state while status = "generating"
4. Display tweets when completed
5. Implement edit & rerun (calls `/api/simulations/rerun`)

**Time estimate:** 3-4 hours

---

#### Priority 6: List Simulations Endpoint
**File:** `api/simulations/list.ts`

**What to implement:**
1. Verify JWT, extract user ID
2. Query Supabase for user's simulations
3. Order by created_at DESC
4. Return array of simulations

**Time estimate:** 1 hour

---

#### Priority 7: Rerun Simulation Endpoint
**File:** `api/simulations/rerun.ts`

**What to implement:**
1. Verify JWT and ownership
2. Update simulation.idea_text with new text
3. Delete old tweets from `generated_tweets` table
4. Update status to "generating"
5. Call `generate-tweets.ts` asynchronously
6. Return updated simulation

**Time estimate:** 2 hours

---

#### Priority 8: PDF Generation
**File:** Client-side in `src/pages/Simulation.tsx`

**What to implement:**
1. Analyze tweets by sentiment
2. Extract top 6 praises (sentiment = "praise", highest quality)
3. Extract top 6 worries (sentiment = "worry", most relevant)
4. Calculate sentiment breakdown (% positive/neutral/negative)
5. Use jsPDF to create PDF:
   - Title: "Simulation Results"
   - Idea text
   - "Top 6 Praises" section (green)
   - "Top 6 Worries" section (yellow/orange)
   - Sentiment breakdown chart
6. Trigger download

**Time estimate:** 3-4 hours

---

#### Priority 9: Email PDF Endpoint
**File:** `api/pdf/email.ts`

**What to implement:**
1. Verify JWT and ownership
2. Fetch simulation + tweets
3. Analyze for top praises/worries (reuse client logic)
4. Generate PDF (server-side with jsPDF or Puppeteer)
5. Send via Resend:
   ```typescript
   await resend.emails.send({
     from: 'Playground Sim <noreply@playgroundsim.xyz>',
     to: emailTo,
     subject: 'Your Simulation Results',
     html: `<p>Your simulation results are attached.</p>`,
     attachments: [{ filename: 'results.pdf', content: pdfBuffer }]
   });
   ```

**Time estimate:** 2-3 hours

---

#### Priority 10: Polish
- Add protected route wrapper
- Better error handling everywhere
- Loading states with fun cycling messages
- Tweet card component with Twitter styling
- Tweet threading display
- Sentiment color indicators
- Mobile responsive adjustments

**Time estimate:** 6-8 hours

---

## 📊 Time Estimates

### Configuration Phase (COMPLETE)
- ✅ Environment setup: Done
- ⏳ Your setup actions: 20 minutes

### Development Phase (TO DO)
- Core API implementation: 10-14 hours
- Frontend connection: 8-12 hours
- PDF & Email: 6-8 hours
- Polish & features: 6-8 hours

**Total Development Time: 30-42 hours** (~1 week full-time or ~2 weeks part-time)

---

## 🎯 Definition of Done

**MVP Complete When:**
- [ ] User can sign up with Clerk
- [ ] User can create simulation from dashboard
- [ ] LLM generates 10-100 realistic tweets
- [ ] Tweets display in Twitter-style cards
- [ ] User can edit idea and rerun
- [ ] User can download PDF summary
- [ ] User can email PDF to anyone
- [ ] Previous simulations load on dashboard
- [ ] Everything works on production (playgroundsim.xyz)

**Launch Ready When:**
- [ ] All above +
- [ ] Error handling is robust
- [ ] Loading states are smooth
- [ ] Mobile responsive
- [ ] Tweet threading works
- [ ] Performance is good (< 15 sec generation)

---

## 🔑 Key Implementation Details

### LLM Prompt Engineering (Critical)

**Good prompt structure:**
```typescript
const systemPrompt = `Generate ${tweetCount} realistic Twitter reactions to an idea.

AUDIENCE: ${audience}
- Tech-savvy, opinionated, diverse perspectives
- Mix of ages, experience levels, personality types

PERSONALITIES TO INCLUDE:
- Hype person (ALL CAPS, lots of emojis): 15%
- Skeptic (asks hard questions): 20%
- Technical deep-diver (specific concerns): 20%
- Encourager (vague positivity): 15%
- Confused person (misread the idea): 10%
- Hater (contrarian for no reason): 10%
- Thoughtful critic (constructive): 10%

LENGTH DISTRIBUTION:
- Short (1-10 words): 30%
- Medium (1-2 sentences): 50%
- Detailed (3-4 sentences): 20%

AUTHENTICITY RULES:
- Include occasional typos
- Use casual language
- Some tweets ignore key details
- Include specific technical questions
- Add emojis sparingly (not every tweet)
- Vary writing styles

OUTPUT FORMAT:
JSON array with: author (string), text (string), sentiment ("praise"|"neutral"|"worry")`;

const userPrompt = `Simulate Twitter reactions to:\n\n"${ideaText}"\n\nGenerate ${tweetCount} tweets.`;
```

### Clerk JWT Verification (Server-side)

```typescript
import { clerkClient } from '@clerk/backend';

const token = req.headers.authorization?.replace('Bearer ', '');
const verifiedToken = await clerkClient.verifyToken(token);
const clerkUserId = verifiedToken.sub;

// Now check if user exists in Supabase
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('clerk_id', clerkUserId)
  .single();

if (!user) {
  // Create user
  await supabase.from('users').insert({
    clerk_id: clerkUserId,
    email: verifiedToken.email
  });
}
```

### React Query Polling Pattern

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['simulation', simulationId],
  queryFn: async () => {
    const res = await fetch(`/api/simulations/${simulationId}`);
    return res.json();
  },
  refetchInterval: (data) => {
    // Poll every 2 seconds while generating
    return data?.simulation.status === 'generating' ? 2000 : false;
  }
});
```

---

## 📂 Project Structure

```
/ThePlaygroundCompany
├── src/
│   ├── lib/
│   │   ├── clerk.ts          ✅ Clerk config
│   │   ├── supabase.ts       ✅ DB client + types
│   │   └── api.ts            ✅ API client functions (stubs)
│   ├── pages/
│   │   ├── Index.tsx         ✅ Landing + Clerk auth
│   │   ├── Dashboard.tsx     ✅ UI complete, needs API
│   │   └── Simulation.tsx    ✅ UI complete, needs API
│   ├── components/
│   │   ├── ui/               ✅ shadcn components
│   │   └── [TO CREATE]
│   │       ├── TweetCard.tsx       ⏸️ Twitter-style tweet display
│   │       ├── LoadingState.tsx    ⏸️ Fun loading messages
│   │       └── ProtectedRoute.tsx  ⏸️ Auth guard
│   └── main.tsx              ✅ ClerkProvider setup
├── api/
│   ├── simulations/
│   │   ├── create.ts         ⏸️ Needs implementation
│   │   ├── [id].ts           ⏸️ Needs implementation
│   │   ├── list.ts           ⏸️ Needs implementation
│   │   └── rerun.ts          ⏸️ Needs implementation
│   ├── llm/
│   │   └── generate-tweets.ts ⏸️ CRITICAL - implement first
│   └── pdf/
│       └── email.ts          ⏸️ Needs implementation
├── .env.local                ✅ All API keys configured
├── .env.example              ✅ Template
├── supabase-schema.sql       ⚠️ Created, needs to be run
└── package.json              ✅ All dependencies installed
```

**Legend:**
- ✅ Complete and working
- ⏸️ Stub or needs implementation
- ⚠️ Created but needs action

---

## 🆘 Troubleshooting Common Issues

**Clerk auth not working:**
- Check `VITE_CLERK_PUBLISHABLE_KEY` starts with `VITE_`
- Verify ClerkProvider wraps app in main.tsx
- Check redirect URLs in Clerk dashboard

**Supabase queries failing:**
- Verify RLS policies are correct (run supabase-schema.sql)
- Check Clerk JWT integration is configured
- Use service_role key for server-side operations
- Check Supabase logs in dashboard

**API endpoints 404:**
- Vercel functions must be in `/api` folder at root
- Check Vercel deployment logs
- Verify environment variables are set in Vercel

**TypeScript errors:**
- Restart dev server after env changes
- Check imports are correct
- Verify types in `src/lib/supabase.ts`

**LLM generation slow:**
- Reduce tweet count for testing
- Use GPT-4o-mini for faster/cheaper testing
- Check OpenAI API limits

---

## 🎉 Summary

**Configuration: COMPLETE** ✅
**Setup Actions: 20 minutes remaining** ⏱️
**Development: Ready to start** 🚀

**Next immediate action:**
1. Complete the 6 setup steps (20 min)
2. Start implementing `api/llm/generate-tweets.ts` (the core)
3. Then `api/simulations/create.ts`
4. Connect Dashboard
5. Connect Simulation page
6. Add PDF & email
7. Polish

The foundation is rock-solid. All the plumbing is done. Now build the product! 💪

