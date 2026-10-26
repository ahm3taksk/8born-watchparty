'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { PlayersGrid } from '@/components/PlayersGrid';
import { ChatDrawer } from '@/components/ChatDrawer';
import { RadarModal } from '@/components/RadarModal';
import { Sidebar } from '@/components/Sidebar';
import { Toasts } from '@/components/Toasts';
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts';
import { SquadCreatorModal } from '@/components/SquadCreatorModal';
import { SplashScreen } from '@/components/SplashScreen';
import { useWatchpartyStore } from '@/store/useWatchpartyStore';
import { LayoutMode } from '@/lib/types';

export default function WatchpartyPage() {
  const [mounted, setMounted] = useState(false);
  const { fetchLiveStatuses, loadFromShareUrl } = useWatchpartyStore();

  useEffect(() => {
    setMounted(true);

    // Check for shareable URL query parameters: ?streams=s1,s2&layout=theater-top
    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const streamsParam = searchParams.get('streams');
        const layoutParam = searchParams.get('layout') as LayoutMode | null;

        if (streamsParam) {
          const streamList = streamsParam
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          if (streamList.length > 0) {
            loadFromShareUrl(streamList, layoutParam || undefined);
          }
        }
      }
    } catch {
      // Safe URL parsing
    }

    // Initial live status scan on mount
    fetchLiveStatuses();

    // Periodic scanner polling every 35 seconds
    const interval = setInterval(() => {
      fetchLiveStatuses();
    }, 35000);

    return () => clearInterval(interval);
  }, [fetchLiveStatuses, loadFromShareUrl]);

  if (!mounted) {
    return (
      <div className="watchparty-app">
        <SplashScreen />
      </div>
    );
  }

  return (
    <div className="watchparty-app">
      {/* Luxury Eightborn Splash Screen on Startup */}
      <SplashScreen />

      {/* Global Hotkey Controller (1-6 Solo, M, F, C, R) */}
      <KeyboardShortcuts />

      {/* Main Tactical HUD Header */}
      <Header />

      {/* Main Viewport: Video Grid + Sliding Flex Layout Chat Column */}
      <div className="main-viewport">
        {/* Dynamic Multi-Player Grid (Theater Left/Top, Equal Grid, Single) */}
        <PlayersGrid />

        {/* Right Multi-Chat Drawer (Flex Slide Out, Never Overlays Streams) */}
        <ChatDrawer />
      </div>

      {/* Tactical Squads & Gang Management Drawer */}
      <Sidebar />

      {/* Live Eightborn Scanner / Radar Modal */}
      <RadarModal />

      {/* Dedicated Squad Creator Modal */}
      <SquadCreatorModal />

      {/* Toast Notifications */}
      <Toasts />
    </div>
  );
}
