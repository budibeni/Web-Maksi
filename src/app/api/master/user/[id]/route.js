import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hashPassword } from "@/lib/hash";

const userSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi.").max(150),
  username: z.string().min(1, "Username wajib diisi.").max(50),
  password: z.string().optional(),
  telepon: z.string().max(30).optional().nullable(),
  cabang_id: z.string().or(z.number()),
  role_id: z.string().or(z.number()),
  aktif: z.number().int().min(0).max(1)
});

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);
    const body = await request.json();
    const result = userSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validasi gagal.",
        errors: result.error.flatten().fieldErrors
      }, { status: 422 });
    }
    
    const { nama, username, password, telepon, cabang_id, role_id, aktif } = result.data;
    
    // Check for unique username excluding current record
    const existing = await prisma.user.findFirst({
      where: { 
        username,
        id: { not: id }
      }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Username sudah digunakan."
      }, { status: 409 });
    }

    const updateData = {
      nama,
      username,
      telepon,
      cabang_id: BigInt(cabang_id),
      role_id: BigInt(role_id),
      aktif,
      diubah_tanggal: new Date()
    };

    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return NextResponse.json({
          success: false,
          message: "Password baru minimal 6 karakter."
        }, { status: 422 });
      }
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });
    
    const { password: _, ...userData } = updatedUser;

    const serializedData = JSON.parse(JSON.stringify(userData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil diubah.",
      data: serializedData
    });
    
  } catch (error) {
    console.error("PUT User Error:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        message: "Data tidak ditemukan."
      }, { status: 404 });
    }
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);
    
    // Check if user is referenced somewhere (for example audit logs or lead assignment)
    // For now we will allow it, or perhaps we should soft delete? 
    // The schema does not strictly define restrict on audit logs since audit_log doesn't use foreign key for user_id strictly but it's BigInt
    // Let's just delete the user. In real app, we usually just set aktif = 0.

    await prisma.user.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil dihapus."
    });
    
  } catch (error) {
    console.error("DELETE User Error:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        message: "Data tidak ditemukan."
      }, { status: 404 });
    }
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server. Mungkin data ini masih terkait dengan data lain."
    }, { status: 500 });
  }
}
