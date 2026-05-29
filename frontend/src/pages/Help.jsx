// src/pages/Help.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import {
    QuestionMarkCircleIcon,
    ShoppingCartIcon,
    CreditCardIcon,
    TicketIcon,
    CubeIcon,
    BookOpenIcon,
    AcademicCapIcon,
    ChartBarIcon,
    ArrowUpTrayIcon,
    QrCodeIcon,
    ChatBubbleLeftRightIcon,
    EnvelopeIcon,
    PhoneIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline'
import { cascade } from '../utils/animations'

const THEME = { primary: '#059669' }

// FAQs para usuarios normales
const USER_FAQS = [
    {
        icon: ShoppingCartIcon,
        question: '¿Cómo puedo comprar un producto?',
        answer: 'Navega a la sección de Modelos 3D, Libros o Cursos. Selecciona el producto que deseas y haz clic en "Comprar". Serás redirigido a la página de pago donde podrás completar tu compra usando Yape o transferencia bancaria.'
    },
    {
        icon: CreditCardIcon,
        question: '¿Qué métodos de pago aceptan?',
        answer: 'Aceptamos pagos por Yape y transferencia bancaria. Una vez realizado el pago, recibirás acceso inmediato a tu compra digital.'
    },
    {
        icon: CubeIcon,
        question: '¿Cómo descargo mis modelos 3D comprados?',
        answer: 'Después de realizar tu compra, ve a "Mis Compras" en el menú. Allí encontrarás todos tus productos digitales disponibles para descargar en formato GLB.'
    },
    {
        icon: BookOpenIcon,
        question: '¿Cómo accedo a los libros que compré?',
        answer: 'Tus libros estarán disponibles en la sección "Mis Compras". Podrás visualizarlos en línea o descargarlos en formato PDF para leer sin conexión.'
    },
    {
        icon: AcademicCapIcon,
        question: '¿Cómo funcionan los cursos?',
        answer: 'Al comprar un curso, tendrás acceso al contenido completo. Puedes avanzar a tu propio ritmo y revisar el material las veces que necesites.'
    },
    {
        icon: TicketIcon,
        question: '¿Cómo hago una reserva para el museo?',
        answer: 'Ve a la sección "Reservas" y selecciona la fecha y hora de tu visita. Elige la cantidad de entradas y realiza el pago. Recibirás un código QR que deberás presentar en la entrada.'
    },
    {
        icon: QrCodeIcon,
        question: '¿Qué hago si perdí mi código QR de reserva?',
        answer: 'No te preocupes. Puedes acceder a tus reservas desde "Mis Reservas" donde encontrarás todos tus códigos QR activos.'
    }
]

// FAQs para administradores
const ADMIN_FAQS = [
    {
        icon: ChartBarIcon,
        question: '¿Qué muestra el Dashboard?',
        answer: 'El Dashboard muestra las estadísticas generales de tu negocio: ingresos totales, ventas por categoría (Modelos 3D, Libros, Cursos), y estadísticas de reservas del museo incluyendo visitantes del día.'
    },
    {
        icon: CubeIcon,
        question: '¿Cómo agrego un nuevo modelo 3D?',
        answer: 'Ve a "Modelos 3D" > "Agregar Modelo". Sube el archivo GLB (máximo 50MB), ingresa el nombre, descripción y precio. El modelo estará disponible inmediatamente en la tienda.'
    },
    {
        icon: BookOpenIcon,
        question: '¿Cómo subo un nuevo libro?',
        answer: 'En "Libros" > "Agregar Libro", puedes subir el archivo PDF y una imagen de portada. Completa el título, autor, descripción y precio.'
    },
    {
        icon: AcademicCapIcon,
        question: '¿Cómo creo un nuevo curso?',
        answer: 'En "Cursos" > "Agregar Curso", sube una imagen representativa, escribe el título, descripción, duración estimada y precio.'
    },
    {
        icon: ArrowUpTrayIcon,
        question: '¿Qué formatos de archivo puedo subir?',
        answer: 'Modelos 3D: archivos .glb (hasta 50MB). Libros: archivos .pdf (hasta 100MB). Imágenes: .jpg, .png, .webp, .gif (hasta 10MB).'
    },
    {
        icon: QrCodeIcon,
        question: '¿Cómo valido las entradas del museo?',
        answer: 'En "Reservas" encontrarás el escáner QR. Escanea el código del visitante para validar su entrada. El sistema te mostrará los detalles de la reserva.'
    },
    {
        icon: TicketIcon,
        question: '¿Cómo veo el historial de ventas?',
        answer: 'En cada sección (Modelos 3D, Libros, Cursos) hay una pestaña "Compras" donde puedes ver todas las transacciones realizadas con filtro de búsqueda.'
    }
]

