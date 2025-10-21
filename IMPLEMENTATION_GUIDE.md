# Implementation Guide - Code Examples & Patterns

> Quick reference for implementing the core functionality. Read PROJECT_STATUS.md first for context.

## 🎯 Critical Path: What to Build First

### 1. LLM Tweet Generation (START HERE) ⭐

**File:** `api/llm/generate-tweets.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { simulationId, ideaText, audience, tweetCount } = req.body;

    // PASS 1: Generate initial reactions (70% of tweets)
    const initialCount = Math.floor(tweetCount * 0.7);
    const systemPrompt = buildSystemPrompt(audience, initialCount);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Simulate Twitter reactions to:\n\n"${ideaText}"` }
      ],
      temperature: 0.9,
      response_format: { type: 'json_object' }
    });

    const initialTweets = JSON.parse(completion.choices[0].message.content!).tweets;

    // PASS 2: Generate threaded replies (30% of tweets)
    const controversialTweets = selectControversialTweets(initialTweets, 6);
    const replyTweets = await generateReplies(controversialTweets, ideaText);

    // Combine and format
    const allTweets = [
      ...initialTweets.map((t: any, i: number) => ({
        simulation_id: simulationId,
        author_name: t.author,
        tweet_text: t.text,
        sentiment: t.sentiment,
        is_reply: false,
        reply_to_id: null,
        order_index: i
      })),
      ...replyTweets
    ];

    // Save to database
    const { error: insertError } = await supabase
      .from('generated_tweets')
      .insert(allTweets);

    if (insertError) throw insertError;

    // Update simulation status
    await supabase
      .from('simulations')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', simulationId);

    res.status(200).json({ success: true, tweetCount: allTweets.length });
  } catch (error) {
    console.error('Error generating tweets:', error);
    
    // Update simulation to failed
    await supabase
      .from('simulations')
      .update({ status: 'failed' })
      .eq('id', req.body.simulationId);
    
    res.status(500).json({ error: 'Failed to generate tweets' });
  }
}

function buildSystemPrompt(audience: string, count: number): string {
  return `You are simulating realistic Twitter reactions to an idea.

AUDIENCE: ${audience}
Generate exactly ${count} unique tweet responses.

PERSONALITY DISTRIBUTION:
- Hype person (enthusiastic, emojis): 15%
- Skeptic (asks hard questions): 20%
- Technical expert (specific concerns): 20%
- Encourager (positive but vague): 15%
- Confused (misunderstood the idea): 10%
- Contrarian (disagrees on principle): 10%
- Thoughtful (constructive feedback): 10%

LENGTH DISTRIBUTION:
- Short (1-10 words): 30%
- Medium (1-2 sentences): 50%
- Detailed (3-4 sentences): 20%

REALISM RULES:
- Mix of casual and professional language
- Occasional typos (not every tweet)
- Some users didn't read carefully
- Vary emoji usage (not every tweet)
- Include specific technical questions
- Some tweets are lazy ("this is cool")
- Some tweets are detailed analyses

SENTIMENT:
- "praise": Positive, supportive, excited
- "neutral": Questions, curious, observing
- "worry": Concerns, skepticism, criticism

OUTPUT FORMAT (MUST BE VALID JSON):
{
  "tweets": [
    {
      "author": "@realistic_username",
      "text": "tweet content here",
      "sentiment": "praise" | "neutral" | "worry"
    }
  ]
}`;
}

function selectControversialTweets(tweets: any[], count: number) {
  // Select tweets with neutral or worry sentiment for threading
  return tweets
    .filter((t: any) => t.sentiment !== 'praise')
    .slice(0, count);
}

