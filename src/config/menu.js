import { ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES } from "../constants/role";
import { FiHome, FiUsers, FiTarget, FiFileText, FiDatabase, FiSettings } from "react-icons/fi";

export const APP_MENUS = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: FiHome,
    roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
  },
  {
    title: "Customer",
    path: "/customer",
    icon: FiUsers,
    roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
  },
  {
    title: "Lead",
    path: "/lead",
    icon: FiTarget,
    roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
  },
  {
    title: "Laporan",
    path: "/report",
    icon: FiFileText,
    roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
  },
  {
    title: "Master Data",
    path: "/master",
    icon: FiDatabase,
    roles: [ROLE_ADMIN],
  },
  {
    title: "Pengaturan",
    path: "/setting",
    icon: FiSettings,
    roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
  }
];
