import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { AUTH_COOKIE_NAME } from "@/config/auth";

export async function POST(request) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    
    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.id) {
        await prisma.auditLog.create({
          data: {
            user_id: BigInt(payload.id),
            nama_user: payload.nama,
            modul: "AUTH",
            aksi: "LOGOUT",
            deskripsi: "User logout.",
            ip_address: request.headers.get("x-forwarded-for") || "unknown",
            user_agent: request.headers.get("user-agent") || "unknown"
          }
        });
      }
    }
    
    const response = NextResponse.json({
      success: true,
      message: "Data berhasil diproses.",
    });
    
    response.cookies.delete(AUTH_COOKIE_NAME);
    
    return response;
  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
  }
}
