import { create } from 'zustand';
import type { SiteName } from '../constants/sites';

interface SiteState {
  activeSite: SiteName;
  setActiveSite: (site: SiteName) => void;
  resetToDefault: () => void;
}

// Lyon est toujours le site par défaut — réinitialisé à chaque session
export const useSiteStore = create<SiteState>((set) => ({
  activeSite: 'Lyon',
  setActiveSite: (site) => set({ activeSite: site }),
  resetToDefault: () => set({ activeSite: 'Lyon' }),
}));
