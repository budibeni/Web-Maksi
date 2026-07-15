const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const countAll = await prisma.lead.count();
    const countLost = await prisma.lead.count({ where: { status: 3 } });
    const countDeal = await prisma.lead.count({ where: { status: 2 } });
    const countOpen = await prisma.lead.count({ where: { status: 1 } });
    console.log('Total Leads:', countAll);
    console.log('Lost Leads:', countLost);
    console.log('Deal Leads:', countDeal);
    console.log('Open Leads:', countOpen);

    const sampleLost = await prisma.lead.findFirst({
      where: { status: 3 },
      select: { id: true, nomor: true, status: true, tanggal_lost: true }
    });
    console.log('Sample Lost Lead:', sampleLost);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
