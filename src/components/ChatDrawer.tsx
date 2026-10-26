'use client';

import React from 'react';
import { useWatchpartyStore } from '@/store/useWatchpartyStore';
import { X, ExternalLink, MessageSquare } from 'lucide-react';

export function ChatDrawer() {
  const {
    isChatOpen,
    setChatOpen,
    activeChatStreamer,
    setActiveChatStreamer,
    getActiveSquad,
  } = useWatchpartyStore();

  const currentSquad = getActiveSquad();
  const streamers = currentSquad ? currentSquad.streamers : [];

  const effectiveStreamer = streamers.includes(activeChatStreamer)
    ? activeChatStreamer
    : streamers[0] || '';

  const popoutChat = () => {
    if (!effectiveStreamer) return;
    window.open(
      `https://kick.com/popout/${encodeURIComponent(effectiveStreamer)}/chat`,
      `KickChat_${effectiveStreamer}`,
      'width=380,height=680,resizable=yes,scrollbars=yes,status=no'
    );
  };

  return (
    <aside className={`chat-drawer ${isChatOpen ? 'open' : ''}`} aria-hidden={!isChatOpen}>
      {/* Header */}
      <div className="drawer-header">
        <div className="drawer-title">
          <MessageSquare size={16} color="var(--eb-primary)" />
          <span><span lang="en">Kick</span> Sohbet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="action-btn"
            onClick={popoutChat}
            title="Sohbeti Ayrı Pencerede Aç (Popout)"
            style={{ padding: '0 6px', height: '26px' }}
          >
            <ExternalLink size={13} />
          </button>
          <button
            className="action-btn"
            onClick={() => setChatOpen(false)}
            title="Kapat"
            style={{ padding: '0 6px', height: '26px' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Streamer Chat Tabs */}
      {streamers.length > 0 && (
        <nav className="chat-tabs-bar" aria-label="Sohbet Yayıncıları">
          {streamers.map((s) => (
            <button
              key={s}
              className={`chat-tab-btn ${s === effectiveStreamer ? 'active' : ''}`}
              onClick={() => setActiveChatStreamer(s)}
            >
              @{s}
            </button>
          ))}
        </nav>
      )}

      {/* Kick Chatroom Iframe */}
      <div style={{ flex: 1, position: 'relative', background: '#08080a' }}>
        {effectiveStreamer ? (
          <iframe
            src={`https://kick.com/popout/${encodeURIComponent(effectiveStreamer)}/chat`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={`Chat @${effectiveStreamer}`}
          />
        ) : (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--eb-muted)',
              fontSize: '12px',
            }}
          >
            Sohbet görüntülenecek yayıncı bulunamadı.
          </div>
        )}
      </div>
    </aside>
  );
}
