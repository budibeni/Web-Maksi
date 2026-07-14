import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { AUTH_COOKIE_NAME } from "@/config/auth";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    let token;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    }
    
    if (!token) {
      return NextResponse.json({ success: false, message: "Belum login." }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    
    if (!payload || !payload.id) {
      return NextResponse.json({ success: false, message: "Token tidak valid." }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: BigInt(payload.id) },
      include: {
        role: true,
        cabang: true
      }
    });
    
    if (!user || user.aktif === 0) {
      return NextResponse.json({ success: false, message: "User tidak ditemukan atau tidak aktif." }, { status: 401 });
    }
    
    const { password: _, ...userData } = user;
    const serializedUserData = JSON.parse(JSON.stringify(userData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return NextResponse.json({
      success: true,
      message: "Data berhasil diambil.",
      data: serializedUserData
    });
    
  } catch (error) {
    console.error("Get Me Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
  }
}
