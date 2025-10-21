import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase with service role key (server-side only)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface Tweet {
  author: string;
  text: string;
  sentiment: 'praise' | 'neutral' | 'worry';
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('🚀 LLM endpoint called!', { method: req.method, body: req.body });
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { simulationId, ideaText, audience, tweetCount } = req.body;

  // Validate inputs
  if (!simulationId || !ideaText || !audience || !tweetCount) {
    console.log('❌ Missing required fields:', { simulationId, ideaText, audience, tweetCount });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log(`[${simulationId}] Starting tweet generation for ${tweetCount} tweets`);

    // SIMPLIFIED: Single pass generation for speed (Vercel timeout workaround)
    // TODO: Re-enable 2-pass generation when we upgrade to paid Vercel plan
    const allTweets = await generateInitialTweets(ideaText, audience, tweetCount);
    
    console.log(`[${simulationId}] Generated ${allTweets.length} tweets`);

    // Format for database insertion
    const tweetsToInsert = allTweets.map((tweet, index) => ({
      simulation_id: simulationId,
      author_name: tweet.author,
      tweet_text: tweet.text,
      sentiment: tweet.sentiment,
      is_reply: index >= initialTweets.length,
      reply_to_id: null, // Could enhance later to link properly
      order_index: index,
    }));

    // Batch insert tweets to database
    const { error: insertError } = await supabase
      .from('generated_tweets')
      .insert(tweetsToInsert);

    if (insertError) {
      console.error(`[${simulationId}] Error inserting tweets:`, insertError);
      throw insertError;
    }

    // Update simulation status to completed
    const { error: updateError } = await supabase
      .from('simulations')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', simulationId);

    if (updateError) {
      console.error(`[${simulationId}] Error updating simulation:`, updateError);
      throw updateError;
    }

    console.log(`[${simulationId}] ✅ Completed successfully with ${allTweets.length} tweets`);

    res.status(200).json({
      success: true,
      tweetCount: allTweets.length,
      simulationId,
    });

  } catch (error: any) {
    console.error(`[${simulationId}] ❌ Error generating tweets:`, error);
    
    // Update simulation status to failed
    try {
      await supabase
        .from('simulations')
        .update({ status: 'failed' })
        .eq('id', simulationId);
      console.log(`[${simulationId}] Marked as failed`);
    } catch (err) {
      console.error(`[${simulationId}] Failed to update status:`, err);
    }
    
    res.status(500).json({ 
      error: 'Failed to generate tweets',
      details: error.message 
    });
  }
}

// Generate initial tweet reactions (Pass 1)
async function generateInitialTweets(
  ideaText: string, 
  audience: string, 
  count: number
): Promise<Tweet[]> {
  const systemPrompt = buildSystemPrompt(audience, count);
  const userPrompt = `Simulate Twitter reactions to this idea:\n\n"${ideaText}"\n\nGenerate exactly ${count} diverse, realistic tweets.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster and cheaper for MVP
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.9, // High creativity for diverse responses
      response_format: { type: 'json_object' }
    });

  const response = completion.choices[0].message.content;
  if (!response) {
    throw new Error('Empty response from OpenAI');
  }

  const parsed = JSON.parse(response);
  return parsed.tweets || [];
}

// Generate threaded replies (Pass 2)
async function generateReplyTweets(
  initialTweets: Tweet[], 
  ideaText: string, 
  targetCount: number
): Promise<Tweet[]> {
  // Select controversial/interesting tweets to reply to
  const controversialTweets = initialTweets
    .filter(t => t.sentiment === 'neutral' || t.sentiment === 'worry')
    .slice(0, Math.min(8, Math.ceil(targetCount / 3))); // Up to 8 threads

  if (controversialTweets.length === 0) {
    // Fall back to any tweets if no controversial ones
    controversialTweets.push(...initialTweets.slice(0, 3));
  }

  const allReplies: Tweet[] = [];
  const repliesPerThread = Math.ceil(targetCount / controversialTweets.length);

  for (const tweet of controversialTweets) {
    if (allReplies.length >= targetCount) break;

    const replyPrompt = `Generate ${Math.min(repliesPerThread, targetCount - allReplies.length)} realistic Twitter replies to this tweet about the idea: "${ideaText}"

Original tweet by ${tweet.author}: "${tweet.text}"

Create authentic back-and-forth conversation. Replies should:
- Clarify misunderstandings
- Add different perspectives
- Ask follow-up questions
- Agree or disagree constructively
- Feel natural and conversational

Return JSON format:
{
  "replies": [
    {
      "author": "@username",
      "text": "reply text",
      "sentiment": "praise" | "neutral" | "worry"
    }
  ]
}`;

    try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster for reply generation
      messages: [
        { role: 'system', content: 'You generate realistic Twitter reply threads. Keep replies concise and authentic.' },
        { role: 'user', content: replyPrompt }
      ],
      temperature: 0.9,
      response_format: { type: 'json_object' }
    });

      const response = completion.choices[0].message.content;
      if (response) {
        const parsed = JSON.parse(response);
        const replies = parsed.replies || [];
        allReplies.push(...replies.slice(0, targetCount - allReplies.length));
      }
    } catch (error) {
      console.error('Error generating reply thread:', error);
      // Continue with other threads even if one fails
    }
  }

  return allReplies;
}

// Build the system prompt for initial tweet generation
function buildSystemPrompt(audience: string, count: number): string {
  return `You are simulating realistic Twitter/X reactions to an idea.

AUDIENCE: ${audience}
Generate exactly ${count} unique tweet responses.

PERSONALITY DISTRIBUTION (mix these archetypes):
- Hype person (enthusiastic, ALL CAPS, emojis): 15%
- Skeptic (asks hard questions, challenges assumptions): 20%
- Technical expert (deep dive, specific concerns): 20%
- Encourager (positive but generic): 15%
- Confused person (misread or misunderstood the idea): 10%
- Contrarian (disagrees on principle, negative): 10%
- Thoughtful analyst (balanced, constructive feedback): 10%

LENGTH DISTRIBUTION:
- Short (1-10 words): 30%
- Medium (1-2 sentences): 50%
- Detailed (3-4 sentences): 20%

REALISM RULES:
- Use casual Twitter language (not formal)
- Include occasional typos (but not in every tweet)
- Vary emoji usage - some tweets have them, most don't
- Some users didn't read carefully and missed key points
- Some ask obvious questions
- Include specific technical questions when relevant
- Mix writing styles (some articulate, some casual)
- Realistic usernames (@tech_guru, @startup_guy, @skeptical_dev, etc.)
- Keep tweets under 280 characters

SENTIMENT CLASSIFICATION:
- "praise": Positive, supportive, excited, encouraging
- "neutral": Questions, curious, observing, mixed feelings
- "worry": Concerns, skepticism, criticism, potential problems

IMPORTANT: Output must be valid JSON in this exact format:
{
  "tweets": [
    {
      "author": "@realistic_username",
      "text": "tweet content here",
      "sentiment": "praise" | "neutral" | "worry"
    }
  ]
}

Make it feel like real Twitter - diverse, opinionated, and authentic!`;
}
