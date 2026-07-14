import { ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES } from "../constants/role";
import { 
  FiHome, FiUsers, FiTarget, FiFileText, FiDatabase, FiSettings,
  FiBox, FiActivity, FiBell, FiCheckCircle, FiXCircle, FiGrid
} from "react-icons/fi";

export const APP_MENUS = [
  {
    group: "MENU UTAMA",
    items: [
      {
        title: "Dashboard",
        path: "/dashboard",
        icon: FiHome,
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
      },
      {
        title: "Lead",
        path: "/lead",
        icon: FiUsers,
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
      },
      {
        title: "Penawaran",
        path: "/penawaran",
        icon: FiFileText,
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
      },
      {
        title: "Aktivitas",
        path: "/aktivitas",
        icon: FiActivity,
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
      },
      {
        title: "Pengingat",
        path: "/pengingat",
        icon: FiBell,
        badge: 3, // example
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
      },
      {
        title: "Deal",
        path: "/deal",
        icon: FiCheckCircle,
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
      },
      {
        title: "Lost",
        path: "/lost",
        icon: FiXCircle,
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
      },
      {
        title: "Laporan",
        path: "/report",
        icon: FiGrid,
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
      },
    ]
  },
  {
    group: "MASTER DATA",
    roles: [ROLE_ADMIN], // Only admin can see this entire group
    items: [
      {
        title: "Produk",
        icon: FiBox,
        roles: [ROLE_ADMIN],
        children: [
          {
            title: "Master Mesin",
            path: "/master/produk/mesin",
            roles: [ROLE_ADMIN],
          },
          {
            title: "Master Sparepart",
            path: "/master/produk/sparepart",
            roles: [ROLE_ADMIN],
          },
          {
            title: "Master Jasa",
            path: "/master/produk/jasa",
            roles: [ROLE_ADMIN],
          }
        ]
      },
      {
        title: "Alasan Lost",
        path: "/master/alasan-lost",
        icon: FiTarget,
        roles: [ROLE_ADMIN],
      },
      {
        title: "Cabang",
        path: "/master/cabang",
        icon: FiDatabase,
        roles: [ROLE_ADMIN],
      }
    ]
  },
  {
    group: "PENGATURAN",
    items: [
      {
        title: "Pengguna",
        path: "/pengaturan/pengguna",
        icon: FiUsers, // Should ideally be user icon
        roles: [ROLE_ADMIN],
      },
      {
        title: "Pengaturan Sistem",
        path: "/setting",
        icon: FiSettings,
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
      }
    ]
  }
];
