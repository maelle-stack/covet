import { create } from 'zustand';

import type { NavTab } from '../components/BottomNav';

/**
 * Lightweight client state only (docs/05_engineering_architecture.md):
 * the active tab lives here; all server-derived data stays in TanStack
 * Query. Home is the center of the product and the default tab.
 */
interface AppState {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
