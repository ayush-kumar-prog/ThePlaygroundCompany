# LLM Prompt Template - Playground Sim Development

> Use this prompt when asking an LLM for help. Attach PROJECT_STATUS.md and IMPLEMENTATION_GUIDE.md as context files.

---

## 🤖 Copy-Paste This Prompt:

```
I'm building Playground Sim - a web app that simulates how Twitter/X audiences will react to ideas before launch. Users paste their idea, select an audience (Tech Twitter, Crypto Twitter, etc.), choose tweet count (10-100), and get AI-generated realistic reactions with sentiment analysis.

I have attached two context files:
1. PROJECT_STATUS.md - Complete project overview, architecture, current status, and what needs to be built
2. IMPLEMENTATION_GUIDE.md - Code examples and implementation patterns

## CURRENT STATUS:

✅ COMPLETED:
- All environment variables configured (.env.local created with Clerk, Supabase, OpenAI, Resend API keys)
- All packages installed (@clerk/clerk-react, @supabase/supabase-js, openai, resend, jspdf)
- Clerk authentication fully integrated (ClerkProvider, Sign In/Up buttons, auto-redirect)
- Supabase client configured with TypeScript types
- Database schema created (users, simulations, generated_tweets tables with RLS policies)
- Frontend pages built: Landing (with auth), Dashboard (with create dialog), Simulation (results view)
- API endpoint structure created (all files exist as stubs in /api folder)
- Routing configured: / → /dashboard → /simulation/:id

⚠️ PENDING (What I need to build):
- API endpoint implementations (currently all stubs with TODO comments)
- LLM tweet generation logic (2-pass: initial tweets + threaded replies)
- React Query hooks to connect frontend to API
- PDF generation with top 6 praises/worries
- Email PDF functionality via Resend
- Protected route wrapper for auth guards
- Error handling and loading states

🎯 TECH STACK:
- Frontend: Vite + React + TypeScript + shadcn/ui + TailwindCSS
- Auth: Clerk (JWT-based)
- Database: Supabase (PostgreSQL with Row Level Security)
- API: Vercel Serverless Functions
- LLM: OpenAI GPT-4 (need to implement 2-pass generation)
- Email: Resend
- PDF: jsPDF (client-side)
- Hosting: Vercel
- Domain: playgroundsim.xyz

## PROJECT STRUCTURE:

Frontend (UI complete, needs API connection):
- src/pages/Index.tsx ✅ Landing page with Clerk auth
- src/pages/Dashboard.tsx ✅ UI complete, needs React Query hooks
- src/pages/Simulation.tsx ✅ UI complete, needs polling logic

API (All stubs, need implementation):
- api/llm/generate-tweets.ts ⏸️ PRIORITY 1 - Core LLM logic
- api/simulations/create.ts ⏸️ PRIORITY 2 - Create simulation + trigger LLM
- api/simulations/[id].ts ⏸️ PRIORITY 3 - Fetch simulation + tweets
- api/simulations/list.ts ⏸️ List user's simulations
- api/simulations/rerun.ts ⏸️ Edit & regenerate
- api/pdf/email.ts ⏸️ Generate + email PDF

Database:
- Schema created ✅ (need to run in Supabase SQL Editor)
- Tables: users, simulations, generated_tweets
- RLS policies configured for Clerk JWT integration

## WHAT I NEED HELP WITH:

[REPLACE THIS SECTION WITH YOUR SPECIFIC QUESTION]

Example questions:
- "Walk me through implementing api/llm/generate-tweets.ts step-by-step"
- "How do I connect the Dashboard to the create simulation API?"
- "What's the best way to handle polling for simulation status updates?"
- "Show me how to implement the PDF generation with top 6 praises/worries"
- "Help me set up protected routes with Clerk"
- "Review my implementation of [specific file] and suggest improvements"

## CRITICAL CONTEXT:

1. **LLM Generation Strategy (2-pass):**
   - Pass 1: Generate 70-80 initial tweet reactions (diverse personalities, sentiments, lengths)
   - Pass 2: Select 5-8 controversial tweets, generate 2-3 threaded replies each
   - Total: 10-100 tweets depending on user's slider choice
   - Must feel authentic: mix of lengths, personalities, typos, varied emoji usage
   - Sentiment classification: "praise" | "neutral" | "worry"

2. **Data Flow:**
   User clicks "Simulate" → POST /api/simulations/create → Creates DB record (status: "generating") → 
   Triggers /api/llm/generate-tweets (async) → OpenAI generates tweets → Saves to DB → 
   Updates status to "completed" → Frontend polls GET /api/simulations/:id → Displays results

3. **Authentication:**
   - Clerk JWT must be verified in all API endpoints
   - Extract user ID from JWT: verifiedToken.sub
   - Ensure user exists in Supabase (create if not)
   - Supabase RLS policies use auth.jwt() ->> 'sub' to match Clerk user ID

4. **Key Requirements:**
   - Simulation should complete in ~10-15 seconds
   - Frontend polls every 2 seconds while status = "generating"
   - PDF includes: idea text, top 6 praises, top 6 worries, sentiment breakdown
   - Email should send PDF as attachment via Resend
   - All user data protected by Row Level Security

## MY DEVELOPMENT ENVIRONMENT:

- Project path: /Users/kumar/Documents/Projects/ThePlaygroundCompany
- Dev server: `npm run dev` (runs on localhost:8080)
- Deployment: Vercel (auto-deploys from git push)
- Environment variables: Configured in .env.local (need to add to Vercel)

Please review the attached context files and help me with [YOUR SPECIFIC QUESTION]. 

If suggesting code, please:
- Provide complete, working implementations (not pseudocode)
- Include error handling
- Use TypeScript with proper types
- Follow the patterns shown in IMPLEMENTATION_GUIDE.md
- Consider edge cases and loading states
```

