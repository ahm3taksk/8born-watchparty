import { Squad } from './types';

export const DEFAULT_VERIFIED_STREAMERS = [
  { username: 'egoistpati', displayName: 'EgoistPati' },
  { username: 'rionamy', displayName: 'rionamy' },
  { username: 'ogrencievi', displayName: 'OgrenciEvi' },
  { username: 'khonus', displayName: 'Khonus' },
  { username: 'rraenee', displayName: 'RRaenee' },
  { username: 'jantoo', displayName: 'jantoo' },
  { username: 'valiancys', displayName: 'Valiancys' },
  { username: 'nemesis', displayName: 'Nemesis' },
  { username: 'ppingup', displayName: 'PpinguP' },
  { username: 'syna', displayName: 'Syna' },
  { username: 'blackrose', displayName: 'BlackRose' },
];

export const DEFAULT_SQUADS: Squad[] = [
  {
    id: 'favoriler',
    name: 'Favoriler',
    icon: 'star',
    color: '#FFC526', // Eightborn Gold
    isDefault: true,
    streamers: ['egoistpati', 'rraenee', 'rionamy', 'ogrencievi'],
  },
  {
    id: 'adminler',
    name: 'Adminler',
    icon: 'eye',
    color: '#9B51E0', // Admin Purple
    isDefault: true,
    streamers: ['egoistpati', 'rionamy', 'ogrencievi', 'nemesis'],
  },
  {
    id: 'mrpd',
    name: 'MRPD',
    icon: 'shield',
    color: '#4A90E2', // Police Tactical Blue
    isDefault: true,
    streamers: ['jantoo', 'ppingup', 'khonus', 'valiancys'],
  },
];

export const SELECTABLE_SQUAD_ICONS = [
  { id: 'star', label: 'Favoriler / Yıldız' },
  { id: 'shield', label: 'Polis / Rozet' },
  { id: 'crosshair', label: 'Nişangah / Dürbün' },
  { id: 'eye', label: 'Admin / Radar' },
  { id: 'crown', label: 'Lider / Sezon 5' },
  { id: 'radio', label: 'Telsiz / Departman' },
  { id: 'skull', label: 'Gang / Yeraltı' },
  { id: 'flame', label: 'Aksiyon / Sıcak Bölge' },
  { id: 'car', label: 'Devriye / Araç' },
  { id: 'wrench', label: 'Mekanik / Sanayi' },
  { id: 'activity', label: 'EMS / Sağlık' },
  { id: 'zap', label: 'Çete / Hızlı Aksiyon' },
  { id: 'target', label: 'Operasyon / Hedef' },
  { id: 'briefcase', label: 'Yargı / Devlet' },
];

export const SELECTABLE_SQUAD_COLORS = [
  { hex: '#FFC526', name: 'Eightborn Altın' },
  { hex: '#4A90E2', name: 'Polis Mavisi' },
  { hex: '#9B51E0', name: 'Admin Moru' },
  { hex: '#2ECC71', name: 'Zümrüt Yeşil' },
  { hex: '#E74C3C', name: 'Kırmızı Aksiyon' },
  { hex: '#E67E22', name: 'Kehribar Turuncu' },
  { hex: '#00D2D3', name: 'Siber Turkuaz' },
  { hex: '#FF6B81', name: 'Rose Pembe' },
];
