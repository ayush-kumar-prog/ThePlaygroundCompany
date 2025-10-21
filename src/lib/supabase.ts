import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (will be generated from Supabase schema later)
export type User = {
  id: string;
  clerk_id: string;
  email: string;
  created_at: string;
  simulation_count: number;
};

export type Simulation = {
  id: string;
  user_id: string;
  idea_text: string;
  audience: string;
  tweet_count: number;
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
};

export type GeneratedTweet = {
  id: string;
  simulation_id: string;
  author_name: string;
  tweet_text: string;
  sentiment: 'praise' | 'neutral' | 'worry';
  is_reply: boolean;
  reply_to_id: string | null;
  order_index: number;
  created_at: string;
};

