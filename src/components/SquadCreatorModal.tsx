'use client';

import React, { useState } from 'react';
import { useWatchpartyStore } from '@/store/useWatchpartyStore';
import { SquadIcon } from './SquadIcon';
import { SELECTABLE_SQUAD_ICONS, SELECTABLE_SQUAD_COLORS, DEFAULT_VERIFIED_STREAMERS } from '@/lib/constants';
import { Squad } from '@/lib/types';
import { X, Plus, Shield, Check } from 'lucide-react';

export function SquadCreatorModal() {
  const {
    isSquadCreatorOpen,
    setSquadCreatorOpen,
    createSquad,
    setActiveSquad,
    fetchStreamerProfile,
    knownStreamers,
    addStreamerToPool,
    liveStatuses,
  } = useWatchpartyStore();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('shield');
  const [selectedColor, setSelectedColor] = useState('#FFC526');
  const [selectedStreamers, setSelectedStreamers] = useState<string[]>(['egoistpati', 'rionamy']);
  const [customStreamerInput, setCustomStreamerInput] = useState('');

  if (!isSquadCreatorOpen) return null;

  const toggleStreamer = (username: string) => {
    const clean = username.toLowerCase().trim();
    if (selectedStreamers.includes(clean)) {
      setSelectedStreamers((prev) => prev.filter((s) => s !== clean));
    } else {
      setSelectedStreamers((prev) => [...prev, clean]);
      fetchStreamerProfile(clean);
    }
  };

  const handleAddCustomStreamer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customStreamerInput.toLowerCase().trim().replace('@', '');
    if (!clean) return;
    if (!selectedStreamers.includes(clean)) {
      setSelectedStreamers((prev) => [...prev, clean]);
    }
    addStreamerToPool(clean);
    fetchStreamerProfile(clean);
    setCustomStreamerInput('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    let finalStreamers = [...selectedStreamers];
    const pendingCustom = customStreamerInput.toLowerCase().trim().replace('@', '');
    if (pendingCustom) {
      if (!finalStreamers.includes(pendingCustom)) {
        finalStreamers.push(pendingCustom);
      }
      addStreamerToPool(pendingCustom);
      fetchStreamerProfile(pendingCustom);
    }

    const id = 'squad_' + Math.random().toString(36).substring(2, 9);
    const newSquad: Squad = {
      id,
      name: cleanName,
      icon: selectedIcon,
      color: selectedColor,
      streamers: finalStreamers,
    };

    createSquad(newSquad);
    setActiveSquad(id);
    setSquadCreatorOpen(false);

    // Reset form
    setName('');
    setSelectedIcon('shield');
    setSelectedColor('#FFC526');
    setSelectedStreamers(['egoistpati', 'rionamy']);
    setCustomStreamerInput('');
  };

  return (
    <div className="modal-overlay" onClick={() => setSquadCreatorOpen(false)}>
      <div className="modal-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <Shield size={18} color="var(--eb-primary)" />
            <span>Yeni Ekip Oluştur</span>
          </div>
          <button
            type="button"
            className="action-btn"
            onClick={() => setSquadCreatorOpen(false)}
            title="Kapat"
            style={{ height: '28px', padding: '0 8px' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleCreate} className="drawer-content" style={{ maxHeight: '75vh', gap: '20px' }}>
          {/* 1. Squad Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'var(--eb-primary)',
                marginBottom: '6px',
              }}
            >
              Ekip / Gang / Departman Adı
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Los Vagos, Lost MC, MRPD, EMS..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="hud-input"
              style={{
                width: '100%',
                background: '#18181e',
                border: '1px solid var(--eb-border)',
                borderRadius: '6px',
                padding: '9px 12px',
                fontSize: '13px',
                color: 'var(--eb-ink)',
                outline: 'none',
              }}
            />
          </div>

          {/* 2. Visual Icon Selector Grid */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'var(--eb-primary)',
                marginBottom: '6px',
              }}
            >
              Ekip Simgesi (Simge Seçimi)
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '6px',
                maxHeight: '160px',
                overflowY: 'auto',
                padding: '4px',
                background: '#0d0d10',
                border: '1px solid var(--eb-border)',
                borderRadius: '6px',
              }}
            >
              {SELECTABLE_SQUAD_ICONS.map((item) => {
                const isSelected = selectedIcon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIcon(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      background: isSelected ? 'rgba(255, 197, 38, 0.15)' : '#141418',
                      border: isSelected ? '1px solid var(--eb-primary)' : '1px solid var(--eb-border)',
                      color: isSelected ? 'var(--eb-primary)' : 'var(--eb-muted)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <SquadIcon name={item.id} size={15} color={isSelected ? 'var(--eb-primary)' : 'var(--eb-muted)'} />
                    <span style={{ fontSize: '11px', fontWeight: isSelected ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label.split('/')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Visual Color Swatch Row */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'var(--eb-primary)',
                marginBottom: '6px',
              }}
            >
              Tema Rengi
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SELECTABLE_SQUAD_COLORS.map((c) => {
                const isSelected = selectedColor === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    title={c.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      background: isSelected ? 'rgba(255,255,255,0.1)' : '#141418',
                      border: isSelected ? `2px solid ${c.hex}` : '1px solid var(--eb-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: c.hex,
                        boxShadow: isSelected ? `0 0 8px ${c.hex}` : 'none',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: isSelected ? 'var(--eb-ink)' : 'var(--eb-muted)', fontWeight: isSelected ? 700 : 500 }}>
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Streamer Selector Chips (Unified Streamer Pool) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: 'var(--eb-primary)',
                }}
              >
                Yayıncı Havuzundan Seç ({selectedStreamers.length} Seçili)
              </label>
              <span style={{ fontSize: '10px', color: 'var(--eb-muted)', fontFamily: 'var(--font-mono)' }}>
                Havuz: {Array.from(new Set([...knownStreamers, ...selectedStreamers])).length} Yayıncı
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '140px', overflowY: 'auto', padding: '2px', marginBottom: '10px' }}>
              {Array.from(new Set([...knownStreamers, ...selectedStreamers])).map((st) => {
                const isIncluded = selectedStreamers.includes(st);
                const liveInfo = liveStatuses[st.toLowerCase()];
                const isLive = liveInfo?.isLive ?? false;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => toggleStreamer(st)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 9px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      background: isIncluded ? 'rgba(255, 197, 38, 0.18)' : '#141418',
                      border: isIncluded ? '1px solid var(--eb-primary)' : '1px solid var(--eb-border)',
                      color: isIncluded ? 'var(--eb-primary)' : 'var(--eb-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <span className={`pulse-dot ${isLive ? 'live' : 'offline'}`} style={{ width: '5px', height: '5px' }} />
                    {isIncluded && <Check size={11} strokeWidth={3} />}
                    <span>@{st}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Streamer Add with Enter Key Support */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="Özel Kick kullanıcı adı ekle (örn: jantoo)..."
                value={customStreamerInput}
                onChange={(e) => setCustomStreamerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomStreamer();
                  }
                }}
                style={{
                  flex: 1,
                  background: '#141418',
                  border: '1px solid var(--eb-border)',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  color: 'var(--eb-ink)',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                className="action-btn action-btn-gold"
                onClick={() => handleAddCustomStreamer()}
                style={{ height: '30px', padding: '0 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={13} />
                <span>Havuz ve Ekibe Ekle</span>
              </button>
            </div>
          </div>

          {/* 5. Live Tab Pill Preview */}
          <div style={{ padding: '12px', background: '#0e0e12', border: '1px solid var(--eb-border)', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--eb-faint)', marginBottom: '6px' }}>
              Canlı Önizleme (Üst barda görünecek şekil):
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                className="squad-tab-pill active"
                style={{ borderLeftColor: selectedColor, borderLeftWidth: '3px' }}
              >
                <span className="pulse-dot live" />
                <SquadIcon name={selectedIcon} size={14} color={selectedColor} />
                <span style={{ fontWeight: 700 }}>{name || 'Yeni Ekip'}</span>
                <span className="squad-count-badge has-live">
                  {selectedStreamers.length}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button
              type="button"
              className="action-btn"
              onClick={() => setSquadCreatorOpen(false)}
            >
              <span>İptal</span>
            </button>
            <button
              type="submit"
              className="action-btn action-btn-gold"
              style={{ height: '34px', padding: '0 18px', fontSize: '12px' }}
            >
              <Plus size={15} />
              <span>Ekibi Oluştur ve Sahneye Al</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
