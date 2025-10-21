# Phase 1 Testing Guide

## ✅ What's Been Implemented

All core API endpoints for Phase 1:
- ✅ `api/llm/generate-tweets.ts` - OpenAI 2-pass generation with realistic tweets
- ✅ `api/simulations/create.ts` - Create simulation with Clerk JWT verification
- ✅ `api/simulations/[id].ts` - Fetch simulation and tweets with auth

## 🚦 Before Testing: Required Setup (5 minutes)

### Step 1: Run Supabase Schema (CRITICAL)

**Go to:** https://supabase.com/dashboard → Your project → SQL Editor

**Run this query:**
```sql
-- Copy and paste the entire contents of supabase-schema.sql
-- It should create 3 tables: users, simulations, generated_tweets
-- Plus indexes, RLS policies, and triggers
```

**Verify:** Go to Table Editor → You should see 3 new tables

### Step 2: Verify Environment Variables

Make sure `.env.local` has all these:
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_SUPABASE_URL=https://txyerrwezxrtpqnllpxa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-proj-...
RESEND_API_KEY=re_...
```

### Step 3: Start Dev Server

```bash
npm run dev
```

Should start on http://localhost:8080

---

## 🧪 Testing Strategy

### Option A: Frontend Testing (Easiest - End to End)

**This is the recommended approach for quick validation.**

1. **Sign Up:**
   - Go to http://localhost:8080
   - Click "Get Started" or "New Simulation"
   - Sign up with a test email
   - Should redirect to /dashboard

2. **Create Simulation:**
   - Click "Create New Simulation"
   - Enter idea: "An AI assistant that helps with email replies"
   - Select audience: "Tech Twitter"
   - Set tweet count: 20 (start small for faster testing)
   - Click "Simulate"

3. **Watch It Work:**
   - Should navigate to `/simulation/:id`
   - Should show "Generating..." state
   - Wait 10-15 seconds
   - Check browser console for errors
   - Check Network tab for API calls

4. **Check Results:**
   - Tweets should appear after generation completes
   - Should see ~20 tweets with different authors
   - Mix of sentiments (praise/neutral/worry)
   - Varied lengths and styles

5. **Verify Database:**
   - Go to Supabase Dashboard → Table Editor
   - Check `simulations` table → Should have 1 row with status "completed"
   - Check `generated_tweets` table → Should have ~20 rows
   - Check `users` table → Should have your test user

**If this works, Phase 1 is complete! 🎉**

---

### Option B: API Testing with cURL (For Debugging)

**Use this if frontend isn't ready or you want to test APIs directly.**

#### Test 1: Get Clerk Token

First, you need a valid Clerk token. Two options:

**Option 1 - From Browser:**
1. Sign up at http://localhost:8080
2. Open browser DevTools → Application/Storage → Clerk
3. Copy the session token

**Option 2 - Temporary bypass for testing:**
Temporarily comment out JWT verification in `create.ts` (lines 35-55) and use a placeholder:
```typescript
// FOR TESTING ONLY - REMOVE BEFORE PRODUCTION
const clerkUserId = 'test-user-123';
const userEmail = 'test@example.com';
```

#### Test 2: Create Simulation

```bash
# Replace YOUR_TOKEN with actual Clerk token (or bypass as above)
curl -X POST http://localhost:8080/api/simulations/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "ideaText": "A social network for dogs",
    "audience": "Tech Twitter",
    "tweetCount": 20
  }'
```

**Expected Response:**
```json
{
  "simulationId": "some-uuid-here",
  "status": "generating",
  "message": "Simulation created successfully"
}
```

**What happens:**
- User created in `users` table (if doesn't exist)
- Simulation created in `simulations` table with status "generating"
- LLM generation triggered asynchronously
- Returns immediately (doesn't wait for tweets)

#### Test 3: Check Generation Progress

```bash
# Use the simulationId from previous response
curl http://localhost:8080/api/simulations/YOUR_SIMULATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**While Generating:**
```json
{
  "simulation": {
    "id": "...",
    "ideaText": "A social network for dogs",
    "status": "generating",
    "tweetCount": 20
  },
  "tweets": []
}
```

**After Complete (~15 seconds):**
```json
{
  "simulation": {
    "id": "...",
    "status": "completed",
    "tweetCount": 20
  },
  "tweets": [
    {
      "id": "...",
      "author": "@tech_guru",
      "text": "Finally! Been waiting for something like this 🐕",
      "sentiment": "praise",
      "isReply": false
    },
    // ... 19 more tweets
  ]
}
```

