"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { getMe } from "@/services/auth.service";

export default function MainLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, clearUser, isLoading, setLoading } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  
  const isMobileOpen = useUIStore(state => state.isMobileMenuOpen);
  const closeMobileMenu = useUIStore(state => state.closeMobileMenu);

  useEffect(() => {
    setIsHydrated(true);
    
    const checkAuth = async () => {
      try {
        if (!user) {
          const res = await getMe();
          if (res.success) {
            setUser(res.data);
          } else {
            clearUser();
            router.push("/login");
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        clearUser();
        router.push("/login");
      }
    };

    checkAuth();
  }, [user, setUser, clearUser, router, setLoading, pathname]);

  // Handle mobile menu close on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-neutral-950 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/60 dark:bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={closeMobileMenu}
        ></div>
      )}
      
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 relative">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent px-4 pb-4 pt-1 md:px-6 md:pb-6 md:pt-2 scroll-smooth">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
