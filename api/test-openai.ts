import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('🧪 Testing OpenAI API connection...');
  
  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        success: false,
        error: 'OPENAI_API_KEY not found in environment variables' 
      });
    }

    console.log('✅ API key found, length:', process.env.OPENAI_API_KEY.length);

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('✅ OpenAI client initialized');

    // Test simple completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello from Vercel!" in exactly those words.' }
      ],
      temperature: 0.5,
      max_tokens: 50
    });

    const response = completion.choices[0].message.content;
    
    console.log('✅ OpenAI API responded:', response);

    return res.status(200).json({
      success: true,
      message: 'OpenAI API is working!',
      testResponse: response,
      model: completion.model,
      apiKeyPrefix: process.env.OPENAI_API_KEY.substring(0, 10) + '...'
    });

  } catch (error: any) {
    console.error('❌ OpenAI test failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
}