function FAQItem({ faq, index = 0 }) {
    const [isOpen, setIsOpen] = useState(false)
    const Icon = faq.icon

    return (
        <div {...cascade(index, "border border-gray-200 rounded-xl overflow-hidden")}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
            >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${THEME.primary}15` }}>
                    <Icon className="w-5 h-5" style={{ color: THEME.primary }} />
                </div>
                <span className="flex-1 font-medium text-gray-900">{faq.question}</span>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-4 pb-4 pl-[68px] text-gray-600 text-sm leading-relaxed">
                    {faq.answer}
                </div>
            )}
        </div>
    )
}

export default function Help() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [config, setConfig] = useState({
        HELP_CONTACT_WHATSAPP: '+51953808566',
        HELP_CONTACT_EMAIL: 'daniloalvarado2002@gmail.com'
    })
    const [savingConfig, setSavingConfig] = useState(false)

    useEffect(() => {
        const fetchUserAndConfig = async () => {
            const token = localStorage.getItem('token')

            try {
                const configRes = await api.get('/config')
                if (configRes.data) {
                    setConfig(prev => ({ ...prev, ...configRes.data }))
                }
            } catch (e) {
                console.error('Error fetching config:', e)
            }

            if (!token) {
                setLoading(false)
                return
            }
            try {
                const res = await api.get('/auth/me')
                setUser(res.data.user || res.data)
            } catch (e) {
                console.error('Error fetching user:', e)
            } finally {
                setLoading(false)
            }
        }
        fetchUserAndConfig()
    }, [])

    const handleSaveConfig = async () => {
        setSavingConfig(true)
        try {
            await api.put('/config/HELP_CONTACT_WHATSAPP', { value: config.HELP_CONTACT_WHATSAPP })
            await api.put('/config/HELP_CONTACT_EMAIL', { value: config.HELP_CONTACT_EMAIL })
            toast.success('Contactos actualizados correctamente')
        } catch (error) {
            console.error('Error saving config:', error)
            toast.error('Error al guardar los textos')
        } finally {
            setSavingConfig(false)
        }
    }

    const isAdmin = user?.use_txt_role === 'admin'
    const faqs = isAdmin ? ADMIN_FAQS : USER_FAQS

    const openWhatsApp = () => {
        const message = encodeURIComponent('Hola, necesito ayuda con la plataforma.')
        window.open(`https://wa.me/${(config.HELP_CONTACT_WHATSAPP || '').replace(/\+/g, '')}?text=${message}`, '_blank')
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <div {...cascade(1)} className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: `${THEME.primary}15` }}>
                    <QuestionMarkCircleIcon className="w-8 h-8" style={{ color: THEME.primary }} />
                </div>
                <h1 {...cascade(2)} className="text-2xl font-bold text-gray-900">Centro de Ayuda</h1>
                <p {...cascade(3)} className="text-gray-500">
                    {isAdmin ? 'Guía para administrar la plataforma' : 'Encuentra respuestas a las preguntas más frecuentes'}
                </p>
            </div>

            {/* FAQs */}
            <div className="space-y-3">
                <h2 {...cascade(4)} className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="w-5 h-5" style={{ color: THEME.primary }} />
                    Preguntas Frecuentes
                </h2>
                <div className="space-y-2">
                    {faqs.map((faq, i) => (
                        <FAQItem key={i} faq={faq} index={i + 5} />
                    ))}
                </div>
            </div>

            {/* Contact Section */}
            <div {...cascade(3)} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">¿Necesitas más ayuda?</h2>
                <p className="text-gray-600 text-sm">
                    Si no encontraste la respuesta que buscabas, contáctanos directamente. Estamos aquí para ayudarte.
                </p>

                {isAdmin && (
                    <div className="space-y-2 mt-4">
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <div className="flex-1 flex items-center border-b border-gray-300 focus-within:border-green-500 pb-1">
                                <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                                <input
                                    className="text-gray-900 bg-transparent outline-none w-full text-sm"
                                    value={config.HELP_CONTACT_WHATSAPP}
                                    onChange={(e) => setConfig({ ...config, HELP_CONTACT_WHATSAPP: e.target.value })}
                                    placeholder="WhatsApp (ej. +51...)"
                                />
                            </div>
                            <div className="flex-1 flex items-center border-b border-gray-300 focus-within:border-green-500 pb-1">
                                <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                                <input
                                    className="text-gray-900 bg-transparent outline-none w-full text-sm"
                                    value={config.HELP_CONTACT_EMAIL}
                                    onChange={(e) => setConfig({ ...config, HELP_CONTACT_EMAIL: e.target.value })}
                                    placeholder="Correo Electrónico"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={handleSaveConfig}
                                disabled={savingConfig}
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {savingConfig ? 'Guardando...' : 'Guardar Contactos'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={openWhatsApp}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                    >
                        <PhoneIcon className="w-5 h-5" />
                        WhatsApp
                    </button>
                    <a
                        href={`mailto:${config.HELP_CONTACT_EMAIL}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium border border-gray-200 transition-colors"
                    >
                        <EnvelopeIcon className="w-5 h-5" />
                        Email
                    </a>
                </div>

                <div className="pt-2 text-sm text-gray-500 space-y-1">
                    <p className="flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4" />
                        {config.HELP_CONTACT_WHATSAPP}
                    </p>
                    <p className="flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4" />
                        {config.HELP_CONTACT_EMAIL}
                    </p>
                </div>

                {!isAdmin && (
                    <div className="pt-4 mt-2 border-t border-teal-100/60 text-center text-sm text-gray-500">
                        Desarrollado por <a href="https://daniloalvarado.com" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">daniloalvarado.com</a>
                    </div>
                )}
            </div>

            {/* Back link */}
            <div {...cascade(4)} className="text-center">
                <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
                    ← Volver al inicio
                </Link>
            </div>
        </div>
    )
}
