import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed:    boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar:       () => void;
  /** Last vehicle the user explicitly focused (map pin, list row, detail page).
   *  Persisted so the playback page can restore it across navigation. */
  selectedVehicleId:    string;
  setSelectedVehicleId: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed:    false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar:       () => set({ sidebarCollapsed: !get().sidebarCollapsed }),

      selectedVehicleId:    '',
      setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
    }),
    { name: 'fleet:ui' },
  ),
);
