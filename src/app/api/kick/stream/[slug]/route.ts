import { NextRequest, NextResponse } from 'next/server';
import { fetchKickChannelData } from '@/lib/kick-api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cleanSlug = slug ? slug.trim().toLowerCase().replace('@', '') : '';
  if (!cleanSlug || !/^[a-zA-Z0-9_-]{1,30}$/.test(cleanSlug)) {
    return NextResponse.json({ error: 'Valid username required' }, { status: 400 });
  }

  const channelData = await fetchKickChannelData(cleanSlug);
  if (!channelData.isLive || !channelData.playback_url) {
    return NextResponse.json(
      { error: 'Stream offline or no playback URL', isLive: Boolean(channelData.isLive) },
      { status: 404 }
    );
  }

  try {
    const ivsRes = await fetch(channelData.playback_url, {
      headers: {
        Origin: 'https://player.kick.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
    });

    if (!ivsRes.ok) {
      return NextResponse.json(
        { error: 'IVS stream fetch error', status: ivsRes.status },
        { status: 502 }
      );
    }

    const manifest = await ivsRes.text();
    const trimmed = manifest.trim();

    if (!trimmed.startsWith('#EXTM3U')) {
      return NextResponse.json({ error: 'Invalid M3U8 manifest' }, { status: 502 });
    }

    // Direct Streaming: The variant playlists and CloudFront .ts video chunks
    // already have Access-Control-Allow-Origin: * headers.
    // The browser downloads video directly from Amazon CDN.
    // ZERO video bandwidth goes through our Next.js server!
    return new Response(manifest, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Stream manifest error: ' + message }, { status: 500 });
  }
}
