import { create } from 'zustand';

import type { NavTab } from '../components/BottomNav';

/** Screens presented over the tab shell (Purchase Check, Settings). */
export type Overlay = 'none' | 'purchase-check' | 'settings';

/**
 * Lightweight client state only (docs/05_engineering_architecture.md):
 * the active tab and any presented overlay live here; all server-derived
 * data stays in TanStack Query. Home is the center of the product and the
 * default tab.
 */
interface AppState {
  activeTab: NavTab;
  overlay: Overlay;
  setActiveTab: (tab: NavTab) => void;
  openOverlay: (overlay: Exclude<Overlay, 'none'>) => void;
  closeOverlay: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  overlay: 'none',
  setActiveTab: (tab) => set({ activeTab: tab }),
  openOverlay: (overlay) => set({ overlay }),
  closeOverlay: () => set({ overlay: 'none' }),
}));