---

## 📝 How to Use This Prompt:

1. **Copy the prompt above**
2. **Replace the "[REPLACE THIS SECTION]"** with your specific question
3. **Attach these files to your LLM conversation:**
   - `PROJECT_STATUS.md`
   - `IMPLEMENTATION_GUIDE.md`
   - (Optional) Any specific file you're working on
4. **Paste the prompt**

---

## 🎯 Example Prompts for Different Scenarios:

### Scenario 1: Starting Implementation (Day 1)
```
[Use the main prompt above, replace the "WHAT I NEED HELP WITH" section with:]

Walk me through implementing api/llm/generate-tweets.ts step-by-step. This is the most critical piece.

Specifically:
1. Show me how to structure the OpenAI API calls for 2-pass generation
2. Help me design the prompt for realistic, diverse tweet personalities
3. Show me how to parse and save the results to Supabase
4. Include error handling and status updates
5. Make sure it handles the 10-100 tweet count range efficiently

I want complete, production-ready code that I can copy-paste and test.
```

### Scenario 2: Connecting Frontend (Day 2)
```
[Use the main prompt, replace the "WHAT I NEED HELP WITH" section with:]

Help me connect the Dashboard page to the API. Currently it's using mock data.

I need to:
1. Replace the mock "previousSimulations" array with a React Query hook that fetches from /api/simulations/list
2. Update the "Create Simulation" form submission to call /api/simulations/create
3. Show loading state while creating
4. Navigate to /simulation/:id after successful creation
5. Handle errors with toast notifications

Show me the complete updated Dashboard.tsx component with all React Query hooks properly configured.
```

### Scenario 3: Polling & Results (Day 3)
```
[Use the main prompt, replace the "WHAT I NEED HELP WITH" section with:]

Help me implement the polling logic in the Simulation page.

Requirements:
1. Extract simulation ID from URL params
2. Fetch simulation data from /api/simulations/:id
3. Poll every 2 seconds while status = "generating"
4. Show loading state with fun messages while generating
5. Display tweets when status = "completed"
6. Handle the "failed" status gracefully
7. Stop polling once completed or failed

Show me the complete implementation using React Query's refetchInterval pattern.
```

