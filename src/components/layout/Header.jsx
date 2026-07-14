"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { logout } from "@/services/auth.service";
import { FiLogOut, FiUser, FiBell, FiMenu, FiChevronLeft, FiChevronRight, FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "next-themes";
import Breadcrumb from "./Breadcrumb";

export default function Header() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  const toggleMobileMenu = useUIStore(state => state.toggleMobileMenu);
  const isCollapsed = useUIStore(state => state.isSidebarCollapsed);

  const handleLogout = async () => {
    try {
      await logout();
      clearUser();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
      clearUser();
      router.push("/login");
    }
  };

  return (
    <header className="bg-transparent h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 transition-all duration-300">
      <div className="flex items-center">
        {/* Mobile menu toggle */}
        <button 
          onClick={toggleMobileMenu} 
          className="md:hidden mr-3 text-neutral-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors p-2 rounded-full hover:bg-white dark:hover:bg-neutral-800"
          aria-label="Toggle mobile menu"
        >
          <FiMenu className="h-6 w-6" />
        </button>
        
        {/* Desktop sidebar toggle */}
        <button 
          onClick={toggleSidebar} 
          className="hidden md:flex mr-4 text-neutral-400 dark:text-neutral-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors p-2 rounded-full hover:bg-white dark:hover:bg-neutral-800 items-center justify-center shadow-sm"
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? <FiChevronRight className="h-5 w-5" /> : <FiChevronLeft className="h-5 w-5" />}
        </button>

        {/* Dashboard Title / Breadcrumb */}
        <div className="hidden md:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Spacer to push right items */}
      <div className="flex-1"></div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Portal for page-specific actions */}
        <div id="header-actions-portal" className="flex items-center gap-3 empty:hidden mr-4 md:mr-6 border-r border-neutral-200 dark:border-neutral-800 pr-4 md:pr-6"></div>

        {mounted && (
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors border border-neutral-200 dark:border-neutral-800 relative"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
          </button>
        )}

        <button className="p-2 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors border border-neutral-200 dark:border-neutral-800 relative">
          <FiBell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-neutral-900"></span>
        </button>
        
        <div className="relative ml-1 md:ml-2">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center focus:outline-none rounded-full ring-2 ring-transparent hover:ring-orange-200 dark:hover:ring-orange-900/50 transition-all"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {user?.nama?.charAt(0) || "U"}
            </div>
          </button>

          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsMenuOpen(false)}
              ></div>
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-black/50 py-2 z-20 border border-neutral-100 dark:border-neutral-800 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{user?.nama || "User"}</p>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{user?.role?.nama || "Role"}</p>
                </div>
                <div className="p-2">
                  <button
                    className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push("/setting");
                    }}
                  >
                    <FiUser className="mr-3 h-4 w-4" />
                    Profil Saya
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-1"
                  >
                    <FiLogOut className="mr-3 h-4 w-4" />
                    Keluar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
