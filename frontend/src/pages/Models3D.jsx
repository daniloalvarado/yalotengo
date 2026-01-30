import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import Model3DViewer from '../components/Model3DViewer'
import Tooltip from '../components/Tooltip'
import toast from 'react-hot-toast'
import { ShoppingCartIcon, CubeIcon, SparklesIcon, BanknotesIcon } from '@heroicons/react/24/outline'

const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })

export default function Models3D() {
    const [models, setModels] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedModel, setSelectedModel] = useState(null)
    const [addingToCart, setAddingToCart] = useState({})
    const navigate = useNavigate()

    useEffect(() => {
        loadModels()
    }, [])

    async function loadModels() {
        try {
            const { data } = await api.get('/models3d')
            setModels(data)
        } catch (e) {
            console.error('Error cargando modelos:', e)
            toast.error('Error al cargar modelos')
        } finally {
            setLoading(false)
        }
    }

    const handleBuy = (model) => {
        navigate('/models3d/checkout', { state: { model } })
    }

    const handleAddToCart = async (model) => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/auth', { state: { from: '/models3d' } })
            return
        }

        setAddingToCart(prev => ({ ...prev, [model.mod_int_id]: true }))
        try {
            await api.post('/models3d/cart', { modelId: model.mod_int_id })
            toast.success('Modelo añadido al carrito')
            window.dispatchEvent(new Event('cart:update'))
        } catch (e) {
            const msg = e.response?.data?.error || 'Error al añadir al carrito'
            toast.error(msg)
        } finally {
            setAddingToCart(prev => ({ ...prev, [model.mod_int_id]: false }))
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <CubeIcon className="w-8 h-8 text-emerald-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Modelos 3D</h1>
                </div>
                <p className="text-gray-600">
                    Explora nuestra colección de modelos 3D digitalizados. Descarga en formato GLB para usar en tus proyectos.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {/* SIN HOVER */}
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" />
                    Digitalizados
                </button>
                {/* SIN HOVER */}
                <button
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium"
                    onClick={() => toast('Próximamente: Servicio de impresión 3D', { icon: '🖨️' })}
                >
                    Impresos
                </button>
            </div>

            {/* Grid de modelos */}
            {models.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                    <CubeIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">No hay modelos disponibles</h3>
                    <p className="text-gray-500">Pronto agregaremos más modelos a la tienda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {models.map((model) => (
                        <div
                            key={model.mod_int_id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative z-0 hover:z-10 w-full max-w-[320px] mx-auto sm:max-w-none"
                        >
                            {/* Visor 3D */}
                            <div className="relative rounded-t-2xl overflow-hidden">
                                <Model3DViewer
                                    glbUrl={`http://localhost:3000/uploads/models/${model.mod_txt_glb_filename}`}
                                    height="220px"
                                />
                                <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    GLB
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {model.mod_txt_name}
                                </h3>
                                {model.mod_txt_desc && (
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                        {model.mod_txt_desc}
                                    </p>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <div>
                                        <span className="text-2xl font-bold text-gray-900">
                                            {PEN.format(model.mod_dec_price)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tooltip text="Añadir al carrito" position="top">
                                            <button
                                                onClick={() => handleAddToCart(model)}
                                                disabled={addingToCart[model.mod_int_id]}
                                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors disabled:opacity-50"
                                            >
                                                <ShoppingCartIcon className="w-5 h-5" />
                                            </button>
                                        </Tooltip>
                                        <Tooltip text="Comprar ahora" position="top">
                                            <button
                                                onClick={() => handleBuy(model)}
                                                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
                                            >
                                                <BanknotesIcon className="w-5 h-5" />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}