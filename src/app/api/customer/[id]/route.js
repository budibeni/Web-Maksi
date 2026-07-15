import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { recordAuditLog } from '@/lib/audit';
import { z } from 'zod';

const customerSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi.").max(150, "Maksimal 150 karakter."),
  telepon: z.string().min(1, "Nomor HP wajib diisi.").max(20, "Maksimal 20 karakter."),
  alamat: z.string().nullable().optional(),
  catatan: z.string().nullable().optional(),
});

function serializeData(data) {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);

    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return NextResponse.json({ success: false, message: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: serializeData(customer)
    });
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const id = BigInt(params.id);
    const body = await request.json();
    
    const result = customerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error.errors[0].message }, { status: 400 });
    }

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      return NextResponse.json({ success: false, message: 'Data tidak ditemukan' }, { status: 404 });
    }

    const { nama, telepon, alamat, catatan } = result.data;

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        nama,
        telepon,
        alamat: alamat || null,
        catatan: catatan || null,
        diubah_oleh: user.nama,
        diubah_tanggal: new Date(),
      }
    });

    // Record Audit Log
    await recordAuditLog({
      user,
      modul: "CUSTOMER",
      aksi: "UPDATE",
      referensi_id: id,
      deskripsi: `Memperbarui customer: ${nama} (${telepon})`,
      data_sebelum: existingCustomer,
      data_sesudah: updatedCustomer,
      request
    });

    return NextResponse.json({
      success: true,
      message: 'Customer berhasil diperbarui',
      data: serializeData(updatedCustomer)
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const id = BigInt(params.id);

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      return NextResponse.json({ success: false, message: 'Data tidak ditemukan' }, { status: 404 });
    }

    // Guard: Cek relasi dengan tb_lead (tidak boleh dihapus jika sudah ada Lead)
    const leadCount = await prisma.lead.count({ where: { customer_id: id } });
    if (leadCount > 0) {
      return NextResponse.json({
        success: false,
        message: "Customer ini memiliki data lead transaksi. Customer tidak dapat dihapus."
      }, { status: 409 });
    }

    await prisma.customer.delete({ where: { id } });

    // Record Audit Log
    await recordAuditLog({
      user,
      modul: "CUSTOMER",
      aksi: "DELETE",
      referensi_id: id,
      deskripsi: `Menghapus customer: ${existingCustomer.nama} (${existingCustomer.telepon})`,
      data_sebelum: existingCustomer,
      request
    });

    return NextResponse.json({
      success: true,
      message: 'Customer berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
