import { ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES } from "../constants/role";
import { 
  FiHome, FiUsers, FiTarget, FiFileText, FiDatabase, FiSettings,
  FiBox, FiActivity, FiBell, FiCheckCircle, FiXCircle, FiGrid, FiClock
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
        title: "Penawaran",
        path: "/penawaran",
        icon: FiFileText,
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER, ROLE_SALES],
      },
      {
        title: "Aktivitas",
        path: "/aktivitas",
        icon: FiActivity,
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER],
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
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER],
      },
      {
        title: "Lost",
        path: "/lost",
        icon: FiXCircle,
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT, ROLE_BRANCH_MANAGER],
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
    roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT], // Admin and Top Management can see this group
    items: [
      {
        title: "Produk",
        icon: FiBox,
        roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT],
        children: [
          {
            title: "Kategori Produk",
            path: "/master/kategori-produk",
            roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT],
          },
          {
            title: "Master Produk",
            path: "/master/produk",
            roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT],
          },
          {
            title: "Harga Produk",
            path: "/master/harga-produk",
            roles: [ROLE_ADMIN, ROLE_TOP_MANAGEMENT],
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
        title: "Hasil Interaksi",
        path: "/master/hasil-interaksi",
        icon: FiActivity,
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
        icon: FiUsers,
        roles: [ROLE_ADMIN],
      },
      {
        title: "Audit Log",
        path: "/pengaturan/audit-log",
        icon: FiClock,
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
