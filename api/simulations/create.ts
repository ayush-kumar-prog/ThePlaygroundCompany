import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { generateTweetsForSimulation } from './lib/generate-tweets-logic';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ideaText, audience, tweetCount } = req.body;

    // Validate inputs
    if (!ideaText || !audience || !tweetCount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (tweetCount < 10 || tweetCount > 100) {
      return res.status(400).json({ error: 'Tweet count must be between 10 and 100' });
    }

    // TEMPORARY: Simplified auth for MVP testing
    // TODO: Fix Clerk JWT verification with proper @clerk/backend API
    const authHeader = req.headers.authorization;
    
    // For now, use a fixed test user ID
    const clerkUserId = 'test_user_mvp';
    const userEmail = 'test@example.com';

    // Ensure user exists in Supabase database
    let { data: user, error: userFetchError } = await supabase
      .from('users')
      .select('id, simulation_count')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userFetchError && userFetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine (we'll create the user)
      console.error('Error fetching user:', userFetchError);
      throw userFetchError;
    }

    // Create user if doesn't exist
    if (!user) {
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkUserId,
          email: userEmail || 'unknown@email.com',
          simulation_count: 0
        })
        .select('id, simulation_count')
        .single();

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        throw createUserError;
      }

      user = newUser;
      console.log(`Created new user: ${clerkUserId}`);
    }

    // Create simulation record
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

    if (simError) {
      console.error('Error creating simulation:', simError);
      throw simError;
    }

    console.log(`Created simulation ${simulation.id} for user ${clerkUserId}`);

    // Increment user's simulation count
    await supabase
      .from('users')
      .update({ simulation_count: (user!.simulation_count || 0) + 1 })
      .eq('id', user!.id);

    // Trigger LLM generation directly (fire and forget)
    console.log(`[${simulation.id}] 🚀 Triggering LLM generation directly...`);
    
    // Call generation function without awaiting (background processing)
    generateTweetsForSimulation(
      simulation.id,
      ideaText,
      audience,
      tweetCount
    ).catch(err => {
      console.error(`[${simulation.id}] ❌ Background generation failed:`, err);
    });

    console.log(`[${simulation.id}] ✅ Generation started in background`);

    res.status(200).json({
      simulationId: simulation.id,
      status: 'generating',
      message: 'Simulation created successfully'
    });

  } catch (error: any) {
    console.error('Error creating simulation:', error);
    res.status(500).json({ 
      error: 'Failed to create simulation',
      details: error.message 
    });
  }
}
