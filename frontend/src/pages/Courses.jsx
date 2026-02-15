import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import Tooltip from '../components/Tooltip'
import toast from 'react-hot-toast'
import { AcademicCapIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'

const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })

export default function Courses() {
    const navigate = useNavigate()
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [addingToCart, setAddingToCart] = useState({})

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const { data } = await api.get('/courses')
                setCourses(data)
            } catch (e) {
                setError('Error al cargar cursos')
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchCourses()
    }, [])

    const handleBuy = async (course) => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/auth', { state: { from: '/courses' } })
            return
        }

        // Validación de Perfil
        try {
            const { data } = await api.get('/auth/me')
            const u = data.user
            const missing = []
            if (!u.use_txt_documento) missing.push('DNI')
            if (!u.use_txt_phone) missing.push('Teléfono')
            if (!u.use_txt_address) missing.push('Dirección')

            if (missing.length > 0) {
                toast.error(`Para comprar cursos debes completar: ${missing.join(', ')}`, { duration: 5000 })
                navigate('/profile', { state: { missing } })
                return
            }
        } catch (e) {
            console.error('Validation error', e)
            return
        }

        navigate('/courses/checkout', { state: { course } })
    }

    const handleAddToCart = async (course) => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/auth', { state: { from: '/courses' } })
            return
        }

        setAddingToCart(prev => ({ ...prev, [course.cou_int_id]: true }))
        try {
            const { data } = await api.post('/courses/cart', { courseId: course.cou_int_id })
            const qty = data.cartItem?.quantity || data.cartItem?.cpu_int_quantity || 1
            toast.success(`Curso añadido. Tienes ${qty} cupo${qty > 1 ? 's' : ''} en el carrito`)
            window.dispatchEvent(new Event('cart:update'))
        } catch (e) {
            const msg = e.response?.data?.error || 'Error al añadir al carrito'
            toast.error(msg)
        } finally {
            setAddingToCart(prev => ({ ...prev, [course.cou_int_id]: false }))
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <AcademicCapIcon className="w-8 h-8 text-emerald-600" />
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Cursos Online
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Aprende robótica, drones e impresión 3D con nuestros expertos
                    </p>
                </div>

                {error && (
                    <div className="text-center text-red-600 mb-6">{error}</div>
                )}

                {courses.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-12">
                        No hay cursos disponibles en este momento.
                    </div>
                )}

                {/* Courses Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div
                            key={course.cou_int_id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1 relative z-0 hover:z-10 group"
                        >
                            {/* Course Image - SIN EL HOVER DE PLAY */}
                            <div className="aspect-video bg-gradient-to-br from-emerald-100 to-emerald-200 relative overflow-hidden rounded-t-2xl">
                                {course.cou_txt_image ? (
                                    <img
                                        src={
                                            course.cou_txt_image.startsWith('http') ? course.cou_txt_image :
                                                `/uploads/courses/${course.cou_txt_image}`
                                        }
                                        onError={(e) => {
                                            // Fallback para imágenes antiguas en /cursos
                                            if (!e.target.src.includes('/cursos/')) {
                                                e.target.src = `/cursos/${course.cou_txt_image}`
                                            }
                                        }}
                                        alt={course.cou_txt_title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <AcademicCapIcon className="w-16 h-16 text-emerald-400" />
                                    </div>
                                )}
                                {/* Se eliminó el div del PlayCircleIcon aquí */}
                            </div>

                            {/* Course Info */}
                            <div className="p-5">
                                <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2">
                                    {course.cou_txt_title}
                                </h3>

                                {course.cou_txt_desc && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                        {course.cou_txt_desc}
                                    </p>
                                )}

                                {course.cou_txt_duration && (
                                    <div className="text-xs text-emerald-600 font-medium mb-3">
                                        ⏱ {course.cou_txt_duration}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    {/* PRECIO: Ajustado para ser más pequeño en móvil (text-lg) y grande en PC (md:text-2xl) */}
                                    <span className="text-lg md:text-2xl font-bold text-emerald-600">
                                        {PEN.format(course.cou_dec_price)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Tooltip text="Añadir al carrito" position="top">
                                            <button
                                                onClick={() => handleAddToCart(course)}
                                                disabled={addingToCart[course.cou_int_id] || (course.cou_int_sold >= course.cou_int_seats)}
                                                className={`p-2 rounded-xl transition-colors ${(course.cou_int_sold >= course.cou_int_seats)
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                    }`}
                                            >
                                                <ShoppingCartIcon className="w-5 h-5" />
                                            </button>
                                        </Tooltip>
                                        <Tooltip text={(course.cou_int_sold >= course.cou_int_seats) ? "Agotado" : "Inscribirse al curso"} position="top">
                                            <button
                                                onClick={() => handleBuy(course)}
                                                disabled={course.cou_int_sold >= course.cou_int_seats}
                                                className={`p-2 rounded-xl transition-colors ${(course.cou_int_sold >= course.cou_int_seats)
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                    }`}
                                            >
                                                {(course.cou_int_sold >= course.cou_int_seats) ? (
                                                    <span className="text-xs font-bold px-1">AGOTADO</span>
                                                ) : (
                                                    <AcademicCapIcon className="w-5 h-5" />
                                                )}
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                    }
                </div >
            </div >
        </div >
    )
}