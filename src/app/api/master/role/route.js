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

    const orderMap = {
      'sales': 1,
      'branch manager': 2,
      'top management': 3,
      'administrator': 4
    };

    const sortedData = serializedData.sort((a, b) => {
      const weightA = orderMap[a.nama.toLowerCase()] || 99;
      const weightB = orderMap[b.nama.toLowerCase()] || 99;
      return weightA - weightB;
    });

    return NextResponse.json({
      success: true,
      message: "Data berhasil diambil.",
      data: sortedData
    });
  } catch (error) {
    console.error("GET Role Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
  }
}
