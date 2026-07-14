import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hashPassword } from "@/lib/hash";

const userSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi.").max(150),
  username: z.string().min(1, "Username wajib diisi.").max(50),
  password: z.string().min(6, "Password minimal 6 karakter."),
  telepon: z.string().max(30).optional().nullable(),
  cabang_id: z.string().or(z.number()),
  role_id: z.string().or(z.number()),
  aktif: z.number().int().min(0).max(1).default(1)
});

export async function GET(request) {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        cabang: true
      },
      orderBy: { nama: 'asc' }
    });

    // Remove passwords before sending to client
    const sanitizedUsers = users.map(user => {
      const { password, ...rest } = user;
      return rest;
    });

    const serializedData = JSON.parse(JSON.stringify(sanitizedUsers, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({
      success: true,
      message: "Data berhasil diambil.",
      data: serializedData
    });
  } catch (error) {
    console.error("GET User Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
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
    
    const { nama, username, password, telepon, cabang_id, role_id, aktif } = result.data;
    
    // Check for unique username
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Username sudah digunakan."
      }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        nama,
        username,
        password: hashedPassword,
        telepon,
        cabang_id: BigInt(cabang_id),
        role_id: BigInt(role_id),
        aktif
      }
    });
    
    const { password: _, ...userData } = newUser;

    const serializedData = JSON.parse(JSON.stringify(userData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil disimpan.",
      data: serializedData
    }, { status: 201 });
    
  } catch (error) {
    console.error("POST User Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
  }
}
