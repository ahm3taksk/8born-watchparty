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

  const data = await fetchKickChannelData(cleanSlug);
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
