import { YouTubeResourceSchema } from '../schemas';

// ========================================
// YOUTUBE PROVIDER INTERFACE
// ========================================

export interface YouTubeProvider {
  searchVideos(query: string, maxResults?: number): Promise<YouTubeResource[]>;
}

export type YouTubeResource = {
  title: string;
  url: string;
  channel?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  reason?: string;
};

// ========================================
// YOUTUBE DATA API PROVIDER
// ========================================

export class YouTubeDataApiProvider implements YouTubeProvider {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchVideos(query: string, maxResults: number = 3): Promise<YouTubeResource[]> {
    try {
      // Search for videos
      const searchUrl = new URL(`${this.baseUrl}/search`);
      searchUrl.searchParams.append('part', 'snippet');
      searchUrl.searchParams.append('q', query);
      searchUrl.searchParams.append('type', 'video');
      searchUrl.searchParams.append('maxResults', maxResults.toString());
      searchUrl.searchParams.append('videoEmbeddable', 'true');
      searchUrl.searchParams.append('relevanceLanguage', 'en');
      searchUrl.searchParams.append('key', this.apiKey);

      const searchResponse = await fetch(searchUrl.toString());
      
      if (!searchResponse.ok) {
        const error = await searchResponse.json().catch(() => ({}));
        throw new Error(`YouTube API error: ${searchResponse.status} - ${JSON.stringify(error)}`);
      }

      const searchData = await searchResponse.json();

      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }

      // Get video details (duration)
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
      const detailsUrl = new URL(`${this.baseUrl}/videos`);
      detailsUrl.searchParams.append('part', 'contentDetails');
      detailsUrl.searchParams.append('id', videoIds);
      detailsUrl.searchParams.append('key', this.apiKey);

      const detailsResponse = await fetch(detailsUrl.toString());
      const detailsData = await detailsResponse.json();

      const durationMap = new Map<string, number>();
      if (detailsData.items) {
        detailsData.items.forEach((item: any) => {
          const duration = this.parseDuration(item.contentDetails?.duration);
          durationMap.set(item.id, duration);
        });
      }

      // Map to our format
      const resources: YouTubeResource[] = searchData.items.map((item: any) => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        channel: item.snippet.channelTitle,
        durationSeconds: durationMap.get(item.id.videoId),
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        reason: `Recommended based on search for: ${query}`
      }));

      return resources;
    } catch (error: any) {
      console.error('[YouTube API] Error:', error.message);
      throw error;
    }
  }

  private parseDuration(isoDuration: string): number {
    // Parse ISO 8601 duration (PT1H2M30S -> seconds)
    if (!isoDuration) return 0;

    const matches = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return 0;

    const hours = parseInt(matches[1] || '0');
    const minutes = parseInt(matches[2] || '0');
    const seconds = parseInt(matches[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }
}

// ========================================
// MOCK YOUTUBE PROVIDER (ALWAYS WORKS)
// ========================================

export class MockYouTubeProvider implements YouTubeProvider {
  async searchVideos(query: string, maxResults: number = 3): Promise<YouTubeResource[]> {
    // Return deterministic mock videos
    const mockVideos: YouTubeResource[] = [];

    for (let i = 1; i <= maxResults; i++) {
      mockVideos.push({
        title: `${query} - Tutorial Part ${i}`,
        url: `https://youtube.com/watch?v=mock_${i}_${query.replace(/\s+/g, '_')}`,
        channel: 'Learning Channel',
        durationSeconds: 600 + i * 60, // 10-12 minutes
        thumbnailUrl: `https://via.placeholder.com/480x360?text=Video+${i}`,
        reason: `Mock video for: ${query} (YouTube API not configured)`
      });
    }

    return mockVideos;
  }
}

// ========================================
// PROVIDER FACTORY
// ========================================

export function createYouTubeProvider(): YouTubeProvider {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey && apiKey.length > 0) {
    console.log('[YouTube Provider] Using YouTube Data API');
    return new YouTubeDataApiProvider(apiKey);
  } else {
    console.warn('[YouTube Provider] No API key found, using Mock Provider');
    return new MockYouTubeProvider();
  }
}
