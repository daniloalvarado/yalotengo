import https from 'https';

const BACKEND = 'yalotengo.onrender.com';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VfaW50X2lkIjo3LCJlbWFpbCI6Imxlb2FsdmFyYWRvMTIwM0BnbWFpbC5jb20iLCJyb2xlIjoiY2xpZW50ZSIsImlhdCI6MTc4MTQ5NDQzMiwiZXhwIjoxNzgyMDk5MjMyfQ.JzTXB6k2QGaywqXU2LwrUlW0ahP2Un__xpTnDrjR0YA';

function request(method, path, body = null) {
    return new Promise((resolve) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: BACKEND,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${TOKEN}`,
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: data });
            });
        });
        req.on('error', (e) => {
            resolve({ status: 0, body: e.message });
        });
        if (payload) req.write(payload);
        req.end();
    });
}

async function run() {
    console.log('🔍 TEST DE PAGO CONTRA PRODUCCIÓN');
    console.log(`Hora: ${new Date().toISOString()}\n`);

    // 1. Verificar que el token es válido
    console.log('=== 1. Verificar token (GET /auth/me) ===');
    const me = await request('GET', '/auth/me');
    console.log(`  Status: ${me.status}`);
    console.log(`  Body: ${me.body.substring(0, 300)}`);
    if (me.status !== 200) {
        console.log('  ❌ Token inválido. No puedo continuar.');
        return;
    }
    console.log('  ✅ Token válido\n');

    // 2. Obtener un modelo para probar
    console.log('=== 2. Obtener modelo para probar ===');
    const models = await request('GET', '/models3d');
    const modelList = JSON.parse(models.body);
    const testModel = modelList[0];
    console.log(`  Modelo: ID=${testModel.mod_int_id}, "${testModel.mod_txt_name}", precio=${testModel.mod_dec_price}\n`);

    // 3. SIMULAR PAGO (con token de tarjeta falso - lo importante es ver el ERROR)
    console.log('=== 3. Simular pago (token de tarjeta falso) ===');
    console.log('  Enviando POST /models3d/purchase...');
    const purchaseResult = await request('POST', '/models3d/purchase', {
        modelId: testModel.mod_int_id,
        token: 'fake_card_token_test_123',
        payment_method_id: 'visa',
        issuer_id: null,
        installments: 1,
        payer: {
            email: 'comprador@ejemplo.com',
            identification: {
                type: 'DNI',
                number: '12345678'
            }
        }
    });
    
    console.log(`  Status: ${purchaseResult.status}`);
    console.log(`  Body: ${purchaseResult.body}`);
    
    if (purchaseResult.status === 500) {
        console.log('\n  ❌❌❌ ERROR 500 CONFIRMADO ❌❌❌');
        console.log('  El error COMPLETO del servidor es:');
        try {
            const err = JSON.parse(purchaseResult.body);
            console.log('  Error:', JSON.stringify(err, null, 2));
        } catch {
            console.log('  Raw:', purchaseResult.body);
        }
    } else if (purchaseResult.status === 400) {
        console.log('\n  ✅ El servidor respondió 400 (pago rechazado, pero NO crasheó)');
        console.log('  Esto significa que el fix YA ESTÁ FUNCIONANDO en producción');
    } else {
        console.log(`\n  Status ${purchaseResult.status} - respuesta inesperada`);
    }

    console.log('\n=== DONE ===\n');
}

run();
