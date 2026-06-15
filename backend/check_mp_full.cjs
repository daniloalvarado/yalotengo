const https = require('https');

const ACCESS_TOKEN = 'TEST-8214313260341952-061510-d03bb46af78cbbb2c6a4b1e4a6f481b6-500028168';
const PUBLIC_KEY = 'TEST-cfbf3797-fd23-4fee-bd19-6a813bd52dec';

function apiRequest(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'api.mercadopago.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        ...headers,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function createToken(cardNumber, name) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      card_number: cardNumber,
      expiration_month: 11,
      expiration_year: 2030,
      security_code: "123",
      cardholder: {
        name: name,
        identification: { type: "DNI", number: "12345678" }
      }
    });
    const opts = {
      hostname: 'api.mercadopago.com',
      path: '/v1/card_tokens?public_key=' + PUBLIC_KEY,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve({ error: d }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function tryPayment(token, email, amount, label) {
  console.log(`\n--- Test: ${label} ---`);
  const result = await apiRequest('POST', '/v1/payments', {
    transaction_amount: amount,
    token: token,
    description: "Test payment",
    installments: 1,
    payment_method_id: "visa",
    payer: {
      email: email,
      identification: { type: "DNI", number: "12345678" }
    }
  }, { 'X-Idempotency-Key': 'test-' + Date.now() + '-' + Math.random() });
  
  console.log(`  HTTP Status: ${result.status}`);
  console.log(`  Payment status: ${result.data.status || 'N/A'}`);
  console.log(`  Status detail: ${result.data.status_detail || 'N/A'}`);
  if (result.data.error) console.log(`  ERROR: ${result.data.error}`);
  if (result.data.message) console.log(`  MESSAGE: ${result.data.message}`);
  if (result.data.cause) console.log(`  CAUSE: ${JSON.stringify(result.data.cause)}`);
  if (result.data.id) console.log(`  Payment ID: ${result.data.id}`);
  return result;
}

async function main() {
  // Step 1: Check test accounts
  console.log('=== 1. Check test users ===');
  const testUsers = await apiRequest('GET', '/users/test_user?limit=10');
  console.log('  Status:', testUsers.status);
  if (Array.isArray(testUsers.data)) {
    console.log('  Test users found:', testUsers.data.length);
    testUsers.data.forEach((u, i) => console.log(`  [${i}] id=${u.id} email=${u.email} site=${u.site_id}`));
  } else {
    console.log('  Response:', JSON.stringify(testUsers.data).substring(0, 500));
  }

  // Step 2: Create a test user if none exist
  console.log('\n=== 2. Create test buyer user ===');
  const newUser = await apiRequest('POST', '/users/test_user', { site_id: 'MPE' });
  console.log('  Status:', newUser.status);
  if (newUser.data.id) {
    console.log('  New test user ID:', newUser.data.id);
    console.log('  Email:', newUser.data.email);
    console.log('  Password:', newUser.data.password);
  } else {
    console.log('  Response:', JSON.stringify(newUser.data).substring(0, 500));
  }

  const testEmail = newUser.data.email || 'test_user_12345678@testuser.com';

  // Step 3: Generate fresh card token
  console.log('\n=== 3. Generate fresh card token ===');
  const token = await createToken("4009175332806176", "APRO");
  if (!token.id) {
    console.log('  FAILED to create token:', JSON.stringify(token));
    return;
  }
  console.log('  Token:', token.id);

  // Step 4: Try payment with different emails
  await tryPayment(token.id, testEmail, 5.00, `Test user email: ${testEmail}`);

  // Generate another token (tokens are single-use)
  const token2 = await createToken("4009175332806176", "APRO");
  await tryPayment(token2.id, 'comprador@ejemplo.com', 5.00, 'comprador@ejemplo.com');

  const token3 = await createToken("4009175332806176", "APRO");
  await tryPayment(token3.id, 'daniloalvarado2002@gmail.com', 5.00, 'daniloalvarado2002@gmail.com (owner email)');

  // Step 5: Try with Mastercard test card
  console.log('\n=== 5. Try with Mastercard ===');
  const token4 = await createToken("5031755734530604", "APRO");
  if (token4.id) {
    await tryPayment(token4.id, testEmail, 5.00, 'Mastercard with test user email');
  } else {
    console.log('  Mastercard token failed:', JSON.stringify(token4));
  }
}

main().catch(e => console.error('Script error:', e));
