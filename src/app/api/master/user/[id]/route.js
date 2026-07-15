import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hashPassword } from "@/lib/hash";

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

const userUpdateSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi.").max(150),
  email: z.string().email("Format email tidak valid.").max(150),
  username: z.string().min(1, "Username wajib diisi.").max(50),
  password: z.string().optional(),
  telepon: z.string().max(30).optional().nullable(),
  cabang_id: z.string().or(z.number()),
  role_id: z.string().or(z.number()),
  aktif: z.number().int().min(0).max(1)
});

export async function GET(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: { select: { id: true, nama: true } },
        cabang: { select: { id: true, nama: true, kode: true } }
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Data tidak ditemukan." }, { status: 404 });
    }

    const { password, ...userData } = user;
    return NextResponse.json({ success: true, message: "Data berhasil diambil.", data: serialize(userData) });
  } catch (error) {
    console.error("GET User By ID Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);
    const body = await request.json();
    const result = userUpdateSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validasi gagal.",
        errors: result.error.flatten().fieldErrors
      }, { status: 422 });
    }
    
    const { nama, email, username, password, telepon, cabang_id, role_id, aktif } = result.data;
    
    // Check for unique username excluding current record
    const existingUsername = await prisma.user.findFirst({ where: { username, id: { not: id } } });
    if (existingUsername) {
      return NextResponse.json({ success: false, message: "Username sudah digunakan." }, { status: 409 });
    }

    // Check for unique email excluding current record
    const existingEmail = await prisma.user.findFirst({ where: { email, id: { not: id } } });
    if (existingEmail) {
      return NextResponse.json({ success: false, message: "Email sudah digunakan." }, { status: 409 });
    }

    const updateData = {
      nama,
      email,
      username,
      telepon: telepon || null,
      cabang_id: BigInt(cabang_id),
      role_id: BigInt(role_id),
      aktif,
      diubah_tanggal: new Date()
    };

    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return NextResponse.json({ success: false, message: "Password baru minimal 6 karakter." }, { status: 422 });
      }
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({ where: { id }, data: updateData });
    const { password: _, ...userData } = updatedUser;
    
    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil diubah.",
      data: serialize(userData)
    });
    
  } catch (error) {
    console.error("PUT User Error:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: "Data tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);
    
    // Check if user has leads — if so, only deactivate
    const leadCount = await prisma.lead.count({ where: { user_id: id } });
    if (leadCount > 0) {
      return NextResponse.json({
        success: false,
        message: "Pengguna ini memiliki data lead. Nonaktifkan pengguna daripada menghapus."
      }, { status: 409 });
    }

    await prisma.user.delete({ where: { id } });
    
    return NextResponse.json({ success: true, message: "Data pengguna berhasil dihapus." });
    
  } catch (error) {
    console.error("DELETE User Error:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: "Data tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: "Terjadi kesalahan pada server. Mungkin data masih terkait data lain." }, { status: 500 });
  }
}
