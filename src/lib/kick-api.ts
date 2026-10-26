import { StreamerInfo } from './types';

interface CacheEntry {
  data: StreamerInfo;
  timestamp: number;
}

const channelCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 25000; // 25 seconds

function pruneCacheIfNeeded() {
  const keys = Object.keys(channelCache);
  if (keys.length > 120) {
    const now = Date.now();
    for (const k of keys) {
      if (now - channelCache[k].timestamp > CACHE_TTL_MS * 2) {
        delete channelCache[k];
      }
    }
  }
}

export async function fetchKickChannelData(slug: string): Promise<StreamerInfo> {
  const cleanSlug = slug.toLowerCase().trim().replace('@', '');
  if (!cleanSlug || !/^[a-zA-Z0-9_-]{1,30}$/.test(cleanSlug)) {
    return {
      username: cleanSlug || '',
      displayName: cleanSlug || '',
      isLive: false,
      error: 'Geçersiz kullanıcı adı',
    };
  }

  // Check cache first
  const now = Date.now();
  const cached = channelCache[cleanSlug];
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    Accept: 'application/json',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  // 1. Try Kick v2 API
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${cleanSlug}`, {
      headers,
      next: { revalidate: 20 },
    });

    if (res.status === 200) {
      const j = await res.json();
      if (j && (j.user || j.slug)) {
        const result: StreamerInfo = {
          username: j.slug ? j.slug.toLowerCase() : cleanSlug,
          displayName: j.user ? j.user.username : cleanSlug,
          isLive: Boolean(j.livestream),
          title: j.livestream ? j.livestream.session_title : '',
          viewers: j.livestream ? j.livestream.viewer_count : 0,
          viewerCount: j.livestream ? j.livestream.viewer_count : 0,
          avatar: j.user ? j.user.profile_pic : '',
          profilePicUrl: j.user ? j.user.profile_pic : '',
          category:
            j.livestream && j.livestream.categories && j.livestream.categories[0]
              ? j.livestream.categories[0].name
              : '',
          playback_url: j.livestream && j.playback_url ? j.playback_url : null,
        };

        pruneCacheIfNeeded();
        channelCache[cleanSlug] = { data: result, timestamp: Date.now() };
        return result;
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'v2 fetch error';
    console.warn(`[Kick API v2] Failed for @${cleanSlug}:`, message);
  }

  // 2. Fallback: Try Kick v1 API
  try {
    const res1 = await fetch(`https://kick.com/api/v1/channels/${cleanSlug}`, {
      headers,
      next: { revalidate: 20 },
    });

    if (res1.status === 200) {
      const j = await res1.json();
      if (j && (j.user || j.slug)) {
        const result: StreamerInfo = {
          username: j.slug ? j.slug.toLowerCase() : cleanSlug,
          displayName: j.user ? j.user.username : cleanSlug,
          isLive: Boolean(j.livestream),
          title: j.livestream ? j.livestream.session_title : '',
          viewers: j.livestream ? j.livestream.viewer_count : 0,
          viewerCount: j.livestream ? j.livestream.viewer_count : 0,
          avatar: j.user ? j.user.profile_pic : '',
          profilePicUrl: j.user ? j.user.profile_pic : '',
          category:
            j.recent_categories && j.recent_categories[0]
              ? j.recent_categories[0].name
              : '',
          playback_url: j.playback_url || null,
        };

        pruneCacheIfNeeded();
        channelCache[cleanSlug] = { data: result, timestamp: Date.now() };
        return result;
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'v1 fetch error';
    console.warn(`[Kick API v1] Failed for @${cleanSlug}:`, message);
  }

  // Fallback to stale cache if Kick rate-limits
  if (cached) {
    return cached.data;
  }

  return {
    username: cleanSlug,
    displayName: cleanSlug,
    isLive: false,
    error: 'Kanal bulunamadı veya çevrimdışı',
  };
}
