import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LayoutMode, PlayerEngine, Squad, StreamerAudioState, StreamerInfo } from '@/lib/types';
import { DEFAULT_SQUADS } from '@/lib/constants';

interface Toast {
  id: string;
  text: string;
}

interface WatchpartyState {
  // Squads
  squads: Squad[];
  activeSquadId: string;
  mainFocusStreamer: string;
  activeLayout: LayoutMode;
  playerEngine: PlayerEngine;

  // Master Audio
  masterVolume: number;
  masterMuted: boolean;

  // Streamer Audio States: { [username]: StreamerAudioState }
  streamerStates: Record<string, StreamerAudioState>;

  // Previous mutes before Solo mode
  preSoloMuteMap: Record<string, boolean>;

  // UI Drawers & Modals
  isSidebarOpen: boolean;
  isChatOpen: boolean;
  activeChatStreamer: string;
  isRadarOpen: boolean;
  isSquadCreatorOpen: boolean;

  // QoL & Settings
  autoHideOffline: boolean;
  autoMaxQuality: boolean;

  // Live Status Cache: { [lowercaseUsername]: StreamerInfo }
  liveStatuses: Record<string, StreamerInfo>;

  // Known Streamers Pool (Unified Roster Repository)
  knownStreamers: string[];

  // Toasts
  toasts: Toast[];

  // Actions
  addStreamerToPool: (streamer: string) => void;
  setActiveSquad: (id: string) => void;
  createSquad: (squad: Squad) => void;
  deleteSquad: (id: string) => void;
  addStreamerToSquad: (squadId: string, streamer: string) => Promise<boolean>;
  fetchStreamerProfile: (streamer: string) => Promise<StreamerInfo | null>;
  removeStreamerFromSquad: (squadId: string, streamer: string) => void;
  moveStreamerInSquad: (squadId: string, streamer: string, direction: -1 | 1) => void;
  setMainFocus: (streamer: string) => void;
  setLayout: (layout: LayoutMode) => void;
  setPlayerEngine: (engine: PlayerEngine) => void;

  setMasterVolume: (vol: number) => void;
  toggleMasterMute: () => void;

  setStreamerVolume: (streamer: string, vol: number) => void;
  toggleStreamerMute: (streamer: string) => void;
  toggleStreamerBoost: (streamer: string) => void;
  toggleSolo: (streamer: string) => void;
  setStreamerQuality: (streamer: string, quality: string) => void;

  toggleAutoHideOffline: () => void;
  setAutoHideOffline: (hide: boolean) => void;
  toggleAutoMaxQuality: () => void;
  setAutoMaxQuality: (max: boolean) => void;

  setSidebarOpen: (open: boolean) => void;
  setChatOpen: (open: boolean, streamer?: string) => void;
  setActiveChatStreamer: (streamer: string) => void;
  setRadarOpen: (open: boolean) => void;
  setSquadCreatorOpen: (open: boolean) => void;

  fetchLiveStatuses: () => Promise<void>;

  addToast: (text: string) => void;
  removeToast: (id: string) => void;

  getActiveSquad: () => Squad;
  exportBackupData: () => string;
  importBackupData: (jsonStr: string) => boolean;
  loadFromShareUrl: (streamerList: string[], layout?: LayoutMode) => void;
}

const INITIAL_KNOWN_STREAMERS = [
  'rraenee',
  'jantoo',
  'ppingup',
  'khonus',
  'valiancys',
  'egoistpati',
  'rionamy',
  'alptv',
  'holmes',
  'ebonivon',
  'mustafasevimm',
  'elraenn',
];

