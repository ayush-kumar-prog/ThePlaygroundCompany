import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
// TEMPORARY: Clerk JWT verification disabled for MVP
// TODO: Fix @clerk/backend import and JWT verification

// Initialize Supabase with service role key (server-side only)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid simulation ID' });
    }

    // TEMPORARY: Simplified auth for MVP testing
    // TODO: Fix Clerk JWT verification with proper @clerk/backend API
    const clerkUserId = 'test_user_mvp';

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch simulation with related tweets
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select(`
        id,
        idea_text,
        audience,
        tweet_count,
        status,
        created_at,
        updated_at,
        user_id
      `)
      .eq('id', id)
      .single();

    if (simError || !simulation) {
      console.error('Simulation not found:', simError);
      return res.status(404).json({ error: 'Simulation not found' });
    }

    // Verify user owns this simulation
    if (simulation.user_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized to view this simulation' });
    }

    // Fetch all tweets for this simulation
    const { data: tweets, error: tweetsError } = await supabase
      .from('generated_tweets')
      .select('*')
      .eq('simulation_id', id)
      .order('order_index', { ascending: true });

    if (tweetsError) {
      console.error('Error fetching tweets:', tweetsError);
      // Don't throw - simulation might still be generating
    }

    // Format response
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
      tweets: (tweets || []).map((tweet: any) => ({
        id: tweet.id,
        author: tweet.author_name,
        text: tweet.tweet_text,
        sentiment: tweet.sentiment,
        isReply: tweet.is_reply,
        replyToId: tweet.reply_to_id,
        orderIndex: tweet.order_index
      }))
    });

  } catch (error: any) {
    console.error('Error fetching simulation:', error);
    res.status(500).json({ 
      error: 'Failed to fetch simulation',
      details: error.message 
    });
  }
}
