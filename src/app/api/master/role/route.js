import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { id: 'asc' }
    });

    const serializedData = JSON.parse(JSON.stringify(roles, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({
      success: true,
      message: "Data berhasil diambil.",
      data: serializedData
    });
  } catch (error) {
    console.error("GET Role Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
  }
}
