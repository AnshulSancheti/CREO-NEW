'use strict';

const buildMissingKeyError = (service: string, envVar: string) =>
  `Missing ${envVar} in .env.local`;

/**
 * Get universal API key that provides access to multiple LLM providers (Gemini, GPT, Claude)
 * through the Emergent API service.
 */
export async function getUniversalApiKey(): Promise<string> {
  // Check for Emergent universal API key
  const emergentKey = process.env.EMERGENT_API_KEY;
  if (emergentKey) {
    return emergentKey;
  }

  throw new Error(buildMissingKeyError('Universal LLM', 'EMERGENT_API_KEY'));
}

export async function getYouTubeApiKey(): Promise<string> {
  const key =
    process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

  if (!key) {
    throw new Error(buildMissingKeyError('YouTube', 'YOUTUBE_API_KEY'));
  }
  return key;
}
