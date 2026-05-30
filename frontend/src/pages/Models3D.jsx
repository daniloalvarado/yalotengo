import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import Model3DViewer from '../components/Model3DViewer'
import Tooltip from '../components/Tooltip'
import toast from 'react-hot-toast'
import { ShoppingCartIcon, CubeIcon, SparklesIcon, BanknotesIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import UserQuotes3D from '../components/UserQuotes3D'
import QuoteModal from '../components/QuoteModal'

const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })

export default function Models3D() {
    const [models, setModels] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedModel, setSelectedModel] = useState(null)
    const [addingToCart, setAddingToCart] = useState({})
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('DIGITALIZADO') // DIGITALIZADO, IMPRESO, MIS_COTIZACIONES
    const [modelSubcategory, setModelSubcategory] = useState('Todas')
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
    const userQuotesRef = useRef(null)

    const [ownedIds, setOwnedIds] = useState(new Set())
    const [cartIds, setCartIds] = useState(new Set())

    useEffect(() => {
        loadModels()
    }, [])

    async function loadModels() {
        try {
            const { data } = await api.get('/models3d')
            setModels(data)

            const token = localStorage.getItem('token')
            if (token) {
                const [purchasesRes, cartRes] = await Promise.all([
                    api.get('/models3d/my/purchases').catch(() => ({ data: [] })),
                    api.get('/models3d/cart').catch(() => ({ data: [] }))
                ])

                const owned = new Set(purchasesRes.data.map(p => p.mod_int_id))
                // Para cartIds, el endpoint /cart retorna items con mod_int_id dentro
                // Revisando routes, /cart devuelve Model3DPurchase, asi que el ID del modelo está en mod_int_id
                const inCart = new Set(cartRes.data.map(p => p.mod_int_id))

                setOwnedIds(owned)
                setCartIds(inCart)
            }
        } catch (e) {
            console.error('Error cargando modelos:', e)
            toast.error('Error al cargar modelos')
        } finally {
            setLoading(false)
        }
    }

    // Escuchar actualizaciones del carrito
    useEffect(() => {
        const onCartUpdate = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            try {
                const { data } = await api.get('/models3d/cart')
                setCartIds(new Set(data.map(p => p.mod_int_id)))
            } catch (e) { console.error(e) }
        }
        window.addEventListener('cart:update', onCartUpdate)
        return () => window.removeEventListener('cart:update', onCartUpdate)
    }, [])

    const handleBuy = async (model) => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/auth', { state: { from: '/models3d' } })
            return
        }

        // Validación de Perfil para Impresiones
        const isPrinted = (model.mod_txt_category || 'DIGITALIZADO') === 'IMPRESO'
        if (isPrinted) {
            try {
                const { data } = await api.get('/auth/me')
                const u = data.user
                const missing = []
                if (!u.use_txt_documento) missing.push('DNI')
                if (!u.use_txt_phone) missing.push('Teléfono')
                if (!u.use_txt_address) missing.push('Dirección')

                if (missing.length > 0) {
                    toast.error(`Para comprar impresiones debes completar: ${missing.join(', ')}`, { duration: 5000 })
                    navigate('/profile', { state: { missing } })
                    return
                }
            } catch (e) {
                console.error('Validation error', e)
                return
            }
        }

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
            const { data } = await api.post('/models3d/cart', { modelId: model.mod_int_id })
            const qty = data.cartItem?.quantity || data.cartItem?.pur_int_quantity || 1
            const isPrinted = (model.mod_txt_category || 'DIGITALIZADO') === 'IMPRESO'

            if (isPrinted) {
                toast.success(`Modelo añadido. Tienes ${qty} unidad${qty > 1 ? 'es' : ''} en el carrito`)
            } else {
                toast.success('Modelo 3D añadido al carrito')
            }

            window.dispatchEvent(new Event('cart:update'))
        } catch (e) {
            const msg = e.response?.data?.error || 'Error al añadir al carrito'
            toast.error(msg)
        } finally {
            setAddingToCart(prev => ({ ...prev, [model.mod_int_id]: false }))
        }
    }

    const digitalModels = models.filter(m => (m.mod_txt_category || 'DIGITALIZADO') === 'DIGITALIZADO')
    const availableSubcategories = ['Todas', ...new Set(digitalModels.map(m => m.mod_txt_subcategory || 'Sin Categoría'))]

    const filteredModels = models.filter(m => {
        const cat = m.mod_txt_category || 'DIGITALIZADO'
        if (cat !== activeTab) return false
        if (activeTab === 'DIGITALIZADO' && modelSubcategory !== 'Todas') {
            const sub = m.mod_txt_subcategory || 'Sin Categoría'
            return sub === modelSubcategory
        }
        return true
    })

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
                    {activeTab === 'DIGITALIZADO'
                        ? 'Explora nuestra colección de modelos 3D digitalizados. Descarga en formato GLB para usar en tus proyectos.'
                        : activeTab === 'IMPRESO' 
                            ? 'Adquiere modelos ya impresos en 3D con acabados de alta calidad.' 
                            : 'Gestiona tus cotizaciones de modelos 3D personalizados.'}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                <div className="flex gap-2 overflow-x-auto w-full pb-2 custom-scrollbar">
                    <button
                        onClick={() => setActiveTab('DIGITALIZADO')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center shrink-0 gap-2 transition-colors ${activeTab === 'DIGITALIZADO' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        <SparklesIcon className="w-4 h-4" />
                        Digitalizados
                    </button>
                    <button
                        onClick={() => setActiveTab('IMPRESO')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center shrink-0 gap-2 transition-colors ${activeTab === 'IMPRESO' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        <CubeIcon className="w-4 h-4" />
                        Impresos
                    </button>
                    {/* Cotizaciones 3D (Comentado temporalmente)
                    <button
                        onClick={() => setActiveTab('MIS_COTIZACIONES')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center shrink-0 gap-2 transition-colors ${activeTab === 'MIS_COTIZACIONES' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        <DocumentTextIcon className="w-4 h-4" />
                        Mis Cotizaciones 3D
                    </button>
                    */}
                </div>

                {activeTab === 'MIS_COTIZACIONES' && (
                    <button 
                        onClick={() => setIsQuoteModalOpen(true)}
                        className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl hover:bg-emerald-200 transition-colors shadow-sm shrink-0"
                    >
                        Cotización Personalizada
                    </button>
                )}

                {/* Filtro Subcategorías trasladado a la misma fila */}
                {activeTab === 'DIGITALIZADO' && availableSubcategories.length > 1 && (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm shrink-0">
                        <span className="text-sm font-medium text-gray-500">Filtrar:</span>
                        <select
                            value={modelSubcategory}
                            onChange={(e) => setModelSubcategory(e.target.value)}
                            className="text-sm bg-transparent border-none focus:ring-0 font-medium text-gray-700 outline-none cursor-pointer py-1 pl-1 pr-6"
                        >
                            {availableSubcategories.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Filtro Subcategorías (Solo Digitales) */}


            {/* Grid de modelos */}
            {activeTab === 'MIS_COTIZACIONES' ? (
                <UserQuotes3D ref={userQuotesRef} />
            ) : filteredModels.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                    <CubeIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">No hay modelos {activeTab === 'IMPRESO' ? 'impresos' : 'digitales'} disponibles</h3>
                    <p className="text-gray-500">Pronto agregaremos más modelos a la tienda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredModels.map((model) => (
                        <div
                            key={model.mod_int_id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative z-0 hover:z-10 w-full max-w-[320px] mx-auto sm:max-w-none"
                        >
                            {/* Visor / Imagen */}
                            <div className={`relative rounded-t-2xl overflow-hidden bg-gray-100 ${activeTab === 'IMPRESO' ? 'aspect-square' : 'aspect-[4/3]'}`}>
                                {activeTab === 'DIGITALIZADO' ? (
                                    <>
                                        <Model3DViewer
                                            glbUrl={`${api.defaults.baseURL?.replace(/\/api\/?$/, '')}/uploads/models/${model.mod_txt_glb_filename}`}
                                            height="100%"
                                        />
                                        <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                            GLB
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full">
                                        <img
                                            src={`${api.defaults.baseURL?.replace(/\/api\/?$/, '')}/uploads/impresos/${model.mod_txt_glb_filename}`}
                                            alt={model.mod_txt_name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => e.target.src = 'https://placehold.co/400?text=No+Image'}
                                        />
                                    </div>
                                )}
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
                                        {((activeTab === 'DIGITALIZADO' && ownedIds.has(model.mod_int_id)) || (activeTab === 'DIGITALIZADO' && cartIds.has(model.mod_int_id))) ? (
                                            ownedIds.has(model.mod_int_id) ? (
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                                    Adquirido
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                                                    En carrito
                                                </span>
                                            )
                                        ) : (
                                            <>
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
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <QuoteModal 
                isOpen={isQuoteModalOpen} 
                onClose={() => setIsQuoteModalOpen(false)}
                onSuccess={() => {
                    setActiveTab('MIS_COTIZACIONES')
                    userQuotesRef.current?.loadQuotes()
                }}
            />
        </div>
    )
}