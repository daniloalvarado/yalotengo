import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, CreditCardIcon, CheckCircleIcon, AcademicCapIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

// Inicializar MercadoPago
const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY
initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-PE' })

const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })

export default function CoursesCheckout() {
    const location = useLocation()
    const navigate = useNavigate()
    const course = location.state?.course

    const [step, setStep] = useState('payment') // 'payment' | 'success'
    const [processing, setProcessing] = useState(false)
    const [purchaseResult, setPurchaseResult] = useState(null)
    const [paymentMethod, setPaymentMethod] = useState('card') // 'card' | 'yape'
    const [paymentError, setPaymentError] = useState(null)

    // Estado para Yape
    const [yapePhone, setYapePhone] = useState('')
    const [yapeOtp, setYapeOtp] = useState('')

    useEffect(() => {
        if (!course) {
            navigate('/courses')
        }
    }, [course, navigate])

    if (!course) return null

    const price = Number(course.cou_dec_price)

    const handleCardSubmit = async (formData) => {
        setProcessing(true)
        setPaymentError(null)
        try {
            const { data } = await api.post('/courses/purchase', {
                courseId: course.cou_int_id,
                token: formData.token,
                payment_method_id: formData.payment_method_id,
                issuer_id: formData.issuer_id,
                installments: formData.installments,
                payer: formData.payer
            })

            if (data.success) {
                setPurchaseResult(data)
                setStep('success')
                toast.success('¡Inscripción exitosa!')
            } else {
                setPaymentError(`Pago rechazado: ${data.statusDetail || 'Intenta de nuevo'}`)
            }
        } catch (e) {
            console.error('Error en pago:', e)
            const msg = e.response?.data?.error || 'Error procesando pago'
            setPaymentError(msg)
            toast.error(msg)
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
            const mp = new window.MercadoPago(MP_PUBLIC_KEY)

            const tokenResponse = await mp.createToken({
                paymentMethodId: 'yape',
                phone: yapePhone,
                otp: yapeOtp
            })

            if (!tokenResponse || !tokenResponse.token) {
                throw new Error('No se pudo generar el token de Yape')
            }

            const { data } = await api.post('/courses/purchase', {
                courseId: course.cou_int_id,
                token: tokenResponse.token,
                payment_method_id: 'yape',
                payer: { email: 'test_user_1717408837989222794@testuser.com' }
            })

            if (data.success) {
                setPurchaseResult(data)
                setStep('success')
                toast.success('¡Inscripción exitosa!')
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

    // Paso: Éxito
    if (step === 'success') {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="w-12 h-12 text-emerald-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Inscripción Exitosa!</h1>
                    <p className="text-gray-600 mb-6">
                        Te has inscrito al curso: <strong>{course.cou_txt_title}</strong>
                    </p>

                    <div className="bg-emerald-50 rounded-xl p-6 mb-6">
                        <p className="text-emerald-800">
                            📧 Te enviaremos un email con los detalles de acceso al curso y las instrucciones para comenzar.
                        </p>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => navigate('/courses')}
                            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Ver más cursos
                        </button>
                        <button
                            onClick={() => navigate('/purchases')}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
                        >
                            Mis compras
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Paso: Pago
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Back button */}
            <button
                onClick={() => navigate('/courses')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                Volver a cursos
            </button>

            <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Course preview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden self-start">
                    <div className="aspect-video bg-gradient-to-br from-emerald-100 to-emerald-200 relative overflow-hidden">
                        {course.cou_txt_image ? (
                            <img
                                src={
                                    course.cou_txt_image.startsWith('http')
                                        ? course.cou_txt_image
                                        : `${api.defaults.baseURL?.replace(/\/api\/?$/, '')}/uploads/courses/${course.cou_txt_image}`
                                }
                                alt={course.cou_txt_title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <AcademicCapIcon className="w-16 h-16 text-emerald-400" />
                            </div>
                        )}
                    </div>
                    <div className="p-5">
                        <h2 className="text-xl font-bold text-gray-900">{course.cou_txt_title}</h2>
                        {course.cou_txt_desc && (
                            <p className="text-gray-600 mt-2 text-sm">{course.cou_txt_desc}</p>
                        )}
                        {course.cou_txt_duration && (
                            <p className="text-emerald-600 text-sm mt-2">⏱ {course.cou_txt_duration}</p>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-gray-500">Total a pagar:</span>
                            <span className="text-2xl font-bold text-emerald-600">
                                {PEN.format(price)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Formulario de pago */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCardIcon className="w-6 h-6 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900">Método de Pago</h3>
                    </div>

                    {/* Tabs de método de pago */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setPaymentMethod('card')}
                            className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'card'
                                ? 'border-emerald-600 bg-emerald-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <CreditCardIcon className="w-6 h-6" />
                            <span className="font-medium">Tarjeta</span>
                            <span className="text-xs text-gray-500">{PEN.format(price)}</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('yape')}
                            className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'yape'
                                ? 'border-[#00D1AE] bg-[#f0fdfa]'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <DevicePhoneMobileIcon className="w-6 h-6" />
                            <span className="font-medium">Yape</span>
                            <span className="text-xs text-gray-500">{PEN.format(price)}</span>
                        </button>
                    </div>

                    {paymentError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {paymentError}
                        </div>
                    )}

                    {processing ? (
                        <div className="py-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Procesando pago...</p>
                        </div>
                    ) : paymentMethod === 'card' ? (
                        <CardPayment
                            initialization={{ amount: price }}
                            customization={{
                                paymentMethods: { maxInstallments: 1 },
                                visual: {
                                    style: {
                                        theme: 'default',
                                        customVariables: {
                                            formBackgroundColor: '#ffffff',
                                            baseColor: '#059669'
                                        }
                                    }
                                }
                            }}
                            onSubmit={handleCardSubmit}
                            onReady={() => console.log('CardPayment ready')}
                            onError={(error) => console.error('MP CardPayment Error:', error)}
                        />
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-[#f0fdfa] border border-[#99f6e4] rounded-lg p-4 text-sm text-[#0f766e]">
                                <strong>¿Cómo pagar con Yape?</strong>
                                <ol className="mt-2 ml-4 list-decimal space-y-1">
                                    <li>Ingresa tu número de teléfono registrado en Yape</li>
                                    <li>Abre tu app Yape</li>
                                    <li>Ve a "Compras online" y obtén tu código de 6 dígitos</li>
                                    <li>Ingresa el código aquí y confirma el pago</li>
                                </ol>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número de teléfono
                                </label>
                                <input
                                    type="tel"
                                    placeholder="9XX XXX XXX"
                                    value={yapePhone}
                                    onChange={(e) => setYapePhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                    maxLength={9}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D1AE] focus:border-[#00D1AE] outline-none"
                                />
                                <span className="text-xs text-gray-500">Tu número registrado en Yape</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Código de aprobación (OTP)
                                </label>
                                <input
                                    type="text"
                                    placeholder="XXXXXX"
                                    value={yapeOtp}
                                    onChange={(e) => setYapeOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D1AE] focus:border-[#00D1AE] outline-none"
                                />
                                <span className="text-xs text-gray-500">Código de 6 dígitos de tu app Yape</span>
                            </div>

                            <button
                                onClick={handleYapePayment}
                                disabled={!yapePhone || yapePhone.length < 9 || !yapeOtp || yapeOtp.length !== 6}
                                className="w-full py-3 bg-[#00D1AE] hover:bg-[#00b89d] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <DevicePhoneMobileIcon className="w-5 h-5" />
                                Pagar {PEN.format(price)} con Yape
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
