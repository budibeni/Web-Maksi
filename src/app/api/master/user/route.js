import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hashPassword } from "@/lib/hash";
import { getCurrentUser } from "@/lib/jwt";
import { recordAuditLog } from "@/lib/audit";
import { parsePrismaFilters } from "@/lib/prisma-helper";

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
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const isExport = searchParams.get('export') === 'true';
    const sortField = searchParams.get('sortField') || 'nama';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') === 'asc' ? 'asc' : 'desc';

    const isPaginated = searchParams.has('page') || searchParams.has('limit') || searchParams.has('search') || isExport;

    if (!isPaginated) {
      const users = await prisma.user.findMany({
        include: {
          role: { select: { id: true, nama: true } },
          cabang: { select: { id: true, nama: true, kode: true } }
        },
        orderBy: { nama: 'asc' }
      });
      const sanitizedUsers = users.map(({ password, ...rest }) => rest);
      return NextResponse.json({
        success: true,
        message: "Data berhasil diambil.",
        data: serialize(sanitizedUsers)
      });
    }

    let whereClause = {};

    if (search) {
      whereClause.OR = [
        { nama: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Parse column filters dynamically
    const filterConditions = parsePrismaFilters(searchParams);
    
    // Konversi field bertipe integer/boolean
    const cleanedConditions = filterConditions.map(cond => {
      if (cond.aktif !== undefined) {
        if (typeof cond.aktif === 'object' && cond.aktif.equals !== undefined) {
          return { aktif: parseInt(cond.aktif.equals) };
        }
        return { aktif: parseInt(cond.aktif) };
      }
      return cond;
    });

    if (cleanedConditions.length > 0) {
      whereClause = { AND: [whereClause, ...cleanedConditions] };
    }

    const totalData = await prisma.user.count({ where: whereClause });
    const take = isExport ? 1000 : limit;
    const skip = isExport ? 0 : (page - 1) * limit;

    let orderByClause = {};
    if (sortField === 'role.nama') {
      orderByClause = { role: { nama: sortOrder } };
    } else if (sortField === 'cabang.nama') {
      orderByClause = { cabang: { nama: sortOrder } };
    } else {
      orderByClause[sortField] = sortOrder;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        role: { select: { id: true, nama: true } },
        cabang: { select: { id: true, nama: true, kode: true } }
      },
      orderBy: orderByClause,
      take,
      skip
    });

    const sanitizedUsers = users.map(({ password, ...rest }) => rest);

    if (isExport) {
      return NextResponse.json({
        success: true,
        message: "Data berhasil diambil.",
        data: serialize(sanitizedUsers)
      });
    }

    return NextResponse.json({
      success: true,
      message: "Data berhasil diambil.",
      data: serialize(sanitizedUsers),
      pagination: {
        totalData,
        totalPages: Math.ceil(totalData / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error("GET User Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

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

    // Record Audit Log
    await recordAuditLog({
      user: currentUser,
      modul: "USER",
      aksi: "CREATE",
      referensi_id: newUser.id,
      deskripsi: `Membuat pengguna baru: ${nama} (${username})`,
      data_sesudah: newUser,
      request
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