### Scenario 4: PDF & Email (Day 4)
```
[Use the main prompt, replace the "WHAT I NEED HELP WITH" section with:]

Help me implement the PDF generation and email functionality.

For PDF (client-side):
1. Analyze tweets to extract top 6 praises and top 6 worries
2. Use jsPDF to create a nice-looking PDF with:
   - Title and idea text
   - Top 6 Praises (with green styling)
   - Top 6 Worries (with orange styling)
   - Sentiment breakdown chart/percentages
3. Trigger download when user clicks "Download Summary"

For Email (server-side):
1. Implement api/pdf/email.ts endpoint
2. Generate the same PDF server-side
3. Send via Resend with PDF attachment
4. Include a nice email template

Show me both implementations with complete code.
```

### Scenario 5: Debugging Help
```
[Use the main prompt, replace the "WHAT I NEED HELP WITH" section with:]

I'm getting an error: [PASTE YOUR ERROR HERE]

This happens when I [DESCRIBE WHAT YOU'RE DOING].

Here's the relevant code:
[PASTE YOUR CODE HERE]

What's wrong and how do I fix it?
```

### Scenario 6: Code Review
```
[Use the main prompt, replace the "WHAT I NEED HELP WITH" section with:]

I've implemented [SPECIFIC FEATURE]. Can you review my code and suggest improvements?

Here's my implementation:
[PASTE YOUR CODE HERE]

Please check for:
1. Bugs or edge cases I might have missed
2. Performance issues
3. Security concerns
4. Better TypeScript patterns
5. Error handling gaps
6. Code organization/readability

Also, I'm attaching the file: [FILENAME]
```

### Scenario 7: Architecture Decisions
```
[Use the main prompt, replace the "WHAT I NEED HELP WITH" section with:]

I'm deciding between two approaches for [SPECIFIC FEATURE]:

Option A: [DESCRIBE APPROACH 1]
Option B: [DESCRIBE APPROACH 2]

Given my tech stack and requirements, which approach would you recommend and why?

Consider:
- Performance implications
- Scalability
- Development time
- Maintenance complexity
- Cost (API calls, serverless execution time)
```

---

## 💡 Pro Tips:

1. **Be Specific:** The more specific your question, the better the answer
2. **Include Context:** Mention what you've already tried
3. **Paste Errors:** Include full error messages with stack traces
4. **Attach Files:** If asking about a specific file, attach it
5. **Request Format:** Ask for "complete, working code" not "suggestions"
6. **Multiple Questions:** Break complex questions into separate prompts

---

## 🚀 Quick Start Guide:

**Day 1 Morning:**
Use "Scenario 1" prompt to implement LLM generation

**Day 1 Afternoon:**
Use "Scenario 2" prompt to connect Dashboard

**Day 2 Morning:**
Use "Scenario 3" prompt to implement polling

**Day 2 Afternoon:**
Test end-to-end, use "Scenario 5" for any bugs

**Day 3:**
Use "Scenario 4" prompt for PDF/email features

**Day 4+:**
Polish, use "Scenario 6" for code reviews

---

## 📋 Checklist for Each LLM Conversation:

Before pasting prompt:
- [ ] Attached PROJECT_STATUS.md
- [ ] Attached IMPLEMENTATION_GUIDE.md
- [ ] Replaced "[REPLACE THIS SECTION]" with my specific question
- [ ] If debugging, included error message
- [ ] If code review, attached the file or pasted code
- [ ] Specified desired output format (complete code vs. guidance)

---

**Remember:** The LLM has complete context from the attached files. Be specific about what you need, and ask for production-ready code! 🎯

