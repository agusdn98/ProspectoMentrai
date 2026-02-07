import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ AUTH STORE ============

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      
      clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============ FILTER STORE ============

export const useFilterStore = create((set) => ({
  companyFilters: {
    industry: [],
    companySize: [],
    location: [],
    technologies: [],
    fundingStages: [],
    minScore: 0,
  },
  
  setCompanyFilters: (filters) => set({ companyFilters: filters }),
  
  resetCompanyFilters: () => set({
    companyFilters: {
      industry: [],
      companySize: [],
      location: [],
      technologies: [],
      fundingStages: [],
      minScore: 0,
    }
  }),

  contactFilters: {
    jobTitles: [],
    seniorities: [],
    departments: [],
    relevantOnly: false,
  },

  setContactFilters: (filters) => set({ contactFilters: filters }),
}));

// ============ UI STORE ============

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  modals: {
    createList: false,
    addToList: false,
    addCompany: false,
  },

  openModal: (modalName) => set((state) => ({
    modals: { ...state.modals, [modalName]: true }
  })),

  closeModal: (modalName) => set((state) => ({
    modals: { ...state.modals, [modalName]: false }
  })),

  selection: {
    selectedCompanies: [],
    selectedContacts: [],
  },

  setSelectedCompanies: (companies) => set((state) => ({
    selection: { ...state.selection, selectedCompanies: companies }
  })),

  setSelectedContacts: (contacts) => set((state) => ({
    selection: { ...state.selection, selectedContacts: contacts }
  })),

  clearSelection: () => set({
    selection: { selectedCompanies: [], selectedContacts: [] }
  }),
}));
