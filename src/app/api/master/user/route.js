import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hashPassword } from "@/lib/hash";

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

const userSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi.").max(150),
  email: z.string().email("Format email tidak valid.").max(150),
  username: z.string().min(1, "Username wajib diisi.").max(50),
  password: z.string().min(6, "Password minimal 6 karakter."),
  telepon: z.string().max(30).optional().nullable(),
  cabang_id: z.string().or(z.number()),
  role_id: z.string().or(z.number()),
  aktif: z.number().int().min(0).max(1).default(1)
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const cabang_id = searchParams.get('cabang_id') || '';
    const role_id = searchParams.get('role_id') || '';

    const where = {
      ...(search ? {
        OR: [
          { nama: { contains: search } },
          { username: { contains: search } },
          { email: { contains: search } },
        ]
      } : {}),
      ...(cabang_id ? { cabang_id: BigInt(cabang_id) } : {}),
      ...(role_id ? { role_id: BigInt(role_id) } : {}),
    };

    const users = await prisma.user.findMany({
      where,
      include: {
        role: { select: { id: true, nama: true } },
        cabang: { select: { id: true, nama: true, kode: true } }
      },
      orderBy: { nama: 'asc' }
    });

    const sanitizedUsers = users.map(user => {
      const { password, ...rest } = user;
      return rest;
    });

    return NextResponse.json({
      success: true,
      message: "Data berhasil diambil.",
      data: serialize(sanitizedUsers)
    });
  } catch (error) {
    console.error("GET User Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = userSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validasi gagal.",
        errors: result.error.flatten().fieldErrors
      }, { status: 422 });
    }
    
    const { nama, email, username, password, telepon, cabang_id, role_id, aktif } = result.data;
    
    // Check for unique username
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ success: false, message: "Username sudah digunakan." }, { status: 409 });
    }

    // Check for unique email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ success: false, message: "Email sudah digunakan." }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        nama,
        email,
        username,
        password: hashedPassword,
        telepon: telepon || null,
        cabang_id: BigInt(cabang_id),
        role_id: BigInt(role_id),
        aktif
      }
    });
    
    const { password: _, ...userData } = newUser;
    
    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil disimpan.",
      data: serialize(userData)
    }, { status: 201 });
    
  } catch (error) {
    console.error("POST User Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
