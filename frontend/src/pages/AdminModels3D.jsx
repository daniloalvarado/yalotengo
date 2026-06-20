// src/pages/AdminModels3D.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import {
    PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon,
    XMarkIcon, MagnifyingGlassIcon, ArrowUpTrayIcon, CheckCircleIcon,
    PhotoIcon
} from '@heroicons/react/24/outline'
import { StatusTag, formatDateTime, PEN } from './admin/adminUtils'
import Swal from 'sweetalert2'
import PurchaseDetailModal from './admin/PurchaseDetailModal'
import AnimatedModal from '../components/AnimatedModal'
import AdminQuotes3D from '../components/AdminQuotes3D'
import CustomSelect from '../components/CustomSelect'
import CustomStatusSelect from '../components/CustomStatusSelect'
import { cascade } from '../utils/animations'

const THEME = { primary: '#059669' }

export default function AdminModels3D() {
    const navigate = useNavigate()
    const [mainTab, setMainTab] = useState('products') // products, purchases
    const [modelCategory, setModelCategory] = useState('DIGITALIZADO') // DIGITALIZADO, IMPRESO
    const [modelSubcategory, setModelSubcategory] = useState('Todas')
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const [models, setModels] = useState([])
    const [purchases, setPurchases] = useState([])

    const [showModal, setShowModal] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [detailItem, setDetailItem] = useState(null)
    const [formData, setFormData] = useState({})
    const [attemptedSubmit, setAttemptedSubmit] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const fileInputRef = useRef(null)
    const imageInputRef = useRef(null)

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                await api.get('/admin/models3d')
                setIsAdmin(true)
            } catch (e) {
                if (e.response?.status === 403 || e.response?.status === 401) {
                    toast.error('Acceso denegado: se requiere rol de administrador')
                    navigate('/')
                }
            }
        }
        checkAdmin()
    }, [navigate])

    const fetchModels = useCallback(async () => {
        try {
            const { data } = await api.get('/admin/models3d')
            setModels(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Error fetching models:', e)
        }
    }, [])

    const fetchPurchases = useCallback(async () => {
        try {
            const { data } = await api.get('/admin/stats/purchases/models3d')
            setPurchases(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Error fetching purchases:', e)
        }
    }, [])

    useEffect(() => {
        if (isAdmin) {
            Promise.all([fetchModels(), fetchPurchases()]).finally(() => setLoading(false))
        }
    }, [isAdmin, fetchModels, fetchPurchases])

    const handleToggle = async (id) => {
        try {
            await api.patch(`/admin/models3d/${id}/toggle`)
            fetchModels()
            toast.success('Estado actualizado')
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al cambiar estado')
        }
    }

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Se eliminará el modelo y su archivo físico. No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        })

        if (!result.isConfirmed) return

        try {
            await api.delete(`/admin/models3d/${id}`)
            fetchModels()
            fetchPurchases() // 🔄 Update purchases list immediately
            Swal.fire({
                title: '¡Eliminado!',
                text: 'El modelo 3D ha sido eliminado.',
                imageUrl: '/favicon.png',
                imageWidth: 100,
                imageHeight: 100,
                imageAlt: 'Logo Invéntalo'
            })
        } catch (e) {
            Swal.fire(
                'Error',
                e.response?.data?.error || 'Error al eliminar',
                'error'
            )
        }
    }

    const handleStatusChange = async (purchaseId, newStatus) => {
        try {
            await api.put(`/admin/models3d/purchase/${purchaseId}/status`, { status: newStatus })
            toast.success('Estado actualizado')
            fetchPurchases()
        } catch (e) {
            toast.error('Error al actualizar estado')
        }
    }

    const [showStatusModal, setShowStatusModal] = useState(false)
    const [statusEditItem, setStatusEditItem] = useState(null)
    const [statusForm, setStatusForm] = useState({ status: '', estimate: '' })

    const openStatusModal = (item) => {
        setStatusEditItem(item)
        setStatusForm({
            status: item.deliveryStatus || 'ACCEPTED',
            estimate: item.deliveryEstimate || '1 día'
        })
        setShowStatusModal(true)
    }

    const handleStatusSubmit = async (e) => {
        e.preventDefault()
        if (isSaving) return;
        setIsSaving(true)
        try {
            await api.put(`/admin/models3d/purchase/${statusEditItem.id}/status`, {
                status: statusForm.status,
                estimate: statusForm.estimate
            })
            toast.success('Estado actualizado')
            setShowStatusModal(false)
            fetchPurchases()
        } catch (e) {
            toast.error('Error al actualizar estado')
        } finally {
            setIsSaving(false)
        }
    }

    const openModal = (item = null) => {
        setEditItem(item)
        const currentCat = item ? item.mod_txt_category : modelCategory

        setFormData(item ? {
            name: item.mod_txt_name,
            desc: item.mod_txt_desc || '',
            glbFilename: item.mod_txt_glb_filename,
            price: item.mod_dec_price,
            category: item.mod_txt_category,
            subcategory: item.mod_txt_subcategory || 'Sin Categoría',
            currentCategory: item.mod_txt_category,
            printedImage: item.mod_txt_category === 'IMPRESO' ? item.mod_txt_glb_filename : null
        } : {
            name: '',
            desc: '',
            glbFilename: '',
            price: 19.90,
            category: currentCat,
            subcategory: 'Sin Categoría',
            printedImage: null
        })
        setAttemptedSubmit(false)
        setShowModal(true)
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.toLowerCase().endsWith('.glb')) {
            toast.error('Solo se permiten archivos .glb')
            return
        }

        setUploading(true)
        const formDataUpload = new FormData()
        formDataUpload.append('glbFile', file)

        try {
            const { data } = await api.post('/admin/models3d/upload', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setFormData(prev => ({ ...prev, glbFilename: data.filename }))
            toast.success('Archivo subido correctamente')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al subir archivo')
        } finally {
            setUploading(false)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten imágenes')
            return
        }

        setUploading(true)
        const formDataUpload = new FormData()
        formDataUpload.append('printedImage', file)

        try {
            const { data } = await api.post('/admin/models3d/upload-image', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            // Here we update printedImage AND glbFilename (reused for image name in DB)
            setFormData(prev => ({
                ...prev,
                printedImage: data.filename,
                glbFilename: data.filename
            }))
            toast.success('Imagen subida correctamente')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al subir imagen')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (isSaving) return;
        setAttemptedSubmit(true)

        const currentCat = formData.category || modelCategory

        if (!formData.name || !formData.desc) {
            toast.error('Por favor completa los campos obligatorios')
            return
        }

        if (!formData.glbFilename) {
            if (currentCat === 'DIGITALIZADO') toast.error('Debes subir el archivo .glb del modelo')
            else toast.error('Debes subir la imagen del modelo impreso')
            return
        }

        const payload = { ...formData, category: currentCat }
        if (currentCat === 'IMPRESO') {
            payload.printedImage = formData.glbFilename
        }

        setIsSaving(true)
        try {
            if (editItem) {
                await api.put(`/admin/models3d/${editItem.mod_int_id}`, payload)
                toast.success('Actualizado correctamente')
            } else {
                await api.post('/admin/models3d', payload)
                toast.success('Creado correctamente')
            }
            setShowModal(false)
            fetchModels()
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al guardar')
        } finally {
            setIsSaving(false)
        }
    }

    const filteredModels = models.filter(m => {
        const cat = m.mod_txt_category || 'DIGITALIZADO'
        if (cat !== modelCategory) return false;
        if (modelCategory === 'DIGITALIZADO' && modelSubcategory !== 'Todas') {
            const sub = m.mod_txt_subcategory || 'Sin Categoría';
            return sub === modelSubcategory;
        }
        return true;
    })

    const digitalModels = models.filter(m => (m.mod_txt_category || 'DIGITALIZADO') === 'DIGITALIZADO');
    const availableSubcategories = ['Todas', ...new Set(digitalModels.map(m => m.mod_txt_subcategory || 'Sin Categoría'))];

    const filteredPurchases = searchTerm
        ? purchases.filter(p =>
            p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.modelName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : purchases

    if (!isAdmin) return <div className="p-8 text-center">Verificando permisos...</div>

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div {...cascade(0)}>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión Modelos 3D</h1>
                    <p className="text-gray-500 dark:text-gray-300 text-sm">Productos y ventas de modelos 3D</p>
                </div>
                {mainTab === 'products' && (
                    <button
                        key={modelCategory}
                        onClick={() => openModal()}
                        {...cascade(1, "flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg shadow-md hover:opacity-90 transition-all")}
                        style={{ backgroundColor: THEME.primary }}
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>{modelCategory === 'IMPRESO' ? 'Agregar Impreso' : 'Modelo 3D'}</span>
                    </button>
                )}
            </div>

            <div {...cascade(2, "flex gap-2 border-b border-gray-200 dark:border-zinc-800/40 overflow-x-auto whitespace-nowrap custom-scrollbar pb-1")}>
                <button
                    onClick={() => { setMainTab('products'); setSearchTerm(''); }}
                    {...cascade(3, `px-4 py-2 shrink-0 text-sm font-medium border-b-2 transition-all ${mainTab === 'products' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300'}`)}
                >
                    Productos ({models.length})
                </button>
                <button
                    onClick={() => setMainTab('purchases')}
                    {...cascade(4, `px-4 py-2 shrink-0 text-sm font-medium border-b-2 transition-all ${mainTab === 'purchases' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300'}`)}
                >
                    Compras ({purchases.length})
                </button>
                {/* Cotizaciones 3D (Comentado temporalmente)
                <button
                    onClick={() => { setMainTab('quotes'); setSearchTerm(''); }}
                    {...cascade(5, `px-4 py-2 shrink-0 text-sm font-medium border-b-2 transition-all ${mainTab === 'quotes' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300'}`)}
                >
                    Cotizaciones 3D
                </button>
                */}
            </div>

            {mainTab === 'products' && (
                <div {...cascade(6, "flex flex-row flex-wrap items-center justify-between gap-4 w-full pb-2 mt-1")}>
                    <div className="flex gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
                        <button
                            onClick={() => { setModelCategory('DIGITALIZADO'); setModelSubcategory('Todas'); }}
                            {...cascade(7, `px-3 py-1 shrink-0 text-sm rounded-full transition-colors ${modelCategory === 'DIGITALIZADO' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'}`)}
                        >
                            Digitales (GLB)
                        </button>
                        <button
                            onClick={() => setModelCategory('IMPRESO')}
                            {...cascade(8, `px-3 py-1 shrink-0 text-sm rounded-full transition-colors ${modelCategory === 'IMPRESO' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'}`)}
                        >
                            Impresos (Físicos)
                        </button>
                    </div>

                    {modelCategory === 'DIGITALIZADO' && (
                        <div {...cascade(9, "flex items-center gap-2")}>
                            <CustomSelect 
                                options={availableSubcategories}
                                value={modelSubcategory}
                                onChange={setModelSubcategory}
                                label="Filtrar:"
                            />
                        </div>
                    )}
                </div>
            )}

            {mainTab === 'purchases' && (
                <div {...cascade(6, "relative")}>
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por cliente o modelo..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                </div>
            )}

            {loading && <div className="text-gray-500 dark:text-gray-300">Cargando...</div>}

            {mainTab === 'products' && (
                <div key={`${modelCategory}-${modelSubcategory}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredModels.map((m, idx) => (
                        <div key={m.mod_int_id} {...cascade(10 + idx, `bg-white dark:bg-[#1c1c1c] rounded-xl border border-gray-200 dark:border-zinc-800/50 p-4 shadow-sm transition-all ${!m.mod_bool_active ? 'opacity-60' : ''}`)}>
                            {m.mod_txt_category === 'IMPRESO' ? (
                                <div className="aspect-square bg-gray-100 dark:bg-zinc-800 rounded-lg mb-3 overflow-hidden grid place-items-center">
                                    {m.mod_txt_glb_filename ? (
                                        <img
                                            src={`${api.defaults.baseURL?.replace(/\/api\/?$/, '')}/uploads/impresos/${m.mod_txt_glb_filename}`}
                                            alt={m.mod_txt_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => e.target.src = 'https://placehold.co/400?text=No+Image'}
                                        />
                                    ) : (
                                        <PhotoIcon className="w-12 h-12 text-gray-300" />
                                    )}
                                </div>
                            ) : (
                                <div className="aspect-video bg-gray-900 rounded-lg mb-3 grid place-items-center relative overflow-hidden group">
                                    <div className="absolute inset-0 flex items-center justify-center opacity-30 text-white font-black text-4xl">3D</div>
                                    <p className="z-10 text-xs text-gray-300 font-mono bg-black/50 px-2 py-1 rounded line-clamp-1 max-w-[90%]">{m.mod_txt_glb_filename}</p>
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{m.mod_txt_name}</h3>
                                    <p className="text-xs text-gray-400 line-clamp-2">{m.mod_txt_desc}</p>
                                </div>
                                <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full ${m.mod_bool_active ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-300'}`}>
                                    {m.mod_bool_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div className="text-lg font-bold text-emerald-600 mb-3">{PEN.format(Number(m.mod_dec_price || 0))}</div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => openModal(m)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 rounded-lg">
                                    <PencilIcon className="w-4 h-4" /> Editar
                                </button>
                                <button onClick={() => handleToggle(m.mod_int_id)} className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg">
                                    {m.mod_bool_active ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                                <button onClick={() => handleDelete(m.mod_int_id)} className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded-lg">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredModels.length === 0 && (
                        <div {...cascade(10, "col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-zinc-800/40 rounded-xl")}>
                            <p>No hay modelos {modelCategory === 'IMPRESO' ? 'impresos' : 'digitales'} registrados.</p>
                        </div>
                    )}
                </div>
            )}

            {mainTab === 'quotes' && (
                <AdminQuotes3D />
            )}

            {mainTab === 'purchases' && (
                <div key={searchTerm} {...cascade(7, "overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-800/40")}>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-[#141414] text-gray-600 dark:text-gray-300">
                            <tr {...cascade(8)}>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Modelo</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Monto</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {filteredPurchases.map((p, i) => (
                                <tr key={i} onClick={() => setDetailItem(p)} {...cascade(9 + i, "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors group")}>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900 dark:text-white">{p.userName}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-300">{p.userEmail}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.modelName}</td>
                                    <td className="px-4 py-3 font-medium text-emerald-600">{PEN.format(Number(p.amount || 0))}</td>
                                    <td className="px-4 py-3">
                                        {p.modelCategory === 'IMPRESO' ? (
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded
                                                    ${p.deliveryStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                                                        p.deliveryStatus === 'IN_PROGRESS' || p.deliveryStatus === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 dark:bg-zinc-800 text-gray-800'}`}>
                                                    {p.deliveryStatus === 'DELIVERED' ? 'Entregado' :
                                                        p.deliveryStatus === 'IN_PROGRESS' || p.deliveryStatus === 'PREPARING' ? 'En curso' : 'Aceptado'}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openStatusModal(p); }}
                                                    className="text-[10px] text-emerald-600 hover:text-emerald-800 font-medium underline"
                                                >
                                                    Gestionar
                                                </button>
                                            </div>
                                        ) : (
                                            <StatusTag status={p.status} />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-300">{formatDateTime(p.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredPurchases.length === 0 && (
                        <div {...cascade(9, "text-center py-8 text-gray-500 dark:text-gray-300")}>
                            {searchTerm ? 'No se encontraron resultados' : 'No hay compras aún'}
                        </div>
                    )}
                </div>
            )}

            <PurchaseDetailModal
                purchase={detailItem}
                onClose={() => setDetailItem(null)}
                type="Modelo 3D"
            />

            <AnimatedModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={`${editItem ? 'Editar' : 'Nuevo'} ${modelCategory === 'IMPRESO' ? 'Modelo Impreso' : 'Modelo 3D'}`}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Nombre *</span>
                        <input
                            value={formData.name || ''}
                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                            required
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${attemptedSubmit && !formData.name ? 'border-red-300 ring-1 ring-red-100 placeholder-red-300' : 'border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white'}`}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Descripción *</span>
                        <textarea
                            value={formData.desc || ''}
                            onChange={e => setFormData(p => ({ ...p, desc: e.target.value }))}
                            rows={3}
                            required
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${attemptedSubmit && !formData.desc ? 'border-red-300 ring-1 ring-red-100 placeholder-red-300' : 'border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white'}`}
                        />
                    </label>

                    {(formData.category || modelCategory) === 'DIGITALIZADO' ? (
                        <div className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Archivo GLB *</span>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".glb"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className={`flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-50 transition-colors ${attemptedSubmit && !formData.glbFilename ? 'border border-red-300 text-red-600 bg-red-50 hover:bg-red-100' : ''}`}
                                >
                                    <ArrowUpTrayIcon className="w-4 h-4" />
                                    {uploading ? 'Subiendo...' : 'Subir archivo .glb'}
                                </button>
                                {formData.glbFilename && (
                                    <div className="flex items-center gap-1 text-sm text-emerald-600">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        <span className="truncate max-w-[200px]">{formData.glbFilename}</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">El archivo 3D que el usuario podrá visualizar y descargar.</p>
                        </div>
                    ) : (
                        <div className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Imagen del Modelo *</span>
                            <input
                                type="file"
                                ref={imageInputRef}
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={uploading}
                                    className={`flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-50 transition-colors ${attemptedSubmit && !formData.glbFilename ? 'border border-red-300 text-red-600 bg-red-50 hover:bg-red-100' : ''}`}
                                >
                                    <PhotoIcon className="w-4 h-4" />
                                    {uploading ? 'Subiendo...' : 'Subir Imagen'}
                                </button>
                                {formData.glbFilename && (
                                    <div className="flex items-center gap-1 text-sm text-emerald-600">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        <span className="truncate max-w-[200px]">{formData.glbFilename}</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Foto real del objeto impreso para mostrar en el catálogo.</p>
                            {formData.glbFilename && (
                                <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 border p-1">
                                    <img
                                        src={`${api.defaults.baseURL?.replace(/\/api\/?$/, '')}/uploads/impresos/${formData.glbFilename}`}
                                        className="w-full h-full object-cover rounded"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {(formData.category || modelCategory) === 'DIGITALIZADO' && (
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Subcategoría</span>
                            <input
                                value={formData.subcategory || ''}
                                onChange={e => setFormData(p => ({ ...p, subcategory: e.target.value }))}
                                placeholder="Ej: Insectos, Anatomía, Células..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Sirve para agrupar los modelos (Ej: Insectos). Si lo dejas vacío dirá 'Sin Categoría'.</p>
                        </label>
                    )}

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Precio (S/)</span>
                        <input type="number" step="0.01" value={formData.price || ''} onChange={e => setFormData(p => ({ ...p, price: parseFloat(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </label>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white rounded-lg hover:bg-gray-50 dark:bg-[#141414] text-gray-600 dark:text-gray-300">Cancelar</button>
                        <button
                            type="submit"
                            disabled={uploading || isSaving}
                            className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: THEME.primary }}
                        >
                            {isSaving ? 'Guardando...' : (editItem ? 'Guardar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </AnimatedModal>

            {/* Status Management Modal */}
            <AnimatedModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                title="Gestionar Pedido"
                maxWidth="max-w-sm"
            >
                <form onSubmit={handleStatusSubmit} className="space-y-4">
                    <label className="block">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-2 block">Estado de Entrega</span>
                        <CustomStatusSelect
                            value={statusForm.status}
                            onChange={(val) => setStatusForm(prev => ({ ...prev, status: val }))}
                            options={[
                                { value: "ACCEPTED", label: "Aceptado" },
                                { value: "IN_PROGRESS", label: "En curso" },
                                { value: "DELIVERED", label: "Entregado" }
                            ]}
                        />
                    </label>

                    <label className="block">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-2 block">Estimación de Tiempo</span>
                        <input
                            type="text"
                            value={statusForm.estimate}
                            onChange={(e) => setStatusForm(prev => ({ ...prev, estimate: e.target.value }))}
                            placeholder="Ej: 2 días, 5 horas..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Este texto lo verá el cliente en su línea de tiempo.</p>
                    </label>

                    <div className="pt-2">
                        <button type="submit" disabled={isSaving} className="w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow">
                            {isSaving ? 'Actualizando...' : 'Actualizar Estado'}
                        </button>
                    </div>
                </form>
            </AnimatedModal>
        </div>
    )
}
