import { MercadoPagoConfig, Payment } from 'mercadopago';

const mp = new MercadoPagoConfig({ accessToken: 'TEST-8298012952990513-012611-2b60703f4d2a951d5dca1e74d57cce5e-500028168' });
const paymentClient = new Payment(mp);

async function testMP() {
    try {
        await paymentClient.create({
            body: {
                transaction_amount: 100,
                token: 'dummy_invalid_token_123',
                description: 'Test',
                installments: 1,
                payment_method_id: 'visa',
                payer: {
                    email: 'test@example.com'
                }
            }
        });
    } catch (e) {
        console.log("Error object keys:", Object.keys(e));
        console.log("e.status:", e.status);
        console.log("e.api_response?.status:", e.api_response?.status);
        console.log("e.message:", e.message);
        console.log("e.cause:", e.cause);
    }
}

testMP();
