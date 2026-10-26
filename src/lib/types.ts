export type LayoutMode = 'theater-left' | 'theater-top' | 'theater-right' | 'grid-equal' | 'single';

export type PlayerEngine = 'iframe' | 'hls';

export interface StreamerInfo {
  username: string;
  displayName: string;
  isLive: boolean;
  title?: string;
  viewers?: number;
  viewerCount?: number;
  avatar?: string;
  profilePicUrl?: string;
  category?: string;
  playback_url?: string | null;
  error?: string;
}

export interface Squad {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
  streamers: string[];
}

export interface StreamerAudioState {
  volume: number;      // 0.0 - 1.0
  muted: boolean;
  isSolo: boolean;
  isBoosted: boolean;
  quality: string;     // 'auto', '1080p', '720p', etc.
}