#### Test 4: Verify OpenAI Was Called

Check terminal logs where dev server is running:
```
[simulation-id] Starting tweet generation for 20 tweets
[simulation-id] Generated 14 initial tweets
[simulation-id] Generated 6 reply tweets
[simulation-id] ✅ Completed successfully with 20 tweets
```

---

## 📊 Success Criteria

Phase 1 is complete when:

- ✅ User can create simulation (API returns simulationId)
- ✅ LLM generation completes without errors
- ✅ Tweets save to database (check Supabase)
- ✅ Tweets are realistic and diverse (not generic)
- ✅ Status updates from "generating" → "completed"
- ✅ Can fetch simulation and see tweets via API
- ✅ JWT authentication works (user can only see their own simulations)

---

## 🐛 Common Issues & Fixes

### Issue: "Invalid or expired token"
**Cause:** JWT verification failing
**Fix:** 
- Make sure CLERK_SECRET_KEY is in .env.local
- Try signing out and back in to get fresh token
- For testing, temporarily bypass JWT (see Option 2 in Test 1)

### Issue: "User not found" or "Simulation not found"
**Cause:** Supabase schema not set up or RLS policies blocking
**Fix:**
- Run supabase-schema.sql completely
- Check Supabase logs for errors
- Verify tables exist in Table Editor

### Issue: "Failed to generate tweets" or OpenAI errors
**Cause:** OpenAI API key issue
**Fix:**
- Verify OPENAI_API_KEY in .env.local
- Check OpenAI dashboard for API usage/limits
- Make sure you have credits/billing set up

### Issue: Generation takes too long (>30 seconds)
**Cause:** High tweet count or slow OpenAI response
**Fix:**
- Start with lower tweet counts (10-20) for testing
- Consider using gpt-4o-mini for faster testing
- Check your internet connection

### Issue: Tweets are generic or repetitive
**Cause:** Prompt engineering needs adjustment
**Fix:**
- This is expected on first runs
- Try different audiences
- We can tune the prompt in generate-tweets.ts later

### Issue: "ECONNREFUSED" when triggering LLM
**Cause:** Dev server URL issue
**Fix:**
- In create.ts, make sure VERCEL_URL fallback is correct
- Should be http://localhost:8080 for local dev

---

## 🎯 Quick Validation Checklist

Run through this in 5 minutes:

1. ☐ Dev server running (`npm run dev`)
2. ☐ Supabase schema executed
3. ☐ Can sign up at http://localhost:8080
4. ☐ Can create simulation from dashboard
5. ☐ See "generating" state
6. ☐ Tweets appear after ~15 seconds
7. ☐ Check Supabase → tables populated
8. ☐ No errors in browser console
9. ☐ No errors in terminal logs

**If all ☑️ → Phase 1 complete! Ready for Phase 2.**

---

## 📝 Sample Test Ideas

Try these ideas to test variety:

1. "An AI assistant that helps write code faster"
2. "A dating app but for finding hiking buddies"
3. "NFT project for endangered species conservation"
4. "Web3 social network with built-in crypto wallet"
5. "SaaS tool for managing remote team standups"

Try different audiences:
- Tech Twitter
- Crypto Twitter
- Designer Twitter
- VC Twitter
- Indie Hackers

Try different tweet counts:
- 10 (fast testing)
- 30 (balanced)
- 50 (realistic usage)
- 100 (stress test)

---

## 🔍 Debugging with Supabase

**Check Simulation Status:**
```sql
SELECT id, status, tweet_count, created_at 
FROM simulations 
ORDER BY created_at DESC 
LIMIT 5;
```

**Check Tweet Count:**
```sql
SELECT simulation_id, COUNT(*) as tweet_count
FROM generated_tweets
GROUP BY simulation_id;
```

**Check Sentiment Distribution:**
```sql
SELECT sentiment, COUNT(*) as count
FROM generated_tweets
WHERE simulation_id = 'YOUR-SIMULATION-ID'
GROUP BY sentiment;
```

**Find Failed Simulations:**
```sql
SELECT id, idea_text, status, created_at
FROM simulations
WHERE status = 'failed'
ORDER BY created_at DESC;
```

---

## ⏭️ Next Steps (Phase 2)

Once Phase 1 is validated:
1. Connect frontend Dashboard to API with React Query
2. Connect frontend Simulation page with polling
3. Replace mock data with real API calls
4. Add loading states and error handling

See PROJECT_STATUS.md for Phase 2 details.

---

**Need help?** Check terminal logs, browser console, and Supabase logs for detailed error messages.

