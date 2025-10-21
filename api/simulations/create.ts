import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/backend';

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

    // Extract and verify Clerk JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    let clerkUserId: string;
    let userEmail: string | undefined;

    try {
      // Verify the JWT token with Clerk
      const verifiedToken = await clerkClient.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });
      
      clerkUserId = verifiedToken.sub;
      
      // Get user details from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      userEmail = clerkUser.emailAddresses[0]?.emailAddress;
      
    } catch (error) {
      console.error('Clerk JWT verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

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

    // Trigger LLM generation asynchronously (fire and forget)
    const generateUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/llm/generate-tweets`
      : 'http://localhost:8080/api/llm/generate-tweets';

    fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulationId: simulation.id,
        ideaText,
        audience,
        tweetCount
      })
    }).catch(err => {
      console.error(`Failed to trigger LLM generation for ${simulation.id}:`, err);
      // Don't throw - let the simulation stay in "generating" state
      // User can retry or we can implement a cleanup job later
    });

    console.log(`Triggered LLM generation for simulation ${simulation.id}`);

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
