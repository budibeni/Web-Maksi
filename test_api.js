const { GET } = require('./src/app/api/lead/lost-stats/route.js');
const { prisma } = require('./src/lib/prisma');

async function test() {
  try {
    const url = 'http://localhost:3000/api/lead/lost-stats?startDate=2026-05-01&endDate=2026-07-31';
    // Mock the Request object of Next.js
    const req = {
      url,
      cookies: {
        get: () => ({ value: 'dummy' }) // We need to mock getCurrentUser to return a user
      }
    };
    
    // Instead of importing route which uses ES modules and imports Next/server, let's just run a node script that does exactly what the controller does but prints intermediate states!
    console.log('Running manual test...');
  } catch (err) {
    console.error(err);
  }
}

test();