async function generateReplies(tweets: any[], ideaText: string) {
  const replies: any[] = [];
  let orderIndex = 100; // Start after initial tweets

  for (const tweet of tweets) {
    const replyPrompt = `Generate 2-3 realistic Twitter replies to this tweet about the idea: "${ideaText}"

Original tweet: "${tweet.text}"

Generate authentic back-and-forth. Some replies should:
- Clarify misunderstandings
- Add more skepticism
- Provide additional info
- Agree or disagree

Return JSON:
{
  "replies": [
    {
      "author": "@username",
      "text": "reply content",
      "sentiment": "praise" | "neutral" | "worry"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You generate realistic Twitter reply threads.' },
        { role: 'user', content: replyPrompt }
      ],
      temperature: 0.9,
      response_format: { type: 'json_object' }
    });

    const threadReplies = JSON.parse(completion.choices[0].message.content!).replies;
    
    threadReplies.forEach((reply: any) => {
      replies.push({
        author_name: reply.author,
        tweet_text: reply.text,
        sentiment: reply.sentiment,
        is_reply: true,
        reply_to_id: null, // Can enhance later to link properly
        order_index: orderIndex++
      });
    });
  }

  return replies;
}
```

---

### 2. Create Simulation Endpoint

**File:** `api/simulations/create.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// For Clerk JWT verification, install: npm install @clerk/backend
// import { clerkClient } from '@clerk/backend';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ideaText, audience, tweetCount } = req.body;

    // TODO: Verify Clerk JWT and get user ID
    // For now, using a placeholder. Replace with:
    // const token = req.headers.authorization?.replace('Bearer ', '');
    // const verifiedToken = await clerkClient.verifyToken(token);
    // const clerkUserId = verifiedToken.sub;
    
    const clerkUserId = 'placeholder-clerk-id'; // TEMPORARY

    // Ensure user exists in Supabase
    let { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (!user) {
      // Create user
      const { data: newUser } = await supabase
        .from('users')
        .insert({ clerk_id: clerkUserId, email: 'placeholder@example.com' })
        .select('id')
        .single();
      user = newUser;
    }

    // Create simulation
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .insert({
        user_id: user!.id,
        idea_text: ideaText,
        audience: audience,
        tweet_count: tweetCount,
        status: 'generating'
      })
      .select()
      .single();

    if (simError) throw simError;

    // Trigger LLM generation asynchronously (fire and forget)
    fetch(`${process.env.VERCEL_URL || 'http://localhost:8080'}/api/llm/generate-tweets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulationId: simulation.id,
        ideaText,
        audience,
        tweetCount
      })
    }).catch(err => console.error('Failed to trigger LLM:', err));

    res.status(200).json({
      simulationId: simulation.id,
      status: 'generating'
    });
  } catch (error) {
    console.error('Error creating simulation:', error);
    res.status(500).json({ error: 'Failed to create simulation' });
  }
}
```

---

### 3. Get Simulation Endpoint

**File:** `api/simulations/[id].ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Fetch simulation with tweets
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select(`
        *,
        generated_tweets (*)
      `)
      .eq('id', id)
      .single();

    if (simError || !simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    // Sort tweets by order_index
    const tweets = simulation.generated_tweets.sort(
      (a: any, b: any) => a.order_index - b.order_index
    );

    res.status(200).json({
      simulation: {
        id: simulation.id,
        ideaText: simulation.idea_text,
        audience: simulation.audience,
        tweetCount: simulation.tweet_count,
        status: simulation.status,
        createdAt: simulation.created_at,
        updatedAt: simulation.updated_at
      },
      tweets: tweets.map((t: any) => ({
        id: t.id,
        author: t.author_name,
        text: t.tweet_text,
        sentiment: t.sentiment,
        isReply: t.is_reply,
        replyToId: t.reply_to_id
      }))
    });
  } catch (error) {
    console.error('Error fetching simulation:', error);
    res.status(500).json({ error: 'Failed to fetch simulation' });
  }
}
```

---

### 4. Dashboard React Query Hook

**File:** `src/pages/Dashboard.tsx`

Add this hook:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  
  // Fetch simulations
  const { data: simulations, isLoading } = useQuery({
    queryKey: ['simulations'],
    queryFn: async () => {
      const response = await fetch('/api/simulations/list');
      if (!response.ok) throw new Error('Failed to fetch simulations');
      return response.json();
    }
  });

  // Create simulation mutation
  const createSimulation = useMutation({
    mutationFn: async (data: { ideaText: string; audience: string; tweetCount: number }) => {
      const response = await fetch('/api/simulations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create simulation');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Simulation created!');
      navigate(`/simulation/${data.simulationId}`);
    },
    onError: () => {
      toast.error('Failed to create simulation');
    }
  });

  const handleCreateSimulation = () => {
    if (!idea.trim()) {
      toast.error('Please enter your idea');
      return;
    }

    createSimulation.mutate({
      ideaText: idea,
      audience: audience,
      tweetCount: tweetCount[0]
    });
    
    setShowCreateDialog(false);
  };

  // Rest of component...
}
```

---

### 5. Simulation Page with Polling

