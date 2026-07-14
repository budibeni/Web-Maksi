import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  // Toast (Alert)
  toast: { open: false, message: '', type: 'info' },
  showToast: (message, type = 'info') => {
    set({ toast: { open: true, message, type } });
    setTimeout(() => {
      set((state) => ({ toast: { ...state.toast, open: false } }));
    }, 3000);
  },
  hideToast: () => set((state) => ({ toast: { ...state.toast, open: false } })),

  // Confirm Dialog
  confirm: { open: false, title: '', message: '', onConfirm: null, onCancel: null, type: 'danger' },
  showConfirm: (title, message, onConfirm, onCancel = null, type = 'danger') => 
    set({ confirm: { open: true, title, message, onConfirm, onCancel, type } }),
  hideConfirm: () => set((state) => ({ confirm: { ...state.confirm, open: false } })),
}));
