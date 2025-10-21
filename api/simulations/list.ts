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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and verify Clerk JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    let clerkUserId: string;

    try {
      // Verify the JWT token with Clerk
      const verifiedToken = await clerkClient.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });
      
      clerkUserId = verifiedToken.sub;
      
    } catch (error) {
      console.error('Clerk JWT verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

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

    // Fetch all simulations for this user
    const { data: simulations, error: simsError } = await supabase
      .from('simulations')
      .select('id, idea_text, audience, tweet_count, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (simsError) {
      console.error('Error fetching simulations:', simsError);
      throw simsError;
    }

    // Format response
    const formattedSimulations = (simulations || []).map((sim: any) => ({
      id: sim.id,
      ideaText: sim.idea_text,
      audience: sim.audience,
      tweetCount: sim.tweet_count,
      status: sim.status,
      createdAt: sim.created_at,
      updatedAt: sim.updated_at
    }));

    res.status(200).json({ simulations: formattedSimulations });

  } catch (error: any) {
    console.error('Error listing simulations:', error);
    res.status(500).json({ 
      error: 'Failed to list simulations',
      details: error.message 
    });
  }
}