**File:** `src/pages/Simulation.tsx`

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function Simulation() {
  const { id } = useParams<{ id: string }>();
  
  // Fetch simulation with polling
  const { data, isLoading } = useQuery({
    queryKey: ['simulation', id],
    queryFn: async () => {
      const response = await fetch(`/api/simulations/${id}`);
      if (!response.ok) throw new Error('Failed to fetch simulation');
      return response.json();
    },
    refetchInterval: (data) => {
      // Poll every 2 seconds while generating
      return data?.simulation.status === 'generating' ? 2000 : false;
    }
  });

  const simulation = data?.simulation;
  const tweets = data?.tweets || [];

  if (isLoading) {
    return <LoadingState />;
  }

  if (simulation?.status === 'generating') {
    return <LoadingState message="Generating tweets..." />;
  }

  return (
    <div>
      {/* Display simulation results */}
      <div className="grid gap-4">
        {tweets.map((tweet: any, i: number) => (
          <TweetCard
            key={tweet.id}
            author={tweet.author}
            text={tweet.text}
            sentiment={tweet.sentiment}
            delay={i * 0.05}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### 6. PDF Generation (Client-Side)

**File:** `src/pages/Simulation.tsx` or create `src/lib/pdf.ts`

```typescript
import jsPDF from 'jspdf';

function generatePDF(simulation: any, tweets: any[]) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Simulation Results', 20, 20);
  
  // Idea
  doc.setFontSize(12);
  doc.text('Your Idea:', 20, 35);
  doc.setFontSize(10);
  const ideaLines = doc.splitTextToSize(simulation.ideaText, 170);
  doc.text(ideaLines, 20, 45);
  
  let yPos = 45 + (ideaLines.length * 7) + 10;
  
  // Extract top praises
  const praises = tweets
    .filter(t => t.sentiment === 'praise')
    .slice(0, 6);
  
  // Extract top worries
  const worries = tweets
    .filter(t => t.sentiment === 'worry')
    .slice(0, 6);
  
  // Top Praises
  doc.setFontSize(14);
  doc.setTextColor(34, 197, 94); // Green
  doc.text('Top 6 Praises:', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  praises.forEach((tweet, i) => {
    doc.text(`${i + 1}. "${tweet.text}"`, 25, yPos);
    yPos += 10;
  });
  
  yPos += 5;
  
  // Top Worries
  doc.setFontSize(14);
  doc.setTextColor(251, 146, 60); // Orange
  doc.text('Top 6 Worries:', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  worries.forEach((tweet, i) => {
    doc.text(`${i + 1}. "${tweet.text}"`, 25, yPos);
    yPos += 10;
  });
  
  // Sentiment breakdown
  yPos += 10;
  const praiseCount = tweets.filter(t => t.sentiment === 'praise').length;
  const neutralCount = tweets.filter(t => t.sentiment === 'neutral').length;
  const worryCount = tweets.filter(t => t.sentiment === 'worry').length;
  
  doc.setFontSize(12);
  doc.text('Sentiment Breakdown:', 20, yPos);
  yPos += 8;
  doc.setFontSize(10);
  doc.text(`Positive: ${praiseCount} (${Math.round(praiseCount/tweets.length*100)}%)`, 25, yPos);
  yPos += 7;
  doc.text(`Neutral: ${neutralCount} (${Math.round(neutralCount/tweets.length*100)}%)`, 25, yPos);
  yPos += 7;
  doc.text(`Concerns: ${worryCount} (${Math.round(worryCount/tweets.length*100)}%)`, 25, yPos);
  
  // Save
  doc.save('simulation-results.pdf');
}

// Usage in component:
const handleDownloadPDF = () => {
  generatePDF(simulation, tweets);
  toast.success('PDF downloaded!');
};
```

---

### 7. Protected Route Wrapper

**File:** `src/components/ProtectedRoute.tsx` (create this)

```typescript
import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useUser();
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
```

**Update:** `src/App.tsx`

```typescript
import { ProtectedRoute } from './components/ProtectedRoute';

// Update routes:
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
<Route path="/simulation/:id" element={
  <ProtectedRoute>
    <Simulation />
  </ProtectedRoute>
} />
```

---

## 🧪 Testing Checklist

### Test Locally Before Each Commit

```bash
# 1. Auth flow
- Sign up with new account
- Should redirect to dashboard
- Profile button should work
- Sign out should work

# 2. Create simulation
- Fill form with test idea
- Select audience
- Adjust tweet count
- Click Simulate
- Should navigate to /simulation/:id

# 3. Simulation view
- Should show "generating" state
- After ~15 seconds, tweets appear
- Tweets look realistic
- Can scroll through all tweets
- Edit & Rerun works

# 4. PDF download
- Click "Download Summary"
- PDF downloads with correct content
- Top 6 praises and worries

# 5. Email PDF
- Enter email
- Click Send
- Email arrives with PDF attachment
```

---

## ⚡ Quick Wins (Start Here)

**Day 1:**
1. Implement `api/llm/generate-tweets.ts` (most important!)
2. Test with Postman/Thunder Client
3. Verify tweets save to Supabase

**Day 2:**
1. Implement `api/simulations/create.ts`
2. Connect Dashboard form
3. Test end-to-end: create → see in database

**Day 3:**
1. Implement `api/simulations/[id].ts`
2. Connect Simulation page
3. Test polling and display

**Day 4:**
1. PDF generation
2. Email functionality
3. Edit & rerun

**Day 5:**
1. Polish UI
2. Error handling
3. Loading states

---

## 🔧 Helpful Commands

```bash
# Development
npm run dev

# Test API endpoint locally
curl -X POST http://localhost:8080/api/simulations/create \
  -H "Content-Type: application/json" \
  -d '{"ideaText":"Test idea","audience":"Tech Twitter","tweetCount":10}'

# Check Supabase logs
# Go to Supabase dashboard → Logs

# Check Vercel logs
# Go to Vercel dashboard → Deployments → View Function Logs
```

---

## 📚 Additional Resources

- **OpenAI Docs**: https://platform.openai.com/docs
- **Clerk Docs**: https://clerk.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **React Query**: https://tanstack.com/query/latest
- **jsPDF**: https://github.com/parallax/jsPDF

---

**Remember:** Start with LLM generation. Everything else is easy once that works! 🚀

