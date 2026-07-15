import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { hashPassword } from '@/lib/hash';
import { recordAuditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

// GET /api/auth/profile — get own profile
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const data = await prisma.user.findUnique({
      where: { id: BigInt(user.id) },
      include: {
        role: { select: { id: true, nama: true } },
        cabang: { select: { id: true, nama: true, kode: true } }
      }
    });
    if (!data) return NextResponse.json({ success: false, message: 'User tidak ditemukan.' }, { status: 404 });

    const { password, ...rest } = data;
    return NextResponse.json({ success: true, data: serialize(rest) });
  } catch (error) {
    console.error('GET Profile Error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

// PUT /api/auth/profile — update own profile info (name, email, telepon)
export async function PUT(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action } = body;

    if (action === 'update_profile') {
      const schema = z.object({
        nama: z.string().min(1, 'Nama wajib diisi.').max(150),
        email: z.string().email('Format email tidak valid.').max(150),
        telepon: z.string().max(30).optional().nullable(),
      });

      const result = schema.safeParse(body);
      if (!result.success) {
        return NextResponse.json({
          success: false,
          message: 'Validasi gagal.',
          errors: result.error.flatten().fieldErrors
        }, { status: 422 });
      }

      const { nama, email, telepon } = result.data;
      const id = BigInt(user.id);

      // Check email uniqueness
      const existingEmail = await prisma.user.findFirst({ where: { email, id: { not: id } } });
      if (existingEmail) {
        return NextResponse.json({ success: false, message: 'Email sudah digunakan.' }, { status: 409 });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { nama, email, telepon: telepon || null, diubah_oleh: user.nama, diubah_tanggal: new Date() },
        include: {
          role: { select: { id: true, nama: true } },
          cabang: { select: { id: true, nama: true, kode: true } }
        }
      });

      const { password, ...rest } = updated;

      // Record Audit Log
      await recordAuditLog({
        user,
        modul: "USER",
        aksi: "UPDATE",
        referensi_id: id,
        deskripsi: `Memperbarui profil sendiri: ${nama} (${email})`,
        request
      });

      return NextResponse.json({ success: true, message: 'Profil berhasil diperbarui.', data: serialize(rest) });
    }

    if (action === 'change_password') {
      const schema = z.object({
        password_lama: z.string().min(1, 'Password lama wajib diisi.'),
        password_baru: z.string().min(6, 'Password baru minimal 6 karakter.'),
        konfirmasi_password: z.string().min(6, 'Konfirmasi password wajib diisi.'),
      });

      const result = schema.safeParse(body);
      if (!result.success) {
        return NextResponse.json({
          success: false,
          message: 'Validasi gagal.',
          errors: result.error.flatten().fieldErrors
        }, { status: 422 });
      }

      const { password_lama, password_baru, konfirmasi_password } = result.data;

      if (password_baru !== konfirmasi_password) {
        return NextResponse.json({ success: false, message: 'Konfirmasi password tidak cocok.' }, { status: 422 });
      }

      const id = BigInt(user.id);
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ success: false, message: 'User tidak ditemukan.' }, { status: 404 });

      const isMatch = await bcrypt.compare(password_lama, existing.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, message: 'Password lama tidak sesuai.' }, { status: 401 });
      }

      const hashedNew = await hashPassword(password_baru);
      await prisma.user.update({
        where: { id },
        data: { password: hashedNew, diubah_oleh: user.nama, diubah_tanggal: new Date() }
      });

      // Record Audit Log
      await recordAuditLog({
        user,
        modul: "USER",
        aksi: "CHANGE_PASSWORD",
        referensi_id: id,
        deskripsi: `Mengubah password sendiri`,
        request
      });

      return NextResponse.json({ success: true, message: 'Password berhasil diubah.' });
    }

    return NextResponse.json({ success: false, message: 'Action tidak valid.' }, { status: 400 });
  } catch (error) {
    console.error('PUT Profile Error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
