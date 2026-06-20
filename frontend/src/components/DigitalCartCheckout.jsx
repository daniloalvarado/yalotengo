import { useState, useEffect } from 'react'
import { initMercadoPago } from '@mercadopago/sdk-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, CreditCardIcon, CheckCircleIcon, ArrowDownTrayIcon, DevicePhoneMobileIcon, TrashIcon, ShieldCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import MercadoPagoForm from './MercadoPagoForm'

// Inicializar MercadoPago
const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY
initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-PE' })

const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })

export default function DigitalCartCheckout({ items, onPaymentSuccess }) {
    const [processing, setProcessing] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('card') // 'card' | 'yape'
    const [paymentError, setPaymentError] = useState(null)

    // Estado para Yape
    const [yapePhone, setYapePhone] = useState('')
    const [yapeOtp, setYapeOtp] = useState('')
    const [step, setStep] = useState('payment') // payment, success

    // Calcular total
    const totalAmount = items.reduce((acc, item) => {
        const price = item.model?.mod_dec_price || item.book?.boo_dec_price || item.course?.cou_dec_price || 0
        // Usar pur_dec_amount si está disponible, sino precio del producto
        const itemPrice = Number(item.pur_dec_amount || item.bpu_dec_amount || item.cpu_dec_amount || price)

        // Determinar cantidad según el tipo de item
        let quantity = 1
        if (item.pur_int_quantity) quantity = item.pur_int_quantity
        else if (item.cpu_int_quantity) quantity = item.cpu_int_quantity

        return acc + (itemPrice * quantity)
    }, 0)

    const handleCardSubmit = async (formData) => {
        setProcessing(true)
        setPaymentError(null)
        try {
            // Preparar items para el backend
            const cartItems = items.map(item => {
                let type = ''
                let id = 0
                if (item.model) { type = 'model'; id = item.pur_int_id }
                else if (item.book) { type = 'book'; id = item.bpu_int_id }
                else if (item.course) { type = 'course'; id = item.cpu_int_id }
                return { type, id }
            })

            const { data } = await api.post('/cart/purchase', {
                items: cartItems,
                token: formData.token,
                payment_method_id: formData.payment_method_id,
                issuer_id: formData.issuer_id,
                installments: formData.installments,
                payer: formData.payer
            })

            if (data.success) {
                toast.success('¡Compra exitosa!')
                if (onPaymentSuccess) onPaymentSuccess(data)
            } else {
                setPaymentError(`Pago rechazado: ${data.statusDetail || 'Intenta de nuevo'}`)
            }
        } catch (e) {
            console.error('Error en pago:', e)
            setPaymentError(e.response?.data?.error || 'Error procesando pago')
        } finally {
            setProcessing(false)
        }
    }

    const handleYapePayment = async () => {
        if (!yapePhone || yapePhone.length < 9) {
            setPaymentError('Ingresa un número de teléfono válido')
            return
        }
        if (!yapeOtp || yapeOtp.length !== 6) {
            setPaymentError('Ingresa el código OTP de 6 dígitos de tu app Yape')
            return
        }

        setProcessing(true)
        setPaymentError(null)

        try {
            // Generar token de Yape usando el SDK de MP
            const mp = new window.MercadoPago(MP_PUBLIC_KEY)

            const tokenResponse = await mp.createToken({
                paymentMethodId: 'yape',
                phone: yapePhone,
                otp: yapeOtp
            })

            if (!tokenResponse || !tokenResponse.token) {
                throw new Error('No se pudo generar el token de Yape')
            }

            // Preparar items para el backend
            const cartItems = items.map(item => {
                let type = ''
                let id = 0
                if (item.model) { type = 'model'; id = item.pur_int_id }
                else if (item.book) { type = 'book'; id = item.bpu_int_id }
                else if (item.course) { type = 'course'; id = item.cpu_int_id }
                return { type, id }
            })

            // Enviar al backend
            const { data } = await api.post('/cart/purchase', {
                items: cartItems,
                token: tokenResponse.token,
                payment_method_id: 'yape',
                payer: { email: 'test_user_1717408837989222794@testuser.com' }
            })

            if (data.success) {
                toast.success('¡Compra exitosa!')
                if (onPaymentSuccess) onPaymentSuccess(data)
            } else {
                setPaymentError(data.statusDetail || 'El pago fue rechazado')
            }
        } catch (err) {
            console.error('Yape payment error:', err)
            if (err.message?.includes('otp') || err.message?.includes('OTP')) {
                setPaymentError('Código OTP incorrecto. Genera uno nuevo en tu app Yape.')
            } else if (err.message?.includes('phone')) {
                setPaymentError('Número de teléfono no válido o no registrado en Yape.')
            } else {
                setPaymentError(err.response?.data?.error || err.message || 'Error al procesar el pago con Yape')
            }
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Resumen del Pedido</h3>

            <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-gray-600 dark:text-gray-400">Total ({items.length} {items.length === 1 ? 'producto' : 'productos'})</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{PEN.format(totalAmount)}</span>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <ShieldCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pago Seguro con MercadoPago</span>
            </div>

            {/* Selector de Método de Pago */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'card'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-600 dark:text-gray-400'
                        }`}
                >
                    <CreditCardIcon className="w-6 h-6" />
                    <span className="font-medium text-sm">Tarjeta</span>
                </button>
                <button
                    onClick={() => setPaymentMethod('yape')}
                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'yape'
                        ? 'border-[#00D1AE] bg-[#f0fdfa] dark:bg-[#00D1AE]/10 text-[#00D1AE]'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-600 dark:text-gray-400'
                        }`}
                >
                    <DevicePhoneMobileIcon className="w-6 h-6" />
                    <span className="font-medium text-sm">Yape</span>
                </button>
            </div>

            {paymentError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {paymentError}
                </div>
            )}

            {/* Formularios de Pago */}
            {processing ? (
                <div className="py-8 text-center bg-gray-50 dark:bg-[#141414] rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 dark:border-emerald-500 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Procesando pago...</p>
                </div>
            ) : paymentMethod === 'card' ? (
                <MercadoPagoForm 
                    price={totalAmount}
                    onSubmit={handleCardSubmit}
                />
            ) : (
                <div className="space-y-4 animate-fadeIn">
                    <div className="bg-[#f0fdfa] dark:bg-[#00D1AE]/10 border border-[#99f6e4] dark:border-[#00D1AE]/30 rounded-lg p-3 text-xs text-[#0f766e] dark:text-[#00D1AE]">
                        Ingresa tu número y el código de aprobación (OTP) desde la app de Yape.
                    </div>

                    <div>
                        <input
                            type="tel"
                            placeholder="Número de celular Yape"
                            value={yapePhone}
                            onChange={(e) => setYapePhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                            maxLength={9}
                            className="w-full px-4 py-2.5 bg-white dark:bg-[#141414] border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#00D1AE] outline-none text-sm"
                        />
                    </div>

                    <div>
                        <input
                            type="text"
                            placeholder="Código OTP (6 dígitos)"
                            value={yapeOtp}
                            onChange={(e) => setYapeOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            className="w-full px-4 py-2.5 bg-white dark:bg-[#141414] border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#00D1AE] outline-none text-sm"
                        />
                    </div>

                    <button
                        onClick={handleYapePayment}
                        disabled={!yapePhone || yapePhone.length < 9 || !yapeOtp || yapeOtp.length !== 6}
                        className="w-full py-3 bg-[#00D1AE] hover:bg-[#00b89d] disabled:bg-gray-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-100 dark:shadow-none"
                    >
                        <LockClosedIcon className="w-4 h-4" />
                        Pagar {PEN.format(totalAmount)}
                    </button>
                </div>
            )}
        </div>
    )
}
