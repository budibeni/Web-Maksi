"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_MENUS } from "@/config/menu";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { FiX, FiSettings } from "react-icons/fi";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  
  const isCollapsed = useUIStore(state => state.isSidebarCollapsed);
  const isMobileOpen = useUIStore(state => state.isMobileMenuOpen);
  const closeMobileMenu = useUIStore(state => state.closeMobileMenu);

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter menus based on user role
  const visibleMenus = APP_MENUS.filter(menu => 
    !user || !menu.roles || menu.roles.includes(user?.role?.nama)
  );

  return (
    <div 
      className={`
        fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-neutral-100 dark:bg-neutral-950 md:bg-transparent md:dark:bg-transparent text-neutral-800 dark:text-white min-h-screen transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-56'}
        w-56 flex-shrink-0
      `}
    >
      <div className={`flex items-center h-20 bg-transparent px-5 ${isCollapsed ? 'md:justify-center px-0' : 'justify-between md:justify-center'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
            <h1 className="text-xl font-black text-white dark:text-neutral-900">M</h1>
          </div>
          <h1 className={`text-xl font-bold tracking-tight text-neutral-900 dark:text-white ${isCollapsed ? 'md:hidden' : 'block'}`}>MAKSI</h1>
        </div>
        <button onClick={closeMobileMenu} className="md:hidden text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-white dark:hover:bg-neutral-800">
          <FiX className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <nav className="space-y-1.5 px-3">
          <p className={`px-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 ${isCollapsed ? 'md:hidden' : ''}`}>Menu</p>
          {visibleMenus.map((menu, index) => {
            const isActive = pathname === menu.path || pathname.startsWith(`${menu.path}/`);
            const Icon = menu.icon;
            
            return (
               <Link 
                key={index} 
                href={menu.path}
                onClick={closeMobileMenu}
                title={isCollapsed ? menu.title : ""}
                className={`
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 group
                  ${isCollapsed ? 'md:justify-center md:px-0' : ''}
                  ${isActive 
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm ring-1 ring-neutral-200/50 dark:ring-neutral-800" 
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                  }
                `}
              >
                <Icon className={`flex-shrink-0 h-5 w-5 ${isActive ? "text-orange-600 dark:text-orange-500" : "text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"} ${isCollapsed ? 'md:mr-0' : 'mr-3'}`} />
                <span className={`whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'md:hidden md:opacity-0 md:w-0' : 'opacity-100'}`}>
                  {menu.title}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Bottom Floating Actions */}
      <div className={`p-4 transition-all duration-300 flex ${isCollapsed ? 'md:flex-col md:items-center space-y-3 space-x-0' : 'items-center justify-center space-x-3'}`}>
        <button 
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-neutral-900 shadow-sm text-neutral-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition-all ring-1 ring-neutral-200/50 dark:ring-neutral-800"
          title="Settings"
        >
          <FiSettings className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
