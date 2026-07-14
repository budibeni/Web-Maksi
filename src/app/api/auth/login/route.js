import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/hash";
import { signToken } from "@/lib/jwt";
import { z } from "zod";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_EXPIRES_IN_DAYS } from "@/config/auth";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi."),
  password: z.string().min(1, "Password wajib diisi.")
});

export async function POST(request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validasi gagal.",
        errors: result.error.flatten().fieldErrors
      }, { status: 422 });
    }
    
    const { username, password } = result.data;
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { telepon: username }
        ]
      },
      include: {
        role: true,
        cabang: true
      }
    });
    
    if (!user) {
      await prisma.auditLog.create({
        data: {
          nama_user: username,
          modul: "AUTH",
          aksi: "LOGIN_GAGAL",
          deskripsi: "Username atau telepon tidak ditemukan.",
          ip_address: request.headers.get("x-forwarded-for") || "unknown",
          user_agent: request.headers.get("user-agent") || "unknown"
        }
      });
      return NextResponse.json({ success: false, message: "Username/Telepon atau Password salah." }, { status: 401 });
    }
    
    if (user.aktif === 0) {
      return NextResponse.json({ success: false, message: "Akun Anda tidak aktif." }, { status: 403 });
    }
    
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      await prisma.auditLog.create({
        data: {
          user_id: user.id,
          nama_user: user.nama,
          modul: "AUTH",
          aksi: "LOGIN_GAGAL",
          deskripsi: "Password salah.",
          ip_address: request.headers.get("x-forwarded-for") || "unknown",
          user_agent: request.headers.get("user-agent") || "unknown"
        }
      });
      return NextResponse.json({ success: false, message: "Username/Telepon atau Password salah." }, { status: 401 });
    }
    
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        nama_user: user.nama,
        modul: "AUTH",
        aksi: "LOGIN",
        deskripsi: "User berhasil login.",
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown"
      }
    });
    
    const tokenPayload = {
      id: user.id.toString(),
      nama: user.nama,
      username: user.username,
      role: user.role.nama,
      cabang: user.cabang.kode
    };
    
    const token = await signToken(tokenPayload, `${AUTH_COOKIE_EXPIRES_IN_DAYS}d`);
    
    const { password: _, ...userData } = user;
    const serializedUserData = JSON.parse(JSON.stringify(userData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    const response = NextResponse.json({
      success: true,
      message: "Data berhasil diproses.",
      data: {
        token,
        user: serializedUserData
      }
    });
    
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: AUTH_COOKIE_EXPIRES_IN_DAYS * 24 * 60 * 60,
      path: "/",
    });
    
    return response;
    
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
  }
}
