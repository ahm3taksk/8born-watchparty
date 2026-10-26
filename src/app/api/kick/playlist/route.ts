import { NextRequest, NextResponse } from 'next/server';

function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === 'live-video.net' ||
    h.endsWith('.live-video.net') ||
    h === 'kick.com' ||
    h.endsWith('.kick.com')
  );
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');
  if (!urlParam) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const targetUrl = new URL(urlParam);

    // Strict Protocol & SSRF check
    if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') {
      return new Response('Unauthorized protocol', { status: 403 });
    }

    if (!isAllowedHost(targetUrl.hostname)) {
      return new Response('Unauthorized host domain', { status: 403 });
    }

    const res = await fetch(targetUrl.toString(), {
      headers: {
        Origin: 'https://player.kick.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      return new Response(`Upstream error: ${res.status}`, { status: res.status });
    }

    const contentType =
      res.headers.get('content-type') || 'application/vnd.apple.mpegurl';
    const body = await res.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid URL';
    return new Response('Proxy fetch error: ' + message, { status: 500 });
  }
}
