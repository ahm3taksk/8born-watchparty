'use client';

import React from 'react';
import { useWatchpartyStore } from '@/store/useWatchpartyStore';
import { PlayerCard } from './PlayerCard';
import { Shield, Plus, UserPlus } from 'lucide-react';

export function PlayersGrid() {
  const {
    getActiveSquad,
    mainFocusStreamer,
    activeLayout,
    setSidebarOpen,
    setRadarOpen,
    autoHideOffline,
    setAutoHideOffline,
    liveStatuses,
  } = useWatchpartyStore();

  const currentSquad = getActiveSquad();
  const rawStreamers = currentSquad ? currentSquad.streamers : [];

  // Filter out offline streamers if autoHideOffline is enabled
  const streamers =
    autoHideOffline && Object.keys(liveStatuses).length > 0
      ? rawStreamers.filter((s) => liveStatuses[s.toLowerCase()]?.isLive)
      : rawStreamers;

  // Empty State: Squad is empty
  if (rawStreamers.length === 0) {
    return (
      <main className="main-stage-container" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
            maxWidth: '380px',
            padding: '30px',
            background: 'var(--eb-surface-card)',
            border: '1px solid var(--eb-border-gold)',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ color: 'var(--eb-primary)', filter: 'drop-shadow(0 0 12px rgba(255,197,38,0.4))' }}>
            <Shield size={44} color="#FFC526" fill="rgba(255, 197, 38, 0.2)" strokeWidth={2.2} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.04em', color: 'var(--eb-ink)' }}>
              {currentSquad.name} Ekibi Boş
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--eb-muted)', marginTop: '6px' }}>
              Bu ekibe henüz yayıncı eklenmedi. Eightborn yayıncılarını ekleyerek çoklu izlemeye başlayın.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="action-btn action-btn-gold"
              onClick={() => setSidebarOpen(true)}
            >
              <Plus size={14} />
              <span>Yayıncı Ekle</span>
            </button>
            <button
              type="button"
              className="action-btn"
              onClick={() => setRadarOpen(true)}
            >
              <UserPlus size={14} />
              <span>Canlı Radar</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // All Offline State (when autoHideOffline is on and no one is live)
  if (streamers.length === 0 && rawStreamers.length > 0 && autoHideOffline) {
    return (
      <main className="main-stage-container" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '14px',
            maxWidth: '420px',
            padding: '28px',
            background: 'var(--eb-surface-card)',
            border: '1px solid var(--eb-border)',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ color: 'var(--eb-muted)' }}>
            <Shield size={38} color="#71717E" strokeWidth={2} />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--eb-ink)', letterSpacing: '0.05em' }}>
              {currentSquad.name} Ekibinde Canlı Yayın Yok
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--eb-muted)', marginTop: '6px', lineHeight: 1.5 }}>
              &quot;Çevrimdışıları Otomatik Gizle&quot; modu aktif. Bu ekipteki {rawStreamers.length} yayıncının hiçbiri şu an canlı değil.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              className="action-btn action-btn-gold"
              onClick={() => setAutoHideOffline(false)}
            >
              <span>Çevrimdışıları Göster ({rawStreamers.length})</span>
            </button>
            <button
              type="button"
              className="action-btn"
              onClick={() => setRadarOpen(true)}
            >
              <UserPlus size={13} />
              <span>Canlıları Tara</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Ensure main focus streamer is valid
  const effectiveMainStreamer = streamers.includes(mainFocusStreamer)
    ? mainFocusStreamer
    : streamers[0];

  // Companion streamers in current order
  const companionStreamers = streamers.filter((s) => s !== effectiveMainStreamer);
  const companionCount = companionStreamers.length;

  /**
   * ZERO-RELOAD FLAT CONTAINER ARCHITECTURE:
   * All player cards stay in the EXACT SAME React DOM parent container with stable keys.
   * When the user swaps a companion to main stage or changes layout:
   * React NEVER unmounts the PlayerCard or HTML5 <video> element!
   * The Hls instance never destroys and video streams continuously without reloading!
   */

  // Container style depending on active layout
  let containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
  };

  if (activeLayout === 'theater-left') {
    if (companionCount === 0) {
      containerStyle = {
        ...containerStyle,
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: '1fr',
        gap: '8px',
        padding: '8px',
      };
    } else {
      containerStyle = {
        ...containerStyle,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) clamp(300px, 24vw, 360px)',
        gridTemplateRows: `repeat(${companionCount}, minmax(0, 1fr))`,
        gap: '8px',
        padding: '8px',
      };
    }
  } else if (activeLayout === 'theater-top') {
    if (companionCount === 0) {
      containerStyle = {
        ...containerStyle,
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: '1fr',
        gap: '8px',
        padding: '8px',
      };
    } else {
      containerStyle = {
        ...containerStyle,
        display: 'grid',
        gridTemplateColumns: `repeat(${companionCount}, minmax(0, 1fr))`,
        gridTemplateRows: 'minmax(0, 1fr) 220px',
        gap: '8px',
        padding: '8px',
      };
    }
  } else if (activeLayout === 'grid-equal') {
    const total = streamers.length;
    let cols = '1fr 1fr';
    let rows = '1fr 1fr';

    if (total <= 1) {
      cols = '1fr';
      rows = '1fr';
    } else if (total === 2) {
      cols = '1fr 1fr';
      rows = '1fr';
    } else if (total === 3) {
      cols = '1fr 1fr';
      rows = '1.3fr 1fr';
    } else if (total === 4) {
      cols = '1fr 1fr';
      rows = '1fr 1fr';
    } else if (total <= 6) {
      cols = 'repeat(3, minmax(0, 1fr))';
      rows = '1fr 1fr';
    } else {
      cols = 'repeat(4, minmax(0, 1fr))';
      rows = '1fr 1fr';
    }

    containerStyle = {
      ...containerStyle,
      display: 'grid',
      gridTemplateColumns: cols,
      gridTemplateRows: rows,
      gap: '8px',
      padding: '8px',
    };
  } else if (activeLayout === 'single') {
    containerStyle = {
      ...containerStyle,
      display: 'grid',
      gridTemplateColumns: '1fr',
      gridTemplateRows: companionCount > 0 ? 'minmax(0, 1fr) 44px' : '1fr',
      gap: '8px',
      padding: '8px',
    };
  }

  return (
    <main className="main-stage-container">
      <div className={`players-flat-grid layout-${activeLayout}`} style={containerStyle}>
        {streamers.map((streamer, idx) => {
          const isMain = streamer === effectiveMainStreamer;
          const companionIdx = companionStreamers.indexOf(streamer);

          // Calculate CSS Grid area without unmounting
          let itemStyle: React.CSSProperties = {
            width: '100%',
            height: '100%',
            minWidth: 0,
            minHeight: 0,
          };

          if (activeLayout === 'theater-left') {
            if (isMain) {
              itemStyle = {
                ...itemStyle,
                gridColumn: 1,
                gridRow: companionCount > 0 ? `1 / span ${companionCount}` : 1,
              };
            } else {
              itemStyle = {
                ...itemStyle,
                gridColumn: 2,
                gridRow: companionIdx + 1,
              };
            }
          } else if (activeLayout === 'theater-top') {
            if (isMain) {
              itemStyle = {
                ...itemStyle,
                gridColumn: companionCount > 0 ? `1 / span ${companionCount}` : 1,
                gridRow: 1,
              };
            } else {
              itemStyle = {
                ...itemStyle,
                gridColumn: companionIdx + 1,
                gridRow: 2,
              };
            }
          } else if (activeLayout === 'grid-equal') {
            if (streamers.length === 3) {
              if (isMain) {
                itemStyle = {
                  ...itemStyle,
                  gridColumn: '1 / span 2',
                  gridRow: 1,
                };
              } else {
                itemStyle = {
                  ...itemStyle,
                  gridColumn: companionIdx === 0 ? 1 : 2,
                  gridRow: 2,
                };
              }
            } else {
              itemStyle = {
                ...itemStyle,
              };
            }
          } else if (activeLayout === 'single') {
            if (isMain) {
              itemStyle = {
                ...itemStyle,
                gridColumn: 1,
                gridRow: 1,
              };
            } else {
              // Hide companion video without unmounting so audio/Hls persists!
              itemStyle = {
                display: 'none',
              };
            }
          }

          return (
            <div key={streamer} style={itemStyle}>
              <PlayerCard
                streamer={streamer}
                isMainStage={isMain}
                index={idx}
              />
            </div>
          );
        })}

        {/* Single Layout: Bottom Quick Switcher Strip */}
        {activeLayout === 'single' && companionCount > 0 && (
          <div
            style={{
              gridColumn: 1,
              gridRow: 2,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              padding: '4px 0',
            }}
          >
            {streamers.map((s) => (
              <button
                key={s}
                type="button"
                className={`squad-tab-pill ${s === effectiveMainStreamer ? 'active' : ''}`}
                onClick={() => useWatchpartyStore.getState().setMainFocus(s)}
                style={{ height: '34px' }}
              >
                <span className="pulse-dot"></span>
                <span>@{s}</span>
                {s === effectiveMainStreamer && (
                  <span style={{ color: 'var(--eb-primary)', fontSize: '10px' }}>★ ODAK</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
