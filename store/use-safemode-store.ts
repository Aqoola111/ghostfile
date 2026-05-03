import { create } from "zustand";

interface SafeModeStore {
  safeMode: boolean;
  setSafeMode: (safeMode: boolean) => void;
  toggleSafeMode: () => void;
}

export const useSafeModeStore = create<SafeModeStore>((set) => ({
  safeMode: false,
  setSafeMode: (safeMode) => set({ safeMode }),
  toggleSafeMode: () => set((s) => ({ safeMode: !s.safeMode })),
}));

export default useSafeModeStore;
