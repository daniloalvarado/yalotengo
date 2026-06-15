// Quick script to check production state
const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== 1. Health check ===');
  const health = await get('https://yalotengo.onrender.com/health');
  console.log('  Status:', health.status, 'Body:', health.body);

  console.log('\n=== 2. Debug logs ===');
  const logs = await get('https://yalotengo.onrender.com/debug-logs');
  console.log('  Status:', logs.status);
  try {
    const parsed = JSON.parse(logs.body);
    if (parsed.length === 0) {
      console.log('  (empty - no errors captured yet)');
    } else {
      parsed.forEach((log, i) => console.log(`  [${i}]`, log));
    }
  } catch(e) {
    console.log('  Raw:', logs.body.substring(0, 2000));
  }

  console.log('\n=== 3. Test purchase (fake token, model 9) ===');
  const data = JSON.stringify({
    modelId: 9, token: 'test_fake_token',
    payment_method_id: 'visa', issuer_id: '12551',
    installments: 1,
    payer: { email: 'comprador@ejemplo.com', identification: { type: 'DNI', number: '12345678' } }
  });
  
  const result = await new Promise((resolve, reject) => {
    const opts = {
      hostname: 'yalotengo.onrender.com', path: '/models3d/purchase', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VfaW50X2lkIjo3LCJlbWFpbCI6Imxlb2FsdmFyYWRvMTIwM0BnbWFpbC5jb20iLCJyb2xlIjoiY2xpZW50ZSIsImlhdCI6MTc4MTQ5NDQzMiwiZXhwIjoxNzgyMDk5MjMyfQ.JzTXB6k2QGaywqXU2LwrUlW0ahP2Un__xpTnDrjR0YA',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });

  console.log('  Status:', result.status);
  console.log('  Body:', result.body);

  // Now check logs again
  console.log('\n=== 4. Debug logs AFTER purchase attempt ===');
  const logs2 = await get('https://yalotengo.onrender.com/debug-logs');
  try {
    const parsed = JSON.parse(logs2.body);
    if (parsed.length === 0) {
      console.log('  (still empty)');
    } else {
      parsed.forEach((log, i) => console.log(`  [${i}]`, log));
    }
  } catch(e) {
    console.log('  Raw:', logs2.body.substring(0, 2000));
  }
}

main().catch(e => console.error('Script error:', e));
