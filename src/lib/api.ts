// API client functions for interacting with backend
import type { Simulation, GeneratedTweet } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Helper to get Clerk token
// This function will be called from components that have access to useAuth()
// We'll pass the token directly instead
let clerkTokenGetter: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(getter: () => Promise<string | null>) {
  clerkTokenGetter = getter;
}

async function getAuthToken(): Promise<string | null> {
  if (clerkTokenGetter) {
    return clerkTokenGetter();
  }
  return null;
}

export interface CreateSimulationInput {
  ideaText: string;
  audience: string;
  tweetCount: number;
}

export interface SimulationResponse {
  simulation: Simulation;
  tweets?: GeneratedTweet[];
}

// Create a new simulation
export async function createSimulation(input: CreateSimulationInput): Promise<{ simulationId: string; status: string }> {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/simulations/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to create simulation');
  }

  return response.json();
}

// Get simulation by ID
export async function getSimulation(simulationId: string): Promise<SimulationResponse> {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/simulations/${simulationId}`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch simulation');
  }

  return response.json();
}

// List user's simulations
export async function listSimulations(): Promise<Simulation[]> {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/simulations/list`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch simulations');
  }

  return response.json();
}

// Rerun simulation with edited idea
export async function rerunSimulation(simulationId: string, newIdeaText: string): Promise<{ simulationId: string; status: string }> {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/simulations/rerun`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ simulationId, newIdeaText }),
  });

  if (!response.ok) {
    throw new Error('Failed to rerun simulation');
  }

  return response.json();
}

// Email PDF to user
export async function emailPDF(simulationId: string, emailTo: string): Promise<{ success: boolean; message: string }> {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/pdf/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ simulationId, emailTo }),
  });

  if (!response.ok) {
    throw new Error('Failed to email PDF');
  }

  return response.json();
}

