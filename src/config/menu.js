import { ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES } from "../constants/role";

export const APP_MENUS = [
  {
    title: "Dashboard",
    path: "/dashboard",
    roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
  },
  {
    title: "Customer",
    path: "/customer",
    roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
  },
  {
    title: "Lead",
    path: "/lead",
    roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
  },
  {
    title: "Laporan",
    path: "/report",
    roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
  },
  {
    title: "Master Data",
    path: "/master",
    roles: [ROLE_ADMIN],
  },
  {
    title: "Pengaturan",
    path: "/setting",
    roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
  }
];
