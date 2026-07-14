"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronRight, FiHome } from "react-icons/fi";
import { useUIStore } from "@/store/ui.store";

export default function Breadcrumb() {
  const pathname = usePathname();
  const breadcrumbsMap = useUIStore((state) => state.breadcrumbsMap);

  const paths = pathname.split("/").filter((p) => p !== "");

  return (
    <nav className="flex items-center" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link href="/dashboard" className={`inline-flex items-center text-sm font-semibold transition-colors ${paths.length === 0 || (paths.length === 1 && paths[0] === 'dashboard') ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'}`}>
            Dashboard
          </Link>
        </li>

        {paths.map((path, index) => {
          if (path === 'dashboard') return null;

          const href = `/${paths.slice(0, index + 1).join("/")}`;
          const isLast = index === paths.length - 1;
          const formattedPath = breadcrumbsMap[path] || (path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " "));

          return (
            <li key={path} className="flex items-center">
              <FiChevronRight className="w-4 h-4 mx-1 text-neutral-400" />
              {isLast ? (
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {formattedPath}
                </span>
              ) : (
                <Link href={href} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">
                  {formattedPath}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
