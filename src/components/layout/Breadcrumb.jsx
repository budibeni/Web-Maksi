"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronRight, FiHome } from "react-icons/fi";
import { useUIStore } from "@/store/ui.store";

export default function Breadcrumb() {
  const pathname = usePathname();
  const breadcrumbsMap = useUIStore((state) => state.breadcrumbsMap);

  const paths = pathname.split("/").filter((p) => p !== "" && p !== "dashboard");

  // If we are on root or dashboard, just show "Dashboard"
  if (paths.length === 0) {
    return (
      <nav className="flex items-center" aria-label="Breadcrumb">
        <ol className="inline-flex items-center">
          <li className="inline-flex items-center text-sm font-semibold text-neutral-900 dark:text-white">
            Dashboard
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav className="flex items-center" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {paths.map((path, index) => {
          const originalSegments = pathname.split("/").filter((p) => p !== "");
          const pathIndexInOriginal = originalSegments.indexOf(path);
          const href = `/${originalSegments.slice(0, pathIndexInOriginal + 1).join("/")}`;
          const isLast = index === paths.length - 1;
          const formattedPath = breadcrumbsMap[path] || (path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " "));

          return (
            <li key={path} className="flex items-center">
              {index > 0 && <FiChevronRight className="w-4 h-4 mx-1 text-neutral-400" />}
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