export const useWatchpartyStore = create<WatchpartyState>()(
  persist(
    (set, get) => ({
      squads: DEFAULT_SQUADS,
      activeSquadId: 'favoriler',
      mainFocusStreamer: 'rraenee',
      activeLayout: 'theater-left',
      playerEngine: 'hls', // Default: 100% Native High-Performance HLS player with real audio controls!

      masterVolume: 1.0,
      masterMuted: false,

      streamerStates: {},
      preSoloMuteMap: {},

      isSidebarOpen: false,
      isChatOpen: false,
      activeChatStreamer: 'rraenee',
      isRadarOpen: false,
      isSquadCreatorOpen: false,

      autoHideOffline: false,
      autoMaxQuality: true,

      liveStatuses: {},
      knownStreamers: INITIAL_KNOWN_STREAMERS,

      toasts: [],

      addStreamerToPool: (rawStreamer: string) => {
        const streamer = rawStreamer.toLowerCase().trim().replace('@', '');
        if (!streamer) return;
        set((state) => {
          if (state.knownStreamers.includes(streamer)) return state;
          return { knownStreamers: [...state.knownStreamers, streamer] };
        });
        get().fetchStreamerProfile(streamer);
      },

      getActiveSquad: () => {
        const { squads, activeSquadId } = get();
        return squads.find((s) => s.id === activeSquadId) || squads[0] || DEFAULT_SQUADS[0];
      },

      setActiveSquad: (id: string) => {
        const sq = get().squads.find((s) => s.id === id);
        if (sq && sq.streamers.length > 0) {
          set({
            activeSquadId: id,
            mainFocusStreamer: sq.streamers[0],
            activeChatStreamer: sq.streamers[0],
          });
        } else {
          set({ activeSquadId: id });
        }
      },

      createSquad: (squad: Squad) => {
        squad.streamers.forEach((s) => get().addStreamerToPool(s));
        set((state) => ({
          squads: [...state.squads, squad],
          activeSquadId: squad.id,
          mainFocusStreamer: squad.streamers[0] || '',
        }));
        get().addToast(`"${squad.name}" ekibi oluşturuldu`);
      },

      deleteSquad: (id: string) => {
        set((state) => {
          const next = state.squads.filter((s) => s.id !== id);
          const activeId =
            state.activeSquadId === id ? (next[0] ? next[0].id : 'favoriler') : state.activeSquadId;
          return { squads: next, activeSquadId: activeId };
        });
        get().addToast('Ekip silindi');
      },

      fetchStreamerProfile: async (rawStreamer: string) => {
        const streamer = rawStreamer.toLowerCase().trim().replace('@', '');
        if (!streamer) return null;

        try {
          const res = await fetch(`/api/kick/channel/${encodeURIComponent(streamer)}`);
          if (res.ok) {
            const data: StreamerInfo = await res.json();
            if (data && data.username) {
              set((state) => ({
                liveStatuses: {
                  ...state.liveStatuses,
                  [streamer]: data,
                },
              }));
              return data;
            }
          }
        } catch (e) {
          console.warn(`[Watchparty Store] Channel profile fetch failed for @${streamer}:`, e);
        }
        return null;
      },

      addStreamerToSquad: async (squadId: string, rawStreamer: string) => {
        const streamer = rawStreamer.toLowerCase().trim().replace('@', '');
        if (!streamer) return false;

        // Add to permanent known streamers pool
        get().addStreamerToPool(streamer);

        // 1. Immediately add to squad state so user sees it right away
        set((state) => {
          const squads = state.squads.map((sq) => {
            if (sq.id === squadId) {
              if (sq.streamers.includes(streamer)) return sq;
              return { ...sq, streamers: [...sq.streamers, streamer] };
            }
            return sq;
          });
          return { squads };
        });

        // 2. Immediately fetch real channel profile & live status from Kick API
        const profile = await get().fetchStreamerProfile(streamer);
        if (profile && (profile.profilePicUrl || profile.avatar)) {
          const displayName = profile.displayName || streamer;
          const liveText = profile.isLive ? ' (CANLI)' : '';
          get().addToast(`@${displayName} profili Kick'ten başarıyla çekildi${liveText}!`);
        } else {
          get().addToast(`@${streamer} ekibe eklendi`);
        }
        return true;
      },

      removeStreamerFromSquad: (squadId: string, rawStreamer: string) => {
        const streamer = rawStreamer.toLowerCase().trim();
        set((state) => {
          const squads = state.squads.map((sq) => {
            if (sq.id === squadId) {
              return { ...sq, streamers: sq.streamers.filter((s) => s !== streamer) };
            }
            return sq;
          });

          // If main focus was removed, swap to first remaining
          let main = state.mainFocusStreamer;
          const activeSq = squads.find((s) => s.id === squadId);
          if (main === streamer && activeSq && activeSq.streamers.length > 0) {
            main = activeSq.streamers[0];
          }

          return { squads, mainFocusStreamer: main };
        });
        get().addToast(`@${streamer} ekipten çıkarıldı`);
      },

      moveStreamerInSquad: (squadId: string, streamer: string, direction: -1 | 1) => {
        set((state) => {
          const squads = state.squads.map((sq) => {
            if (sq.id !== squadId) return sq;
            const list = [...sq.streamers];
            const idx = list.indexOf(streamer);
            if (idx === -1) return sq;
            const targetIdx = idx + direction;
            if (targetIdx < 0 || targetIdx >= list.length) return sq;
            const temp = list[idx];
            list[idx] = list[targetIdx];
            list[targetIdx] = temp;
            return { ...sq, streamers: list };
          });
          return { squads };
        });
      },

      setMainFocus: (streamer: string) => {
        set((state) => {
          const current = state.streamerStates[streamer] || {
            volume: 1,
            muted: false,
            isSolo: false,
            isBoosted: false,
            quality: 'auto',
          };
          return {
            mainFocusStreamer: streamer,
            streamerStates: {
              ...state.streamerStates,
              [streamer]: {
                ...current,
                muted: false,
                volume: current.volume === 0 ? 1 : current.volume,
              },
            },
          };
        });
        get().addToast(`@${streamer} odak yayın yapıldı`);
      },

      setLayout: (layout: LayoutMode) => {
        set({ activeLayout: layout });
      },

      setPlayerEngine: (engine: PlayerEngine) => {
        set({ playerEngine: engine });
        get().addToast(
          engine === 'hls'
            ? 'Native HLS Modu (Web Audio API) aktif'
            : 'Resmi Kick Embed Moduna geçildi'
        );
      },

      setMasterVolume: (vol: number) => {
        const clamped = Math.max(0, Math.min(1, vol));
        set({ masterVolume: clamped, masterMuted: clamped === 0 });
      },

      toggleMasterMute: () => {
        set((state) => ({ masterMuted: !state.masterMuted }));
      },

      setStreamerVolume: (streamer: string, vol: number) => {
        const clamped = Math.max(0, Math.min(1, vol));
        set((state) => {
          const current = state.streamerStates[streamer] || {
            volume: 1,
            muted: false,
            isSolo: false,
            isBoosted: false,
            quality: 'auto',
          };
          return {
            streamerStates: {
              ...state.streamerStates,
              [streamer]: {
                ...current,
                volume: clamped,
                muted: clamped === 0,
              },
            },
          };
        });
      },

      toggleStreamerMute: (streamer: string) => {
        set((state) => {
          const current = state.streamerStates[streamer] || {
            volume: 1,
            muted: false,
            isSolo: false,
            isBoosted: false,
            quality: 'auto',
          };
          return {
            streamerStates: {
              ...state.streamerStates,
              [streamer]: {
                ...current,
                muted: !current.muted,
              },
            },
          };
        });
      },

      toggleStreamerBoost: (streamer: string) => {
        set((state) => {
          const current = state.streamerStates[streamer] || {
            volume: 1,
            muted: false,
            isSolo: false,
            isBoosted: false,
            quality: 'auto',
          };
          const nextBoost = !current.isBoosted;
          get().addToast(
            nextBoost
              ? `@${streamer} Audio Booster (+200%) aktif`
              : `@${streamer} Booster kapatıldı`
          );
          return {
            streamerStates: {
              ...state.streamerStates,
              [streamer]: {
                ...current,
                isBoosted: nextBoost,
              },
            },
          };
        });
      },

      toggleSolo: (targetStreamer: string) => {
        const state = get();
        const activeSquad = state.getActiveSquad();
        const streamers = activeSquad.streamers;
        const currentTargetState = state.streamerStates[targetStreamer] || {
          volume: 1,
          muted: false,
          isSolo: false,
          isBoosted: false,
          quality: 'auto',
        };

        const isCurrentlySolo = currentTargetState.isSolo;

        if (!isCurrentlySolo) {
          // ENTER SOLO: Mute all other streamers and unmute target
          const muteMap: Record<string, boolean> = {};
          const newStreamerStates = { ...state.streamerStates };

          streamers.forEach((s) => {
            const st = newStreamerStates[s] || {
              volume: 1,
              muted: s !== targetStreamer,
              isSolo: false,
              isBoosted: false,
              quality: 'auto',
            };
            muteMap[s] = st.muted;
            newStreamerStates[s] = {
              ...st,
              muted: s !== targetStreamer,
              isSolo: s === targetStreamer,
            };
          });

          set({
            streamerStates: newStreamerStates,
            preSoloMuteMap: muteMap,
          });
          get().addToast(`SOLO: Yalnızca @${targetStreamer} dinleniyor`);
        } else {
          // EXIT SOLO: Restore previous mutes
          const savedMutes = state.preSoloMuteMap;
          const newStreamerStates = { ...state.streamerStates };

          streamers.forEach((s) => {
            const st = newStreamerStates[s] || {
              volume: 1,
              muted: false,
              isSolo: false,
              isBoosted: false,
              quality: 'auto',
            };
            newStreamerStates[s] = {
              ...st,
              muted: savedMutes[s] !== undefined ? savedMutes[s] : false,
              isSolo: false,
            };
          });

          set({
            streamerStates: newStreamerStates,
            preSoloMuteMap: {},
          });
          get().addToast('Solo modu kapatıldı');
        }
      },

      setStreamerQuality: (streamer: string, quality: string) => {
        set((state) => {
          const current = state.streamerStates[streamer] || {
            volume: 1,
            muted: false,
            isSolo: false,
            isBoosted: false,
            quality: 'auto',
          };
          return {
            streamerStates: {
              ...state.streamerStates,
              [streamer]: { ...current, quality },
            },
          };
        });
      },

      toggleAutoHideOffline: () => {
        set((state) => {
          const next = !state.autoHideOffline;
          get().addToast(next ? 'Yayında olmayanlar otomatik gizlendi' : 'Tüm yayıncılar gösteriliyor');
          return { autoHideOffline: next };
        });
      },

      setAutoHideOffline: (hide: boolean) => set({ autoHideOffline: hide }),

      toggleAutoMaxQuality: () => {
        set((state) => {
          const next = !state.autoMaxQuality;
          get().addToast(next ? 'Otomatik en yüksek kalite (1080p60) aktif' : 'Otomatik adaptif kalite aktif');
          return { autoMaxQuality: next };
        });
      },

      setAutoMaxQuality: (max: boolean) => set({ autoMaxQuality: max }),

      setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),

      setChatOpen: (open: boolean, streamer?: string) => {
        set((state) => ({
          isChatOpen: open,
          activeChatStreamer: streamer || state.activeChatStreamer || state.mainFocusStreamer,
        }));
      },

      setActiveChatStreamer: (streamer: string) => set({ activeChatStreamer: streamer }),

      setRadarOpen: (open: boolean) => set({ isRadarOpen: open }),

      setSquadCreatorOpen: (open: boolean) => set({ isSquadCreatorOpen: open }),

      fetchLiveStatuses: async () => {
        try {
          const { squads } = get();
          const allStreamers = new Set<string>();
          squads.forEach((sq) => sq.streamers.forEach((s) => allStreamers.add(s.toLowerCase())));
          const names = Array.from(allStreamers).join(',');
          const url = names ? `/api/kick/channels?names=${encodeURIComponent(names)}` : '/api/kick/channels';
          const res = await fetch(url);
          if (res.ok) {
            const data: StreamerInfo[] = await res.json();
            const map: Record<string, StreamerInfo> = {};
            data.forEach((item) => {
              if (item && item.username) {
                map[item.username.toLowerCase()] = item;
              }
            });
            set((state) => ({
              liveStatuses: {
                ...state.liveStatuses,
                ...map,
              },
            }));
          }
        } catch (e) {
          console.warn('[Watchparty Store] Failed to update live statuses:', e);
        }
      },

      addToast: (text: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({ toasts: [...state.toasts.slice(-3), { id, text }] }));
        setTimeout(() => {
          get().removeToast(id);
        }, 3200);
      },

      removeToast: (id: string) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      },

      exportBackupData: () => {
        const { squads, activeSquadId, activeLayout, autoHideOffline, autoMaxQuality } = get();
        return JSON.stringify(
          {
            version: 'ebv-v3',
            exportDate: new Date().toISOString(),
            squads,
            activeSquadId,
            activeLayout,
            autoHideOffline,
            autoMaxQuality,
          },
          null,
          2
        );
      },

      importBackupData: (jsonStr: string) => {
        try {
          const parsed = JSON.parse(jsonStr);
          if (!parsed || !Array.isArray(parsed.squads)) {
            get().addToast('Hata: Geçersiz yedek dosyası yapısı');
            return false;
          }

          // Validate squad shapes
          const validSquads: Squad[] = parsed.squads.filter(
            (sq: unknown): sq is Squad =>
              Boolean(sq && typeof sq === 'object' && 'id' in sq && 'name' in sq && Array.isArray((sq as Squad).streamers))
          );

          if (validSquads.length === 0) {
            get().addToast('Hata: Dosyada geçerli ekip bulunamadı');
            return false;
          }

          set((state) => ({
            squads: validSquads,
            activeSquadId: parsed.activeSquadId && validSquads.some((s) => s.id === parsed.activeSquadId)
              ? parsed.activeSquadId
              : validSquads[0].id,
            activeLayout: parsed.activeLayout || state.activeLayout,
            autoHideOffline: parsed.autoHideOffline !== undefined ? Boolean(parsed.autoHideOffline) : state.autoHideOffline,
            autoMaxQuality: parsed.autoMaxQuality !== undefined ? Boolean(parsed.autoMaxQuality) : state.autoMaxQuality,
          }));

          get().fetchLiveStatuses();
          get().addToast(`${validSquads.length} adet ekip başarıyla içe aktarıldı!`);
          return true;
        } catch {
          get().addToast('Hata: JSON dosyası okunamadı veya bozuk');
          return false;
        }
      },

      loadFromShareUrl: (streamerList: string[], layout?: LayoutMode) => {
        if (!streamerList || streamerList.length === 0) return;
        const cleanStreamers = streamerList
          .map((s) => s.toLowerCase().trim().replace('@', ''))
          .filter(Boolean);
        if (cleanStreamers.length === 0) return;

        set((state) => {
          const updatedSquads = [...state.squads];
          const existingIdx = updatedSquads.findIndex((s) => s.id === 'shared');
          if (existingIdx >= 0) {
            updatedSquads[existingIdx] = {
              ...updatedSquads[existingIdx],
              streamers: cleanStreamers,
            };
          } else {
            updatedSquads.push({
              id: 'shared',
              name: 'Paylaşılan Ekip',
              icon: 'Share2',
              color: '#FFC526',
              streamers: cleanStreamers,
            });
          }

          const validLayouts: LayoutMode[] = ['theater-left', 'theater-top', 'grid-equal', 'single'];
          const newLayout = layout && validLayouts.includes(layout) ? layout : state.activeLayout;

          return {
            squads: updatedSquads,
            activeSquadId: 'shared',
            mainFocusStreamer: cleanStreamers[0],
            activeChatStreamer: cleanStreamers[0],
            activeLayout: newLayout,
          };
        });

        get().fetchLiveStatuses();
        get().addToast(`Paylaşılan ${cleanStreamers.length} yayın yüklendi!`);
      },
    }),
    {
      name: 'ebv_watchparty_v3',
      partialize: (state) => ({
        squads: state.squads,
        activeSquadId: state.activeSquadId,
        activeLayout: state.activeLayout,
        playerEngine: state.playerEngine,
        masterVolume: state.masterVolume,
        autoHideOffline: state.autoHideOffline,
        autoMaxQuality: state.autoMaxQuality,
        liveStatuses: state.liveStatuses,
        knownStreamers: state.knownStreamers,
      }),
    }
  )
);
