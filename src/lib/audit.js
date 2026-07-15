import { prisma } from "./prisma";

/**
 * Helper to record an audit log in the database.
 * 
 * @param {Object} params
 * @param {Object} [params.user] - The current logged-in user object (usually from getCurrentUser)
 * @param {string} params.modul - The module name (e.g. "AUTH", "USER", "LEAD", "CUSTOMER", "PENAWARAN")
 * @param {string} params.aksi - The action name (e.g. "LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "DEACTIVATE", "DEAL", "LOST")
 * @param {bigint|number|string} [params.referensi_id] - Optional ID of the affected transaction/record
 * @param {string} [params.deskripsi] - Description of the action
 * @param {Object} [params.data_sebelum] - JSON of data before update (optional)
 * @param {Object} [params.data_sesudah] - JSON of data after update/create (optional)
 * @param {Request} [params.request] - The NextJS Request object to extract IP and User Agent headers
 */
export async function recordAuditLog({
  user,
  modul,
  aksi,
  referensi_id,
  deskripsi,
  data_sebelum,
  data_sesudah,
  request
}) {
  try {
    let ip_address = "unknown";
    let user_agent = "unknown";

    if (request) {
      ip_address = request.headers.get("x-forwarded-for") || "unknown";
      user_agent = request.headers.get("user-agent") || "unknown";
    }

    const userId = user?.id ? BigInt(user.id) : null;
    const userName = user?.nama || user?.username || "unknown";
    const refId = referensi_id ? BigInt(referensi_id) : null;

    // Convert objects to clean JSON if provided
    const before = data_sebelum ? JSON.parse(JSON.stringify(data_sebelum, (k, v) => typeof v === 'bigint' ? v.toString() : v)) : null;
    const after = data_sesudah ? JSON.parse(JSON.stringify(data_sesudah, (k, v) => typeof v === 'bigint' ? v.toString() : v)) : null;

    await prisma.auditLog.create({
      data: {
        user_id: userId,
        nama_user: userName,
        modul,
        aksi,
        referensi_id: refId,
        deskripsi,
        data_sebelum: before,
        data_sesudah: after,
        ip_address,
        user_agent
      }
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
