'use client';

import React, { useEffect, useState } from 'react';
import { useWatchpartyStore } from '@/store/useWatchpartyStore';
import { StreamerInfo } from '@/lib/types';
import { DEFAULT_VERIFIED_STREAMERS } from '@/lib/constants';
import { fetchMultipleKickChannelsClient } from '@/lib/kick-client';
import { Radar, RefreshCw, X, Play, Plus, Search, UserCheck, Radio, Check, Link as LinkIcon } from 'lucide-react';

type RadarTab = 'verified' | 'scanner' | 'manual';

export function RadarModal() {
  const {
    isRadarOpen,
    setRadarOpen,
    squads,
    activeSquadId,
    addStreamerToSquad,
    setMainFocus,
    addToast,
  } = useWatchpartyStore();

  const [activeTab, setActiveTab] = useState<RadarTab>('verified');
  const [channels, setChannels] = useState<StreamerInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [targetSquadId, setTargetSquadId] = useState<string>(activeSquadId);

  // Scanner Tab State
  const [scannerKeyword, setScannerKeyword] = useState<string>('Eightborn');

  // Manual Add Tab State
  const [manualInput, setManualInput] = useState<string>('');

  useEffect(() => {
    setTargetSquadId(activeSquadId);
  }, [activeSquadId]);

  const fetchLiveStatus = async () => {
    setLoading(true);
    try {
      const names = DEFAULT_VERIFIED_STREAMERS.map((s) => s.username);

      // 1. Direct client fetch to bypass Vercel datacenter IP block
      const clientData = await fetchMultipleKickChannelsClient(names);
      let list = Object.values(clientData);

      // 2. Fallback to server route if client fetch empty
      if (list.length === 0) {
        const namesParam = names.join(',');
        const res = await fetch(`/api/kick/channels?names=${encodeURIComponent(namesParam)}`);
        if (res.ok) {
          list = await res.json();
        }
      }

      // Sort live streamers first, then by viewer count
      list.sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        return (b.viewers || 0) - (a.viewers || 0);
      });
      setChannels(list);
    } catch (e) {
      console.warn('Radar fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRadarOpen) {
      fetchLiveStatus();
    }
  }, [isRadarOpen]);

  if (!isRadarOpen) return null;

  const liveCount = channels.filter((c) => c.isLive).length;
  const currentTargetSquad = squads.find((s) => s.id === targetSquadId) || squads[0];

  // Tab 1: Verified Streamers Filtered
  const filteredVerified = channels.filter((c) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase().trim();
    return (
      c.username.toLowerCase().includes(q) ||
      c.displayName.toLowerCase().includes(q) ||
      (c.title && c.title.toLowerCase().includes(q))
    );
  });

  // Tab 2: Scanner Matches
  const filteredScanner = channels.filter((c) => {
    if (!c.isLive) return false;
    if (!scannerKeyword.trim()) return true;
    const k = scannerKeyword.toLowerCase().trim();
    return (
      (c.title && c.title.toLowerCase().includes(k)) ||
      c.username.toLowerCase().includes(k) ||
      c.displayName.toLowerCase().includes(k) ||
      (c.category && c.category.toLowerCase().includes(k))
    );
  });

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    let clean = manualInput.trim().toLowerCase();
    if (clean.includes('kick.com/')) {
      clean = clean.split('kick.com/')[1].split('/')[0].split('?')[0];
    }
    clean = clean.replace('@', '').trim();
    if (!clean) return;

    addStreamerToSquad(targetSquadId, clean);
    setManualInput('');
    addToast(`@${clean} "${currentTargetSquad.name}" ekibine eklendi`);
  };

  const handleQuickWatch = (username: string) => {
    // Add to target squad if not present
    if (!currentTargetSquad.streamers.includes(username.toLowerCase())) {
      addStreamerToSquad(targetSquadId, username);
    }
    setMainFocus(username);
    setRadarOpen(false);
    addToast(`@${username} odak yayın yapıldı`);
  };

  return (
    <div className="modal-overlay" onClick={() => setRadarOpen(false)}>
      <div className="modal-box" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <Radar size={18} color="var(--eb-primary)" />
            <span>Yayıncı Merkezi & Canlı Radar</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '3px',
                padding: '2px 7px',
              }}
            >
              {liveCount} CANLI
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="action-btn"
              onClick={fetchLiveStatus}
              title="Yenile"
              disabled={loading}
              style={{ height: '28px', padding: '0 8px' }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Taranıyor...' : 'Yenile'}</span>
            </button>
            <button
              type="button"
              className="action-btn"
              onClick={() => setRadarOpen(false)}
              title="Kapat"
              style={{ height: '28px', padding: '0 8px' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Eklentideki 3 Sekmeli Sistem) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 14px',
            background: '#121216',
            borderBottom: '1px solid var(--eb-border)',
          }}
        >
          <button
            type="button"
            className={`action-btn ${activeTab === 'verified' ? 'action-btn-gold' : ''}`}
            onClick={() => setActiveTab('verified')}
            style={{ fontSize: '11px', height: '28px' }}
          >
            <span>Kayıtlı Yayıncılar</span>
          </button>
          <button
            type="button"
            className={`action-btn ${activeTab === 'scanner' ? 'action-btn-gold' : ''}`}
            onClick={() => setActiveTab('scanner')}
            style={{ fontSize: '11px', height: '28px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <span className="pulse-dot live" />
            <span>Canlı Radar</span>
          </button>
          <button
            type="button"
            className={`action-btn ${activeTab === 'manual' ? 'action-btn-gold' : ''}`}
            onClick={() => setActiveTab('manual')}
            style={{ fontSize: '11px', height: '28px' }}
          >
            <span>Manuel Ekle</span>
          </button>

          {/* Target Squad Selector (Right Side) */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--eb-faint)' }}>Hedef Ekip:</span>
            <select
              value={targetSquadId}
              onChange={(e) => setTargetSquadId(e.target.value)}
              style={{
                background: '#18181f',
                border: '1px solid var(--eb-border-gold)',
                color: 'var(--eb-primary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                padding: '3px 8px',
                borderRadius: '4px',
                outline: 'none',
              }}
            >
              {squads.map((sq) => (
                <option key={sq.id} value={sq.id}>
                  {sq.name} ({sq.streamers.length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body */}
        <div className="drawer-content" style={{ maxHeight: '68vh' }}>
          {/* TAB 1: Verified Streamers */}
          {activeTab === 'verified' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  color="var(--eb-muted)"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Eightborn yayıncılarında ara (kullanıcı adı, başlık)..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#18181e',
                    border: '1px solid var(--eb-border)',
                    borderRadius: '6px',
                    padding: '8px 12px 8px 32px',
                    fontSize: '12px',
                    color: 'var(--eb-ink)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Streamers Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredVerified.map((chan) => {
                  const isInTarget = currentTargetSquad.streamers.includes(chan.username.toLowerCase());
                  return (
                    <div
                      key={chan.username}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: chan.isLive ? 'rgba(21, 21, 26, 0.95)' : 'rgba(15, 15, 18, 0.5)',
                        border: `1px solid ${chan.isLive ? 'var(--eb-border-gold)' : 'var(--eb-border)'}`,
                        borderRadius: '6px',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      {/* Left: Avatar + Details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {chan.avatar ? (
                            <img
                              src={chan.avatar}
                              alt={chan.username}
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                border: chan.isLive ? '2px solid #22c55e' : '1px solid var(--eb-border)',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: '#1c1c22',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--eb-primary)',
                                fontWeight: 700,
                              }}
                            >
                              {chan.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`pulse-dot ${chan.isLive ? 'live' : 'offline'}`}
                            style={{
                              position: 'absolute',
                              bottom: '-1px',
                              right: '-1px',
                              border: '1.5px solid #0E0E11',
                            }}
                          />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--eb-ink)' }}>
                              @{chan.username}
                            </span>
                            {chan.isLive ? (
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontFamily: 'var(--font-mono)',
                                  background: 'rgba(34, 197, 94, 0.15)',
                                  color: '#22c55e',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  fontWeight: 700,
                                }}
                              >
                                {chan.viewers ? `${chan.viewers.toLocaleString('tr-TR')} izleyici` : 'CANLI'}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontFamily: 'var(--font-mono)',
                                  color: 'var(--eb-faint)',
                                  background: 'rgba(255,255,255,0.04)',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                }}
                              >
                                Çevrimdışı
                              </span>
                            )}
                          </div>

                          {chan.isLive && chan.title && (
                            <p
                              style={{
                                fontSize: '11px',
                                color: 'var(--eb-muted)',
                                marginTop: '3px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {chan.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '10px' }}>
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => handleQuickWatch(chan.username)}
                          title="Hemen İzle & Sahneye Al"
                          style={{ height: '28px', padding: '0 9px' }}
                        >
                          <Play size={12} color="var(--eb-primary)" />
                          <span>İzle</span>
                        </button>

                        <button
                          type="button"
                          className={`action-btn ${isInTarget ? '' : 'action-btn-gold'}`}
                          onClick={() => addStreamerToSquad(targetSquadId, chan.username)}
                          disabled={isInTarget}
                          title={isInTarget ? 'Bu ekipte zaten ekli' : `${currentTargetSquad.name} ekibine ekle`}
                          style={{ height: '28px', padding: '0 9px' }}
                        >
                          {isInTarget ? (
                            <>
                              <Check size={12} />
                              <span>Ekli</span>
                            </>
                          ) : (
                            <>
                              <Plus size={12} />
                              <span>Ekibe Ekle</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Live Title Scanner */}
          {activeTab === 'scanner' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Filtre kelimesi (örn: Eightborn, Delisi, Memur, Rol)..."
                  value={scannerKeyword}
                  onChange={(e) => setScannerKeyword(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#18181e',
                    border: '1px solid var(--eb-border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--eb-ink)',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  className="action-btn action-btn-gold"
                  onClick={fetchLiveStatus}
                  style={{ height: '34px', padding: '0 14px' }}
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  <span>Şimdi Tara</span>
                </button>
              </div>

              {filteredScanner.length === 0 ? (
                <div style={{ padding: '35px 20px', textAlign: 'center', color: 'var(--eb-muted)', fontSize: '13px' }}>
                  <Radio size={32} color="var(--eb-faint)" style={{ margin: '0 auto 10px' }} />
                  <p>&quot;{scannerKeyword}&quot; filtresine uyan şu an aktif canlı yayıncı bulunamadı.</p>
                  <p style={{ fontSize: '11px', color: 'var(--eb-faint)', marginTop: '4px' }}>
                    Yayıncılar açıldıkça radar otomatik güncellenir.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredScanner.map((chan) => (
                    <div
                      key={chan.username}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'rgba(21, 21, 26, 0.95)',
                        border: '1px solid var(--eb-border-gold)',
                        borderRadius: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        {chan.avatar && (
                          <img
                            src={chan.avatar}
                            alt={chan.username}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--eb-ink)' }}>
                              @{chan.username}
                            </span>
                            <span
                              style={{
                                fontSize: '9px',
                                fontFamily: 'var(--font-mono)',
                                background: 'rgba(34, 197, 94, 0.15)',
                                color: '#22c55e',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                fontWeight: 700,
                              }}
                            >
                              {chan.viewers ? `${chan.viewers.toLocaleString('tr-TR')} izleyici` : 'CANLI'}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: '11px',
                              color: 'var(--eb-muted)',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {chan.title}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => handleQuickWatch(chan.username)}
                          style={{ height: '28px', padding: '0 8px' }}
                        >
                          <Play size={12} color="var(--eb-primary)" />
                          <span>İzle</span>
                        </button>
                        <button
                          type="button"
                          className="action-btn action-btn-gold"
                          onClick={() => addStreamerToSquad(targetSquadId, chan.username)}
                          style={{ height: '28px', padding: '0 8px' }}
                        >
                          <Plus size={12} />
                          <span>Ekle</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Manual Add */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--eb-primary)',
                    marginBottom: '6px',
                  }}
                >
                  <span lang="en">Kick</span> Kullanıcı Adı veya Kanal Linki
                </label>
                <div style={{ position: 'relative' }}>
                  <LinkIcon
                    size={14}
                    color="var(--eb-muted)"
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Örn: rraenee veya https://kick.com/rraenee"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#18181e',
                      border: '1px solid var(--eb-border)',
                      borderRadius: '6px',
                      padding: '9px 12px 9px 32px',
                      fontSize: '13px',
                      color: 'var(--eb-ink)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--eb-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Hedef Ekip
                </label>
                <select
                  value={targetSquadId}
                  onChange={(e) => setTargetSquadId(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#18181e',
                    border: '1px solid var(--eb-border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--eb-ink)',
                    outline: 'none',
                  }}
                >
                  {squads.map((sq) => (
                    <option key={sq.id} value={sq.id}>
                      {sq.name} ({sq.streamers.length} Yayıncı)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  className="action-btn action-btn-gold"
                  style={{ height: '34px', padding: '0 18px', fontSize: '12px' }}
                >
                  <Plus size={14} />
                  <span>Ekibe Ekle</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
