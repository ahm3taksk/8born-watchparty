import { StreamerInfo } from './types';

// In-memory cache for client-side to prevent duplicate network requests
const clientChannelCache: Record<string, { data: StreamerInfo; timestamp: number }> = {};
const CLIENT_CACHE_TTL = 30000; // 30 seconds

export async function fetchKickChannelClient(slug: string): Promise<StreamerInfo | null> {
  const cleanSlug = slug.toLowerCase().trim().replace('@', '');
  if (!cleanSlug || !/^[a-zA-Z0-9_-]{1,30}$/.test(cleanSlug)) {
    return null;
  }

  // Check client cache
  const cached = clientChannelCache[cleanSlug];
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
    return cached.data;
  }

  // 1. Direct browser fetch to Kick API v2 (bypasses Vercel/datacenter IP Cloudflare block)
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(cleanSlug)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.status === 200) {
      const j = await res.json();
      if (j && (j.user || j.slug)) {
        const info: StreamerInfo = {
          username: j.slug ? j.slug.toLowerCase() : cleanSlug,
          displayName: j.user?.username || cleanSlug,
          isLive: Boolean(j.livestream),
          title: j.livestream?.session_title || '',
          viewers: j.livestream?.viewer_count || 0,
          viewerCount: j.livestream?.viewer_count || 0,
          avatar: j.user?.profile_pic || '',
          profilePicUrl: j.user?.profile_pic || '',
          category:
            j.livestream?.categories?.[0]?.name ||
            j.recent_categories?.[0]?.name ||
            '',
          playback_url: j.playback_url || null,
        };

        clientChannelCache[cleanSlug] = { data: info, timestamp: Date.now() };
        return info;
      }
    }
  } catch (err) {
    console.debug(`[Client Kick API v2] Direct fetch skipped for @${cleanSlug}:`, err);
  }

  // 2. Direct browser fetch to Kick API v1 fallback
  try {
    const res1 = await fetch(`https://kick.com/api/v1/channels/${encodeURIComponent(cleanSlug)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (res1.status === 200) {
      const j = await res1.json();
      if (j && (j.user || j.slug)) {
        const info: StreamerInfo = {
          username: j.slug ? j.slug.toLowerCase() : cleanSlug,
          displayName: j.user?.username || cleanSlug,
          isLive: Boolean(j.livestream),
          title: j.livestream?.session_title || '',
          viewers: j.livestream?.viewer_count || 0,
          viewerCount: j.livestream?.viewer_count || 0,
          avatar: j.user?.profile_pic || '',
          profilePicUrl: j.user?.profile_pic || '',
          category:
            j.recent_categories?.[0]?.name ||
            '',
          playback_url: j.playback_url || null,
        };

        clientChannelCache[cleanSlug] = { data: info, timestamp: Date.now() };
        return info;
      }
    }
  } catch (err) {
    console.debug(`[Client Kick API v1] Direct fetch skipped for @${cleanSlug}:`, err);
  }

  // 3. Fallback to server proxy API if browser adblocker blocked direct kick.com requests
  try {
    const serverRes = await fetch(`/api/kick/channel/${encodeURIComponent(cleanSlug)}`);
    if (serverRes.ok) {
      const data: StreamerInfo = await serverRes.json();
      if (data && data.username && !data.error) {
        clientChannelCache[cleanSlug] = { data, timestamp: Date.now() };
        return data;
      }
    }
  } catch {
    // Server proxy also failed
  }

  return cached?.data || null;
}

export async function fetchMultipleKickChannelsClient(slugs: string[]): Promise<Record<string, StreamerInfo>> {
  const results: Record<string, StreamerInfo> = {};
  if (!slugs || slugs.length === 0) return results;

  // Process concurrently in chunks of 6 to avoid browser connection limits
  const chunkSize = 6;
  for (let i = 0; i < slugs.length; i += chunkSize) {
    const chunk = slugs.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (slug) => {
      const info = await fetchKickChannelClient(slug);
      if (info && info.username) {
        results[info.username.toLowerCase()] = info;
      }
    });
    await Promise.allSettled(chunkPromises);
  }

  return results;
}
