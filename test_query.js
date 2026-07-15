const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const startDateStr = '2026-07-01';
    const endDateStr = '2026-07-31';

    const baseFilter = {
      status: 3, // LOST
      tanggal_lost: {
        gte: new Date(`${startDateStr}T00:00:00`),
        lte: new Date(`${endDateStr}T23:59:59.999`),
      }
    };

    console.log('Querying with filter:', JSON.stringify(baseFilter, null, 2));

    const lostLeads = await prisma.lead.findMany({
      where: baseFilter,
      include: {
        user:   { select: { nama: true } },
        cabang: { select: { nama: true } },
      },
      orderBy: { tanggal_lost: 'desc' },
    });

    console.log('Total lost leads found in date range:', lostLeads.length);
    if (lostLeads.length > 0) {
      console.log('First lead:', JSON.stringify(lostLeads[0], (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
