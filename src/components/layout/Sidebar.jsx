"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_MENUS } from "@/config/menu";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { FiX, FiSettings, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  
  const isCollapsed = useUIStore(state => state.isSidebarCollapsed);
  const isMobileOpen = useUIStore(state => state.isMobileMenuOpen);
  const closeMobileMenu = useUIStore(state => state.closeMobileMenu);

  const [mounted, setMounted] = useState(false);
  const [dueReminderCount, setDueReminderCount] = useState(0);

  const fetchDueReminderCount = async () => {
    try {
      const res = await fetch("/api/pengingat/today-count");
      const json = await res.json();
      if (json.success) {
        setDueReminderCount(json.count || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      fetchDueReminderCount();
    }
  }, [pathname, user]);

  // Filter groups based on user role
  const visibleGroups = APP_MENUS.map(group => {
    // Check if user has role for the group (if specified)
    if (group.roles && (!user || !group.roles.includes(user?.role?.nama))) {
      return null;
    }

    const visibleItems = group.items.filter(menu => 
      !user || !menu.roles || menu.roles.includes(user?.role?.nama)
    );

    if (visibleItems.length === 0) return null;
    return { ...group, items: visibleItems };
  }).filter(Boolean);

  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (title) => {
    setExpandedMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

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
          {visibleGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-6">
              <p className={`px-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 ${isCollapsed ? 'md:hidden' : ''}`}>
                {group.group}
              </p>
              <div className="space-y-1.5">
                {group.items.map((menu, menuIdx) => {
                  const hasChildren = menu.children && menu.children.length > 0;
                  const isActive = pathname === menu.path || pathname.startsWith(`${menu.path}/`) || 
                                   (hasChildren && menu.children.some(child => pathname === child.path));
                  const isExpanded = expandedMenus[menu.title];
                  const Icon = menu.icon;

                  return (
                    <div key={menuIdx}>
                      {hasChildren ? (
                        <button 
                          onClick={() => toggleMenu(menu.title)}
                          title={isCollapsed ? menu.title : ""}
                          className={`
                            w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 group
                            ${isCollapsed ? 'md:justify-center md:px-0' : ''}
                            ${isActive || isExpanded
                              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm ring-1 ring-neutral-200/50 dark:ring-neutral-800" 
                              : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                            }
                          `}
                        >
                          <div className="flex items-center">
                            <Icon className={`flex-shrink-0 h-5 w-5 ${isActive || isExpanded ? "text-orange-600 dark:text-orange-500" : "text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"} ${isCollapsed ? 'md:mr-0' : 'mr-3'}`} />
                            <span className={`whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'md:hidden md:opacity-0 md:w-0' : 'opacity-100'}`}>
                              {menu.title}
                            </span>
                          </div>
                          {!isCollapsed && (
                            <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-orange-600' : 'text-neutral-400'}`} />
                          )}
                        </button>
                      ) : (
                        <Link 
                          href={menu.path || "#"}
                          onClick={closeMobileMenu}
                          title={isCollapsed ? menu.title : ""}
                          className={`
                            flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 group
                            ${isCollapsed ? 'md:justify-center md:px-0' : ''}
                            ${isActive 
                              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm ring-1 ring-neutral-200/50 dark:ring-neutral-800" 
                              : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                            }
                          `}
                        >
                          <div className="flex items-center">
                            <Icon className={`flex-shrink-0 h-5 w-5 ${isActive ? "text-orange-600 dark:text-orange-500" : "text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"} ${isCollapsed ? 'md:mr-0' : 'mr-3'}`} />
                            <span className={`whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'md:hidden md:opacity-0 md:w-0' : 'opacity-100'}`}>
                              {menu.title}
                            </span>
                          </div>
                          {((menu.title === "Pengingat" ? dueReminderCount : menu.badge) > 0) && !isCollapsed && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {menu.title === "Pengingat" ? dueReminderCount : menu.badge}
                            </span>
                          )}
                        </Link>
                      )}

                      {/* Submenus */}
                      {hasChildren && isExpanded && !isCollapsed && (
                        <div className="mt-1 ml-4 space-y-1 border-l border-neutral-200 dark:border-neutral-800 pl-4 py-1 animate-in fade-in slide-in-from-top-2">
                          {menu.children.map((child, childIdx) => {
                            const isChildActive = pathname === child.path;
                            return (
                              <Link
                                key={childIdx}
                                href={child.path}
                                onClick={closeMobileMenu}
                                className={`
                                  flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                                  ${isChildActive
                                    ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
                                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                                  }
                                `}
                              >
                                {child.title}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
