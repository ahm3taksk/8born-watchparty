'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWatchpartyStore } from '@/store/useWatchpartyStore';
import {
  Volume2,
  VolumeX,
  Zap,
  MessageSquare,
  Maximize2,
  X,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Radio,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import Hls from 'hls.js';

interface PlayerCardProps {
  streamer: string;
  isMainStage: boolean;
  index: number;
}

export function PlayerCard({ streamer, isMainStage, index }: PlayerCardProps) {
  const {
    activeSquadId,
    mainFocusStreamer,
    setMainFocus,
    moveStreamerInSquad,
    removeStreamerFromSquad,
    playerEngine,
    masterVolume,
    masterMuted,
    streamerStates,
    setStreamerVolume,
    toggleStreamerMute,
    toggleStreamerBoost,
    toggleSolo,
    setChatOpen,
    autoMaxQuality,
    liveStatuses,
    fetchStreamerProfile,
  } = useWatchpartyStore();

  const state = streamerStates[streamer] || {
    volume: 1.0,
    muted: !isMainStage, // Companions start muted by default
    isSolo: false,
    isBoosted: false,
    quality: 'auto',
  };

  const cardRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [isOffline, setIsOffline] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [qualityLevels, setQualityLevels] = useState<{ id: number; label: string }[]>([]);
  const [showControls, setShowControls] = useState(false);
  const [isCardFullscreen, setIsCardFullscreen] = useState(false);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: -1, y: -1 });

  // Fetch streamer profile if not yet cached in global store
  useEffect(() => {
    if (!liveStatuses[streamer.toLowerCase()]) {
      fetchStreamerProfile(streamer);
    }
  }, [streamer, fetchStreamerProfile, liveStatuses]);

  // Sync fullscreen state & auto-hide on fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = document.fullscreenElement === cardRef.current || Boolean(document.fullscreenElement);
      setIsCardFullscreen(isFs);
      if (isFs) {
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        hideControlsTimer.current = setTimeout(() => {
          setShowControls(false);
        }, 1500);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Effective volume calculation
  const effectiveVolume = masterMuted || state.muted ? 0 : state.volume * masterVolume;

  // Live status from global scanner
  const liveInfo = liveStatuses[streamer.toLowerCase()];
  const isChannelLive = !isOffline && (liveInfo !== undefined ? liveInfo.isLive : true);
  const avatarUrl =
    liveInfo?.profilePicUrl ||
    liveInfo?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(streamer)}&background=1e1e24&color=FFC526&size=120`;

  // =========================================================================
  // Native HLS Player Lifecycle (Zero-Reload on Focus/Layout Changes)
  // =========================================================================
  useEffect(() => {
    if (playerEngine !== 'hls') return;
    const video = videoRef.current;
    if (!video) return;

    setIsOffline(false);
    // Prefer direct playback_url via playlist proxy if known, else server slug
    const streamUrl = liveInfo?.playback_url
      ? `/api/kick/playlist?url=${encodeURIComponent(liveInfo.playback_url)}`
      : `/api/kick/stream/${encodeURIComponent(streamer)}/master.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        capLevelToPlayerSize: false, // Ensure full 1080p stream resolution
        manifestLoadingTimeOut: 15000,
        levelLoadingTimeOut: 15000,
        fragLoadingTimeOut: 15000,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsOffline(false);
        video.muted = masterMuted || state.muted;
        video.play().catch(() => {
          // Autoplay fallback: mute and play
          video.muted = true;
          video.play().catch(() => {});
        });

        // Parse quality levels and auto-select highest resolution (1080p60) if enabled
        if (data.levels && data.levels.length > 0) {
          let highestIdx = 0;
          let maxVal = -1;
          data.levels.forEach((lvl, idx) => {
            const val = (lvl.height || 0) * 10000000 + (lvl.bitrate || 0);
            if (val > maxVal) {
              maxVal = val;
              highestIdx = idx;
            }
          });

          if (autoMaxQuality && isMainStage) {
            hls.currentLevel = highestIdx;
            hls.startLevel = highestIdx;
          }

          const lvls = data.levels.map((lvl, idx) => ({
            id: idx,
            label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
          }));
          setQualityLevels(lvls);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Automatic network recovery without dropping the stream or unmounting
              console.warn(`[HLS] Network error on @${streamer}, recovering...`);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn(`[HLS] Media error on @${streamer}, recovering...`);
              hls.recoverMediaError();
              break;
            default:
              console.error(`[HLS] Fatal error on @${streamer}:`, data);
              setIsOffline(true);
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.muted = masterMuted || state.muted;
      video.play().catch(() => {});
    }
  }, [streamer, playerEngine, retryKey, liveInfo?.playback_url]);

  // Separate effect for adaptive bandwidth capping and quality selection without restarting HLS
  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls || !hls.levels || hls.levels.length === 0) return;

    if (isMainStage) {
      if (autoMaxQuality) {
        let highestIdx = 0;
        let maxVal = -1;
        hls.levels.forEach((lvl, idx) => {
          const val = (lvl.height || 0) * 10000000 + (lvl.bitrate || 0);
          if (val > maxVal) {
            maxVal = val;
            highestIdx = idx;
          }
        });
        hls.currentLevel = highestIdx;
      } else {
        hls.autoLevelCapping = -1;
      }
    } else {
      // Companions capped to moderate resolution to optimize CPU & network
      hls.autoLevelCapping = 1;
    }
  }, [isMainStage, autoMaxQuality]);

  // Ensure continuous playback on focus or layout transitions
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.paused) {
      video.play().catch(() => {});
    }
  }, [isMainStage]);

  // Audio adjustments directly on the Native <video> element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = Math.max(0, Math.min(1, effectiveVolume));
    video.muted = masterMuted || state.muted;

    // Web Audio Gain Boost (+200% Gain)
    if (state.isBoosted) {
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioContextClass();
          const source = ctx.createMediaElementSource(video);
          const gain = ctx.createGain();
          gain.gain.value = 2.5; // +150% gain boost
          source.connect(gain);
          gain.connect(ctx.destination);
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
          audioCtxRef.current = ctx;
          gainNodeRef.current = gain;
        } else if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = 2.5;
          if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {});
          }
        }
      } catch {
        // Handled gracefully
      }
    } else if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = 1.0;
    }
  }, [effectiveVolume, masterMuted, state.muted, state.isBoosted]);

  // Mouse Movement Handler (Auto-Hide Controls when idle & position-aware in fullscreen)
  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Guard against synthetic mousemove when mouse hasn't actually moved
    if (e.clientX === lastMousePos.current.x && e.clientY === lastMousePos.current.y) {
      return;
    }
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    // 2. In fullscreen: controls ONLY appear when mouse is near the bottom
    // ("tam ekranda kontroller mouse alta gelmediği sürece görünmemeli")
    const isFs = isCardFullscreen || Boolean(document.fullscreenElement);
    if (isFs) {
      const windowHeight = window.innerHeight;
      const isNearBottom = e.clientY >= windowHeight - 90;
      if (!isNearBottom) {
        if (showControls) setShowControls(false);
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        return;
      }
    }

    setShowControls(true);

    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  };

  const handleMouseLeave = () => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    setShowControls(false);
    lastMousePos.current = { x: -1, y: -1 };
  };

  // QoL: Mouse Wheel Volume Scroll
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const step = 0.05;
    const newVol = e.deltaY < 0 ? state.volume + step : state.volume - step;
    setStreamerVolume(streamer, newVol);
  };

  // Quality change
  const handleQualityChange = (val: string) => {
    if (!hlsRef.current) return;
    if (val === 'auto') {
      hlsRef.current.currentLevel = -1;
    } else {
      hlsRef.current.currentLevel = parseInt(val, 10);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!cardRef.current) return;
    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const isMutedParam = masterMuted || state.muted ? 'true' : 'false';

  return (
    <article
      ref={cardRef}
      className={`player-card ${isMainStage ? 'is-main' : 'is-companion'} ${
        state.isSolo ? 'is-solo' : ''
      } ${showControls ? 'show-controls' : ''} ${isCardFullscreen ? 'is-card-fullscreen' : ''}`}
      style={{ cursor: 'default' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest('.card-controls-bar')) return;
        if (isMainStage) {
          toggleFullscreen();
        } else {
          setMainFocus(streamer);
        }
      }}
    >
      {/* Top Badge */}
      <div className="card-top-bar">
        <div className="top-badge-left">
          <span
            className={`pulse-dot ${isChannelLive ? 'live' : 'offline'}`}
            title={isChannelLive ? 'Canlı Yayında' : 'Yayın Çevrimdışı'}
          ></span>
          <span style={{ fontWeight: 700 }}>@{streamer}</span>
        </div>

        {!isMainStage && (
          <button
            type="button"
            className="btn-make-focus"
            onClick={(e) => {
              e.stopPropagation();
              setMainFocus(streamer);
            }}
            title="Bu yayını ana odak sahnesine al"
          >
            ★ ODAK YAP
          </button>
        )}
      </div>

      {/* Video Content Wrap */}
      <div className="card-video-wrap" style={{ cursor: 'default' }}>
        {playerEngine === 'iframe' ? (
          <iframe
            src={`https://player.kick.com/${encodeURIComponent(
              streamer
            )}?autoplay=true&muted=${isMutedParam}`}
            allowFullScreen
            scrolling="no"
            allow="autoplay; fullscreen; picture-in-picture"
            title={`Kick Stream @${streamer}`}
          />
        ) : (!isChannelLive || isOffline) ? (
          /* Cinematic Eightborn Offline Stage */
          <div className="offline-stage-card">
            {/* Ambient Blurred Avatar Backdrop */}
            <div
              className="offline-stage-ambient"
              style={{
                backgroundImage: `url(${avatarUrl})`,
              }}
            />

            {/* Dark Vignette Overlay */}
            <div className="offline-stage-vignette" />

            {/* Foreground Content */}
            <div className="offline-stage-content">
              {/* Avatar with Status Ring */}
              <div className="offline-avatar-wrapper">
                <div className="offline-avatar-ring">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt={streamer}
                    className="offline-avatar-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(streamer)}&background=1e1e24&color=FFC526&size=120`;
                    }}
                  />
                </div>
                <span className="pulse-dot offline offline-avatar-badge" title="Yayın Çevrimdışı" />
              </div>

              {/* Streamer Name & Offline Pill */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span className="offline-streamer-name">
                  @{liveInfo?.displayName || streamer}
                </span>

                <div className="offline-status-pill">
                  <span className="pulse-dot offline" style={{ width: '7px', height: '7px' }} />
                  <span>Yayın Çevrimdışı</span>
                </div>

                {liveInfo?.title && (
                  <p className="offline-stream-title" title={liveInfo.title}>
                    {liveInfo.title}
                  </p>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="offline-actions-row">
                <button
                  type="button"
                  className="offline-btn"
                  onClick={() => setRetryKey((k) => k + 1)}
                  title="Yayın bağlantısını yeniden dene"
                >
                  <RefreshCw size={12} />
                  <span>Yeniden Dene</span>
                </button>

                <a
                  href={`https://kick.com/${encodeURIComponent(streamer)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="offline-btn offline-btn-gold"
                  title="Kick kanal sayfasını yeni sekmede aç"
                >
                  <ExternalLink size={12} />
                  <span>Kanal</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Native HTML5 Video */
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted={masterMuted || state.muted}
            style={{
              imageRendering: '-webkit-optimize-contrast' as any,
              pointerEvents: 'none',
              cursor: 'default',
            }}
          />
        )}

      </div>

      {/* Bottom Controls Bar */}
      <footer className="card-controls-bar">
        {/* Left: Solo, Mute, Volume, Quality, Boost */}
        <div className="ctrl-group">
          {/* SOLO Button */}
          <button
            type="button"
            className={`btn-ctrl btn-solo ${state.isSolo ? 'active' : ''}`}
            onClick={() => toggleSolo(streamer)}
            title="Yalnızca bu yayını dinle (Solo Modu)"
          >
            <span>SOLO</span>
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            className="btn-ctrl"
            onClick={() => toggleStreamerMute(streamer)}
            title="Sesi Aç / Kapat"
          >
            {state.muted || state.volume === 0 ? (
              <VolumeX size={13} color="#ef4444" />
            ) : (
              <Volume2 size={13} color="var(--eb-primary)" />
            )}
          </button>

          {/* Volume Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="range"
              min="0"
              max="100"
              value={state.muted ? 0 : Math.round(state.volume * 100)}
              onChange={(e) => setStreamerVolume(streamer, Number(e.target.value) / 100)}
              className="hud-slider"
              style={{ width: isMainStage ? '60px' : '45px' }}
              title="Ses Seviyesi (Tekerlekle de ayarlanabilir)"
            />
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
              {state.muted ? '0%' : `${Math.round(state.volume * 100)}%`}
            </span>
          </div>

          {/* QoL: Quality Selector */}
          {qualityLevels.length > 0 && isMainStage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title="Kalite">
              <Sliders size={11} color="var(--eb-muted)" />
              <select
                onChange={(e) => handleQualityChange(e.target.value)}
                style={{
                  background: '#141418',
                  border: '1px solid var(--eb-border)',
                  color: 'var(--eb-ink)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: '3px',
                  padding: '1px 3px',
                  outline: 'none',
                }}
              >
                <option value="auto">Auto</option>
                {qualityLevels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Boost (+200%) */}
          <button
            type="button"
            className={`btn-ctrl btn-boost ${state.isBoosted ? 'active' : ''}`}
            onClick={() => toggleStreamerBoost(streamer)}
            title="Ses Yükseltici (+200% Gain)"
          >
            <Zap size={11} />
            <span>BOOST</span>
          </button>
        </div>

        {/* Right: Companion Reorder, Chat, Fullscreen, Remove */}
        <div className="ctrl-group">
          {!isMainStage && (
            <>
              <button
                type="button"
                className="btn-ctrl"
                onClick={() => moveStreamerInSquad(activeSquadId, streamer, -1)}
                title="Yukarı Taşı"
              >
                <ChevronUp size={13} />
              </button>
              <button
                type="button"
                className="btn-ctrl"
                onClick={() => moveStreamerInSquad(activeSquadId, streamer, 1)}
                title="Aşağı Taşı"
              >
                <ChevronDown size={13} />
              </button>
            </>
          )}

          <button
            type="button"
            className="btn-ctrl"
            onClick={() => setChatOpen(true, streamer)}
            title="Kick Sohbetini Aç"
          >
            <MessageSquare size={13} />
          </button>

          <button
            type="button"
            className="btn-ctrl"
            onClick={toggleFullscreen}
            title="Bu Yayını Tam Ekran Yap"
          >
            <Maximize2 size={13} />
          </button>

          <button
            type="button"
            className="btn-ctrl"
            onClick={() => removeStreamerFromSquad(activeSquadId, streamer)}
            title="Ekipten Kaldır"
            style={{ color: '#ef4444' }}
          >
            <X size={13} />
          </button>
        </div>
      </footer>
    </article>
  );
}
