'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWatchpartyStore } from '@/store/useWatchpartyStore';
import { SquadIcon } from './SquadIcon';
import { DEFAULT_VERIFIED_STREAMERS } from '@/lib/constants';
import {
  X,
  Plus,
  Trash2,
  SlidersHorizontal,
  Layers,
  Keyboard,
  ShieldCheck,
  Zap,
  Settings,
  Eye,
  EyeOff,
  Sparkles,
  Radio,
  Share2,
  Download,
  Upload,
  Database,
  Play,
} from 'lucide-react';

export function Sidebar() {
  const {
    isSidebarOpen,
    setSidebarOpen,
    squads,
    activeSquadId,
    setActiveSquad,
    deleteSquad,
    addStreamerToSquad,
    removeStreamerFromSquad,
    playerEngine,
    setPlayerEngine,
    autoMaxQuality,
    toggleAutoMaxQuality,
    autoHideOffline,
    toggleAutoHideOffline,
    setSquadCreatorOpen,
    liveStatuses,
    getActiveSquad,
    activeLayout,
    addToast,
    exportBackupData,
    importBackupData,
  } = useWatchpartyStore();

  const currentSquad = getActiveSquad();
  const [selectedSquadId, setSelectedSquadId] = useState<string>(activeSquadId);
  const [quickStreamer, setQuickStreamer] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync if selected squad gets deleted
  useEffect(() => {
    if (!squads.some((s) => s.id === selectedSquadId)) {
      setSelectedSquadId(activeSquadId);
    }
  }, [squads, activeSquadId, selectedSquadId]);

  const editingSquad = squads.find((s) => s.id === selectedSquadId) || currentSquad;
  const isEditingActiveOnStage = editingSquad.id === activeSquadId;

  const handleCopyShareUrl = () => {
    try {
      const { streamers } = editingSquad;
      const url = new URL(window.location.origin + window.location.pathname);
      if (streamers.length > 0) {
        url.searchParams.set('streams', streamers.join(','));
      }
      url.searchParams.set('layout', activeLayout);
      navigator.clipboard.writeText(url.toString()).then(() => {
        addToast('İzleme linki panoya kopyalandı!');
      }).catch(() => {
        addToast('Link panoya kopyalanamadı');
      });
    } catch {
      addToast('Link oluşturulamadı');
    }
  };

  const handleExportBackup = () => {
    try {
      const json = exportBackupData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eightborn-watchparty-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Ekip yedeği JSON dosyası indirildi');
    } catch {
      addToast('Yedek dışa aktarılırken hata oluştu');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        importBackupData(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddStreamer = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickStreamer.trim().toLowerCase().replace('@', '');
    if (!clean) return;
    addStreamerToSquad(editingSquad.id, clean);
    setQuickStreamer('');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`side-drawer-backdrop ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Widened Tactical Drawer */}
      <aside className={`tactical-drawer ${isSidebarOpen ? 'open' : ''}`} aria-hidden={!isSidebarOpen}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <SlidersHorizontal size={16} color="var(--eb-primary)" />
            <span>Ekip & Ayarlar</span>
          </div>
          <button
            type="button"
            className="action-btn"
            onClick={() => setSidebarOpen(false)}
            title="Kapat"
            style={{ padding: '0 6px', height: '28px' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="drawer-content">
          {/* Section 1: Active Squad Streamers with Avatars & Live Status */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SquadIcon name={editingSquad.icon} size={15} color={editingSquad.color} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--eb-primary)', letterSpacing: '0.05em' }}>
                  {editingSquad.name} ({editingSquad.streamers.length} Yayıncı)
                </span>
              </div>

              {isEditingActiveOnStage ? (
                <span
                  style={{
                    fontSize: '10px',
                    color: '#22c55e',
                    background: 'rgba(34, 197, 94, 0.12)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Bu ekip şu an ana sahnede canlı izleniyor"
                >
                  <span className="pulse-dot live" style={{ width: '5px', height: '5px' }} />
                  Ekranda
                </span>
              ) : (
                <button
                  type="button"
                  className="action-btn action-btn-gold"
                  onClick={() => {
                    setActiveSquad(editingSquad.id);
                    addToast(`${editingSquad.name} sahneye yüklendi`);
                  }}
                  style={{ height: '24px', padding: '0 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Bu ekibi ana ekranda izlemeye başla"
                >
                  <Play size={11} fill="currentColor" />
                  <span>Sahneye Al</span>
                </button>
              )}
            </div>

            {/* Quick Add Streamer Form */}
            <form onSubmit={handleAddStreamer} style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Kick kullanıcı adı (örn: rraenee)..."
                value={quickStreamer}
                onChange={(e) => setQuickStreamer(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(21, 21, 26, 0.8)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: '4px',
                  padding: '7px 10px',
                  fontSize: '12px',
                  color: 'var(--eb-ink)',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <button
                type="submit"
                className="action-btn action-btn-gold"
                style={{ height: '32px' }}
              >
                <Plus size={14} />
                <span>Ekle</span>
              </button>
            </form>

            {/* Streamers Grid with Profile Pictures & Live Status (Compact Boxes) */}
            {editingSquad.streamers.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  background: 'rgba(21, 21, 26, 0.5)',
                  border: '1px dashed var(--eb-border)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: 'var(--eb-muted)',
                }}
              >
                Bu ekipte henüz yayıncı yok. Yukarıdan ekleyebilirsin.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))',
                  gap: '6px',
                  maxHeight: '230px',
                  overflowY: 'auto',
                  padding: '2px',
                }}
              >
                {editingSquad.streamers.map((streamer) => {
                  const liveInfo = liveStatuses[streamer.toLowerCase()];
                  const isLive = liveInfo?.isLive ?? false;
                  const picUrl =
                    liveInfo?.profilePicUrl ||
                    liveInfo?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(streamer)}&background=1e1e24&color=FFC526&size=80`;

                  return (
                    <div
                      key={streamer}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        background: 'rgba(21, 21, 26, 0.75)',
                        border: '1px solid var(--eb-border)',
                        borderRadius: '5px',
                        gap: '6px',
                        minWidth: 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                        {/* Avatar */}
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: `1.5px solid ${isLive ? '#22c55e' : 'rgba(255, 255, 255, 0.15)'}`,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={picUrl}
                            alt={streamer}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(streamer)}&background=1e1e24&color=FFC526&size=80`;
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--eb-ink)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={`@${streamer}`}
                          >
                            @{streamer}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className={`pulse-dot ${isLive ? 'live' : 'offline'}`} style={{ width: '4px', height: '4px' }} />
                            <span
                              style={{
                                fontSize: '9px',
                                fontFamily: 'var(--font-mono)',
                                color: isLive ? '#22c55e' : 'var(--eb-faint)',
                                fontWeight: isLive ? 700 : 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isLive ? `${liveInfo?.viewerCount ? liveInfo.viewerCount.toLocaleString() : 'Canlı'}` : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => removeStreamerFromSquad(editingSquad.id, streamer)}
                        style={{ height: '22px', width: '22px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}
                        title="Kaldır"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 2: Squads Switcher & Creator */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--eb-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} color="var(--eb-primary)" />
                <span>Ekipler & Çeteler</span>
              </div>
              <button
                type="button"
                className="action-btn action-btn-gold"
                onClick={() => setSquadCreatorOpen(true)}
                style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
              >
                <Plus size={13} />
                <span>Yeni Ekip Oluştur</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {squads.map((sq) => {
                const liveCount = sq.streamers.filter((s) => liveStatuses[s.toLowerCase()]?.isLive).length;
                const isActive = sq.id === activeSquadId;
                const isSelected = sq.id === selectedSquadId;

                return (
                  <div
                    key={sq.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: isSelected ? 'rgba(255, 197, 38, 0.08)' : 'rgba(21, 21, 26, 0.6)',
                      borderTop: `1px solid ${isSelected ? 'var(--eb-border-gold)' : 'var(--eb-border)'}`,
                      borderRight: `1px solid ${isSelected ? 'var(--eb-border-gold)' : 'var(--eb-border)'}`,
                      borderBottom: `1px solid ${isSelected ? 'var(--eb-border-gold)' : 'var(--eb-border)'}`,
                      borderLeft: `3px solid ${sq.color || '#FFC526'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => setSelectedSquadId(sq.id)}
                    title={`${sq.name} ekibini düzenlemek için tıkla`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <SquadIcon name={sq.icon} size={15} color={sq.color} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? 'var(--eb-primary)' : 'var(--eb-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sq.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {/* Live Counter Badge */}
                      <span
                        className={`squad-count-badge ${liveCount > 0 ? 'has-live' : ''}`}
                        title={`${sq.streamers.length} yayıncı, ${liveCount} canlı`}
                      >
                        {liveCount > 0 && <span className="pulse-dot live" style={{ width: '5px', height: '5px' }} />}
                        {liveCount > 0 ? `${liveCount}/${sq.streamers.length} Canlı` : `${sq.streamers.length} Üye`}
                      </span>

                      {/* On-Stage Indicator or Switch Watchparty Button */}
                      {isActive ? (
                        <span
                          style={{
                            fontSize: '9px',
                            color: '#22c55e',
                            background: 'rgba(34, 197, 94, 0.12)',
                            border: '1px solid rgba(34, 197, 94, 0.25)',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            fontWeight: 700,
                          }}
                        >
                          Ekranda
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="action-btn action-btn-gold"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSquad(sq.id);
                            setSelectedSquadId(sq.id);
                            addToast(`${sq.name} sahneye yüklendi`);
                          }}
                          style={{ height: '22px', padding: '0 6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}
                          title="Bu ekibi ana ekranda izlemeye başla"
                        >
                          <Play size={9} fill="currentColor" />
                          <span>İzle</span>
                        </button>
                      )}

                      {!sq.isDefault && (
                        <button
                          type="button"
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSquad(sq.id);
                          }}
                          style={{ height: '22px', padding: '0 4px', color: '#ef4444' }}
                          title="Ekibi Sil"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 3: Smart Playback & Quality Settings */}
          <section>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--eb-ink)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Settings size={14} color="var(--eb-primary)" />
              <span>YAYIN & PERFORMANS AYARLARI</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Auto Max Quality Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  background: 'rgba(21, 21, 26, 0.6)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
                onClick={toggleAutoMaxQuality}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--eb-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={13} color="var(--eb-primary)" />
                    <span>Otomatik En Yüksek Kalite (1080p60)</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--eb-muted)', marginTop: '2px' }}>
                    Odak sahnesindeki yayını otomatik olarak en net 1080p kalitesinde başlatır.
                  </div>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '10px',
                    background: autoMaxQuality ? '#22c55e' : 'rgba(255, 255, 255, 0.15)',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: '2px',
                      left: autoMaxQuality ? '18px' : '2px',
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
              </div>

              {/* Auto Hide Offline Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  background: 'rgba(21, 21, 26, 0.6)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
                onClick={toggleAutoHideOffline}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--eb-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {autoHideOffline ? <EyeOff size={13} color="#22c55e" /> : <Eye size={13} color="var(--eb-muted)" />}
                    <span>Çevrimdışı Yayıncıları Otomatik Gizle</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--eb-muted)', marginTop: '2px' }}>
                    Yalnızca aktif olarak canlı yayında olan yayıncıları sahnede gösterir.
                  </div>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '10px',
                    background: autoHideOffline ? '#22c55e' : 'rgba(255, 255, 255, 0.15)',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: '2px',
                      left: autoHideOffline ? '18px' : '2px',
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Player Engine Selector */}
          <section>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--eb-ink)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="var(--eb-primary)" />
              <span>OYNATICI MOTORU</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 10px',
                  background: playerEngine === 'hls' ? 'rgba(255, 197, 38, 0.1)' : 'rgba(21, 21, 26, 0.5)',
                  border: `1px solid ${playerEngine === 'hls' ? 'var(--eb-border-gold)' : 'var(--eb-border)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="playerEngine"
                  checked={playerEngine === 'hls'}
                  onChange={() => setPlayerEngine('hls')}
                  style={{ marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--eb-ink)' }}>
                    Native HLS Player (Varsayılan & Önerilen)
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--eb-muted)', marginTop: '2px' }}>
                    HTML5 video doğrudan oynatma, Web Audio API (+%200 Boost), Solo mikseri, sıfır sunucu yükü.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 10px',
                  background: playerEngine === 'iframe' ? 'rgba(255, 197, 38, 0.1)' : 'rgba(21, 21, 26, 0.5)',
                  border: `1px solid ${playerEngine === 'iframe' ? 'var(--eb-border-gold)' : 'var(--eb-border)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="playerEngine"
                  checked={playerEngine === 'iframe'}
                  onChange={() => setPlayerEngine('iframe')}
                  style={{ marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--eb-ink)' }}>
                    Resmi Kick Embed (Iframe Modu)
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--eb-muted)', marginTop: '2px' }}>
                    Kick standart gömülü oynatıcı.
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Section 5: Data Sharing & JSON Backup */}
          <section>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--eb-ink)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={14} color="var(--eb-primary)" />
              <span>Veri & Yedekleme</span>
            </div>

            {/* Hidden File Input for Import */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Copy Shareable URL Button */}
              <button
                type="button"
                className="action-btn"
                onClick={handleCopyShareUrl}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  height: 'auto',
                  background: 'rgba(21, 21, 26, 0.7)',
                  border: '1px solid var(--eb-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Share2 size={14} color="var(--eb-primary)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--eb-ink)' }}>
                      İzleme Linkini Kopyala
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--eb-muted)' }}>
                      Aktif yayıncıları ve düzeni arkadaşlarınla paylaş
                    </div>
                  </div>
                </div>
              </button>

              {/* Export JSON Button */}
              <button
                type="button"
                className="action-btn"
                onClick={handleExportBackup}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  height: 'auto',
                  background: 'rgba(21, 21, 26, 0.7)',
                  border: '1px solid var(--eb-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={14} color="var(--eb-primary)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--eb-ink)' }}>
                      Ekipleri Dışa Aktar (JSON İndir)
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--eb-muted)' }}>
                      Tüm özel ekiplerini dosya olarak yedekle
                    </div>
                  </div>
                </div>
              </button>

              {/* Import JSON Button */}
              <button
                type="button"
                className="action-btn"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  height: 'auto',
                  background: 'rgba(21, 21, 26, 0.7)',
                  border: '1px solid var(--eb-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={14} color="var(--eb-primary)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--eb-ink)' }}>
                      Yedekten İçe Aktar (JSON Yükle)
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--eb-muted)' }}>
                      Daha önce kaydettiğin yedek dosyasını yükle
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* Section 6: Keyboard Shortcuts Reference */}
          <section>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--eb-ink)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Keyboard size={14} color="var(--eb-primary)" />
              <span>Klavye Kısayolları</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: 'var(--eb-muted)' }}>
              <div style={{ background: 'rgba(21, 21, 26, 0.5)', padding: '6px 8px', borderRadius: '4px' }}>
                <b style={{ color: 'var(--eb-primary)' }}>1 - 6:</b> Yayını Solo Yap
              </div>
              <div style={{ background: 'rgba(21, 21, 26, 0.5)', padding: '6px 8px', borderRadius: '4px' }}>
                <b style={{ color: 'var(--eb-primary)' }}>M:</b> Odak Yayını Sustur
              </div>
              <div style={{ background: 'rgba(21, 21, 26, 0.5)', padding: '6px 8px', borderRadius: '4px' }}>
                <b style={{ color: 'var(--eb-primary)' }}>F:</b> Odak Yayın Tam Ekran
              </div>
              <div style={{ background: 'rgba(21, 21, 26, 0.5)', padding: '6px 8px', borderRadius: '4px' }}>
                <b style={{ color: 'var(--eb-primary)' }}>C:</b> Kick Sohbeti Aç
              </div>
              <div style={{ background: 'rgba(21, 21, 26, 0.5)', padding: '6px 8px', borderRadius: '4px' }}>
                <b style={{ color: 'var(--eb-primary)' }}>R:</b> Canlı Radar
              </div>
              <div style={{ background: 'rgba(21, 21, 26, 0.5)', padding: '6px 8px', borderRadius: '4px' }}>
                <b style={{ color: 'var(--eb-primary)' }}>Çift Tık:</b> Tam Ekran / Odak
              </div>
            </div>
          </section>

          {/* Section 6: Legal & Community Notice */}
          <section style={{ borderTop: '1px solid var(--eb-border)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--eb-faint)', fontSize: '10px' }}>
              <ShieldCheck size={14} color="var(--eb-primary)" />
              <span>Kâr Amacı Gütmeyen Topluluk Projesi</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--eb-faint)', marginTop: '4px', lineHeight: 1.5 }}>
              Bu platform EightbornV ve Kick.com ile resmi olarak bağlantılı değildir. Tüm video hakları Kick ve yayıncılara aittir.
            </p>
          </section>
        </div>
      </aside>
    </>
  );
}
