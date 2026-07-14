"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronRight, FiHome } from "react-icons/fi";

export default function Breadcrumb() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/dashboard") {
    return null;
  }

  const paths = pathname.split("/").filter((p) => p !== "");

  return (
    <nav className="flex px-5 py-3 text-neutral-700 bg-white dark:bg-neutral-900 rounded-xl shadow-sm mb-6 transition-colors duration-300" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
            <FiHome className="mr-2 w-4 h-4" />
            Dashboard
          </Link>
        </li>

        {paths.map((path, index) => {
          if (path === 'dashboard') return null;

          const href = `/${paths.slice(0, index + 1).join("/")}`;
          const isLast = index === paths.length - 1;
          const formattedPath = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

          return (
            <li key={path} className="flex items-center">
              <FiChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              {isLast ? (
                <span className="ml-1 text-sm font-medium text-neutral-800 dark:text-neutral-200 md:ml-2">
                  {formattedPath}
                </span>
              ) : (
                <Link href={href} className="ml-1 text-sm font-medium text-neutral-500 hover:text-orange-600 dark:text-neutral-400 dark:hover:text-orange-400 transition-colors md:ml-2">
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
