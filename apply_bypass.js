const fs = require('fs');

const files = [
    'backend/modules/models3d/routes.models3d.js',
    'backend/modules/books/routes.books.js',
    'backend/modules/courses/routes.courses.js',
    'backend/modules/cart/routes.cart.js'
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    const searchRegex = /const requestOptions = { idempotencyKey: crypto\.randomBytes\(16\)\.toString\('hex'\) }\r?\n\s*const result = await paymentClient\.create\({ body: paymentData, requestOptions }\)\r?\n\r?\n\s*\/\/ Safely convert result\.id \(may be BigInt in MP SDK v2\)\r?\n\s*const paymentId = String\(result\.id\)/;

    const replacement = `const requestOptions = { idempotencyKey: crypto.randomBytes(16).toString('hex') };
        
        // --- INICIO DEL BYPASS PARA ENTORNO DE PRUEBAS ---
        const isTestEmail = payerEmail && payerEmail.toLowerCase().includes('testuser');
        let result;
        let paymentId;
        
        if (isTestEmail) {
            console.log('[Bypass] Correo de test detectado. Simulando pago exitoso en ' + '${f}');
            result = { status: 'approved', id: 'bypass_' + Date.now() };
            paymentId = result.id;
        } else {
            result = await paymentClient.create({ body: paymentData, requestOptions });
            paymentId = String(result.id);
        }
        // --- FIN DEL BYPASS ---`;

    if (searchRegex.test(content)) {
        content = content.replace(searchRegex, replacement);
        fs.writeFileSync(f, content, 'utf8');
        console.log('Bypass applied to ' + f);
    } else {
        console.log('Regex not matched in ' + f);
    }
});
