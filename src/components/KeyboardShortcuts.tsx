'use client';

import { useEffect } from 'react';
import { useWatchpartyStore } from '@/store/useWatchpartyStore';

export function KeyboardShortcuts() {
  const {
    getActiveSquad,
    mainFocusStreamer,
    toggleStreamerMute,
    streamerStates,
    addToast,
    toggleSolo,
    setChatOpen,
    isChatOpen,
    setRadarOpen,
    isRadarOpen,
    setSidebarOpen,
    isSidebarOpen,
    isSquadCreatorOpen,
    setSquadCreatorOpen,
  } = useWatchpartyStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Escape closes open modals & drawers
      if (e.key === 'Escape') {
        if (isSquadCreatorOpen) setSquadCreatorOpen(false);
        if (isRadarOpen) setRadarOpen(false);
        if (isSidebarOpen) setSidebarOpen(false);
        if (isChatOpen) setChatOpen(false);
        return;
      }

      // Numbers 1 - 6: Solo mode
      if (/^[1-6]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        const currentSquad = getActiveSquad();
        if (currentSquad && currentSquad.streamers[index]) {
          toggleSolo(currentSquad.streamers[index]);
        }
        return;
      }

      // M: Focus Stream Mute Toggle (Odak Yayını Sustur / Aç)
      if (e.key === 'm' || e.key === 'M') {
        const focusStreamer = mainFocusStreamer || getActiveSquad()?.streamers[0];
        if (focusStreamer) {
          toggleStreamerMute(focusStreamer);
          const wasMuted = streamerStates[focusStreamer]?.muted ?? false;
          addToast(wasMuted ? `@${focusStreamer} sesi açıldı` : `@${focusStreamer} susturuldu`);
        }
        return;
      }

      // Chat Toggle
      if (e.key === 'c' || e.key === 'C') {
        setChatOpen(!isChatOpen);
        return;
      }

      // Radar Toggle
      if (e.key === 'r' || e.key === 'R') {
        setRadarOpen(!isRadarOpen);
        return;
      }

      // F: Focus Stream Fullscreen Toggle (Odak Yayını Tam Ekran Yap / Çık)
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          const focusCard =
            document.querySelector<HTMLElement>('.player-card.is-main') ||
            document.querySelector<HTMLElement>('.player-card');
          if (focusCard) {
            focusCard.requestFullscreen().catch(() => {});
          }
        } else {
          document.exitFullscreen().catch(() => {});
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    getActiveSquad,
    mainFocusStreamer,
    toggleStreamerMute,
    streamerStates,
    addToast,
    toggleSolo,
    setChatOpen,
    isChatOpen,
    setRadarOpen,
    isRadarOpen,
    setSidebarOpen,
    isSidebarOpen,
    isSquadCreatorOpen,
    setSquadCreatorOpen,
  ]);

  return null;
}
