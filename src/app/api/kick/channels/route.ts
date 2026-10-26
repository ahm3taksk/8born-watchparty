import { NextRequest, NextResponse } from 'next/server';
import { fetchKickChannelData } from '@/lib/kick-api';
import { DEFAULT_VERIFIED_STREAMERS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const namesParam = searchParams.get('names');

  let names: string[] = [];
  if (namesParam) {
    names = namesParam
      .split(',')
      .map((s) => s.trim().toLowerCase().replace('@', ''))
      .filter((s) => /^[a-zA-Z0-9_-]{1,30}$/.test(s))
      .slice(0, 50); // Cap to 50 max to prevent DoS / rate-limiting
  } else {
    names = DEFAULT_VERIFIED_STREAMERS.map((s) => s.username);
  }

  // Fetch in parallel
  const results = await Promise.all(names.map(fetchKickChannelData));

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
