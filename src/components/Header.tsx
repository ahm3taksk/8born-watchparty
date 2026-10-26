'use client';

import React, { useEffect, useState } from 'react';
import { useWatchpartyStore } from '@/store/useWatchpartyStore';
import { SquadIcon } from './SquadIcon';
import {
  Shield,
  Volume2,
  VolumeX,
  MessageSquare,
  Radar,
  SlidersHorizontal,
  Maximize,
  Minimize,
  LayoutGrid,
  Square,
  PanelLeftClose,
  PanelTopClose,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Share2,
} from 'lucide-react';

export function Header() {
  const {
    squads,
    activeSquadId,
    setActiveSquad,
    activeLayout,
    setLayout,
    masterVolume,
    setMasterVolume,
    masterMuted,
    toggleMasterMute,
    isChatOpen,
    setChatOpen,
    isRadarOpen,
    setRadarOpen,
    isSidebarOpen,
    setSidebarOpen,
    autoHideOffline,
    toggleAutoHideOffline,
    setSquadCreatorOpen,
    liveStatuses,
    addToast,
    getActiveSquad,
  } = useWatchpartyStore();

  const [timeStr, setTimeStr] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState<boolean>(false);

  // Sync fullscreen state with document changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
      if (fs) {
        setIsHeaderHovered(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Live Turkey Time Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('tr-TR', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
      setIsHeaderHovered(false);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
      setIsHeaderHovered(false);
    }
  };

  // QoL: Sync all videos to live edge
  const syncAllStreams = () => {
    const videos = document.querySelectorAll('video');
    videos.forEach((v) => {
      try {
        if (v.buffered && v.buffered.length > 0) {
          v.currentTime = v.buffered.end(v.buffered.length - 1);
        }
        if (v.paused) v.play().catch(() => {});
      } catch {
        // Safe execution
      }
    });
    addToast('Tüm yayınlar canlıya eşitlendi');
  };

  const handleShareWatchparty = () => {
    const active = getActiveSquad();
    const streamers = active ? active.streamers.join(',') : '';
    const shareUrl = `${window.location.origin}${window.location.pathname}?streams=${encodeURIComponent(streamers)}&layout=${activeLayout}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        addToast('İzleme linki panoya kopyalandı!');
      })
      .catch(() => {
        prompt('İzleme linkini kopyalayabilirsiniz:', shareUrl);
      });
  };

  return (
    <>
      {isFullscreen && (
        <div
          className="fullscreen-top-sensor"
          onMouseEnter={() => setIsHeaderHovered(true)}
          title="Menüyü Göster"
        />
      )}
      <header
        className={`hud-header ${isFullscreen ? 'is-fullscreen-header' : ''} ${isHeaderHovered ? 'header-visible' : ''}`}
        onMouseEnter={() => {
          if (isFullscreen) setIsHeaderHovered(true);
        }}
        onMouseLeave={() => {
          if (isFullscreen) setIsHeaderHovered(false);
        }}
      >
      {/* Brand & Live Clock */}
      <div className="brand-section">
        <button
          type="button"
          className="brand-logo"
          onClick={() => setSidebarOpen(true)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div className="brand-crest">
            <Shield size={24} color="#FFC526" fill="rgba(255, 197, 38, 0.2)" strokeWidth={2.2} />
          </div>
          <div className="brand-text-wrap" lang="en">
            <span className="brand-title">EIGHTBORN V</span>
            <span className="brand-subtitle">WATCHPARTY HUB</span>
          </div>
        </button>

        <div className="live-clock-badge" title="Canlı Saat (TR)">
          <span className="pulse-dot live"></span>
          <span>{timeStr || '00:00:00'}</span>
        </div>
      </div>

      {/* Center: Squad Tabs & Add Squad Button */}
      <nav className="squad-tabs-bar" aria-label="Ekipler">
        {squads.map((squad) => {
          const isActive = squad.id === activeSquadId;
          const liveCount = squad.streamers.filter(
            (s) => liveStatuses[s.toLowerCase()]?.isLive
          ).length;
          const hasLive = liveCount > 0;

          return (
            <button
              key={squad.id}
              type="button"
              className={`squad-tab-pill ${isActive ? 'active' : ''}`}
              onClick={() => setActiveSquad(squad.id)}
              title={`${squad.name} ekibine geç (${liveCount} canlı yayıncı)`}
            >
              <span
                className={`pulse-dot ${hasLive ? 'live' : 'offline'}`}
                title={hasLive ? `${liveCount} yayıncı canlı` : 'Canlı yayın yok'}
              />
              <SquadIcon name={squad.icon} size={14} color={squad.color} />
              <span>{squad.name}</span>
              <span className={`squad-count-badge ${hasLive ? 'has-live' : ''}`}>
                {hasLive ? `${liveCount}/${squad.streamers.length}` : squad.streamers.length}
              </span>
            </button>
          );
        })}

        {/* Quick Squad Creator Button */}
        <button
          type="button"
          className="squad-tab-pill add-squad-pill"
          onClick={() => setSquadCreatorOpen(true)}
          title="Yeni Ekip Oluştur"
        >
          <Plus size={13} color="var(--eb-primary)" />
          <span>Yeni Ekip</span>
        </button>
      </nav>

      {/* Right: Master Volume, Layouts, AutoHide, Chat, Radar, Sidebar */}
      <div className="hud-actions">
        {/* Layout Switcher */}
        <div className="layout-selector" title="Ekran Düzeni">
          <button
            type="button"
            className={`layout-pill-btn ${activeLayout === 'theater-left' ? 'active' : ''}`}
            onClick={() => setLayout('theater-left')}
            title="Sinematik Sol Odak"
          >
            <PanelLeftClose size={14} />
          </button>
          <button
            type="button"
            className={`layout-pill-btn ${activeLayout === 'theater-top' ? 'active' : ''}`}
            onClick={() => setLayout('theater-top')}
            title="Sinematik Üst Odak"
          >
            <PanelTopClose size={14} />
          </button>
          <button
            type="button"
            className={`layout-pill-btn ${activeLayout === 'grid-equal' ? 'active' : ''}`}
            onClick={() => setLayout('grid-equal')}
            title="Eşit Dağılımlı Izgara"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            className={`layout-pill-btn ${activeLayout === 'single' ? 'active' : ''}`}
            onClick={() => setLayout('single')}
            title="Tekli Odak"
          >
            <Square size={14} />
          </button>
        </div>

        {/* Master Volume */}
        <div className="master-volume-box" title="Ana Ses Kontrolü">
          <button
            type="button"
            className="btn-ctrl"
            onClick={toggleMasterMute}
            style={{ border: 'none', background: 'transparent', padding: 0 }}
          >
            {masterMuted || masterVolume === 0 ? (
              <VolumeX size={15} color="#ef4444" />
            ) : (
              <Volume2 size={15} color="var(--eb-primary)" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={masterMuted ? 0 : Math.round(masterVolume * 100)}
            onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
            className="hud-slider"
          />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', minWidth: '28px' }}>
            {masterMuted ? '0%' : `${Math.round(masterVolume * 100)}%`}
          </span>
        </div>

        {/* QoL: Sync All Streams */}
        <button
          type="button"
          className="action-btn"
          onClick={syncAllStreams}
          title="Tüm Yayınları Canlıya Eşitle (Sync)"
        >
          <RefreshCw size={13} color="var(--eb-primary)" />
          <span>Eşitle</span>
        </button>

        {/* Share Watchparty URL */}
        <button
          type="button"
          className="action-btn"
          onClick={handleShareWatchparty}
          title="Mevcut Yayınları ve Düzeni Paylaş"
        >
          <Share2 size={13} color="var(--eb-primary)" />
          <span>Paylaş</span>
        </button>

        {/* AutoHide Offline Streamers Toggle */}
        <button
          type="button"
          className={`action-btn ${autoHideOffline ? 'active' : ''}`}
          onClick={toggleAutoHideOffline}
          title={autoHideOffline ? 'Çevrimdışıları Gizle Açık (Tıklayınca tümünü gösterir)' : 'Çevrimdışıları Otomatik Gizle'}
        >
          {autoHideOffline ? <EyeOff size={13} color="var(--eb-primary)" /> : <Eye size={13} />}
          <span>{autoHideOffline ? 'Sadece Canlı' : 'Tümü'}</span>
        </button>

        {/* Live Radar */}
        <button
          type="button"
          className={`action-btn ${isRadarOpen ? 'active' : ''}`}
          onClick={() => setRadarOpen(!isRadarOpen)}
          title="Eightborn Canlı Yayın Radarını Aç"
        >
          <Radar size={13} color="var(--eb-primary)" />
          <span>Radar</span>
        </button>

        {/* Kick Chat Drawer Toggle */}
        <button
          type="button"
          className={`action-btn ${isChatOpen ? 'active' : ''}`}
          onClick={() => setChatOpen(!isChatOpen)}
          title="Kick Sohbet Çekmecesi"
        >
          <MessageSquare size={13} />
          <span>Sohbet</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          className="action-btn"
          onClick={toggleFullscreen}
          title="Tam Ekran"
        >
          {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
        </button>

        {/* Ekip & Ayarlar Drawer Toggle */}
        <button
          type="button"
          className={`action-btn action-btn-gold ${isSidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          title="Ekip & Ayarlar Menüsü"
        >
          <SlidersHorizontal size={13} />
          <span>Ekip & Ayarlar</span>
        </button>
      </div>
    </header>
    </>
  );
}
