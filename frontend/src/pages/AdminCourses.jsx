// src/pages/AdminCourses.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import {
    PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon,
    XMarkIcon, MagnifyingGlassIcon, PhotoIcon, CheckCircleIcon
} from '@heroicons/react/24/outline'
import { StatusTag, formatDateTime, PEN } from './admin/adminUtils'
import Swal from 'sweetalert2'


import PurchaseDetailModal from './admin/PurchaseDetailModal'
import AnimatedModal from '../components/AnimatedModal'

const THEME = { primary: '#059669' }

export default function AdminCourses() {
    const navigate = useNavigate()
    const [subTab, setSubTab] = useState('products')
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const [courses, setCourses] = useState([])
    const [purchases, setPurchases] = useState([])

    const [showModal, setShowModal] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [detailItem, setDetailItem] = useState(null)
    const [formData, setFormData] = useState({})
    const [attemptedSubmit, setAttemptedSubmit] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const imageInputRef = useRef(null)

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                await api.get('/admin/courses')
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

    const fetchCourses = useCallback(async () => {
        try {
            const { data } = await api.get('/admin/courses')
            setCourses(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Error fetching courses:', e)
        }
    }, [])

    const fetchPurchases = useCallback(async () => {
        try {
            const { data } = await api.get('/admin/stats/purchases/courses')
            setPurchases(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Error fetching purchases:', e)
        }
    }, [])

    useEffect(() => {
        if (isAdmin) {
            Promise.all([fetchCourses(), fetchPurchases()]).finally(() => setLoading(false))
        }
    }, [isAdmin, fetchCourses, fetchPurchases])

    const handleToggle = async (id) => {
        try {
            await api.patch(`/admin/courses/${id}/toggle`)
            fetchCourses()
            toast.success('Estado actualizado')
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al cambiar estado')
        }
    }


    // ... inside component

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Se eliminará el curso y su imagen. No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        })

        if (!result.isConfirmed) return

        try {
            await api.delete(`/admin/courses/${id}`)
            fetchCourses()
            fetchPurchases() // 🔄 Update purchases list immediately
            Swal.fire({
                title: '¡Eliminado!',
                text: 'El curso ha sido eliminado.',
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

    const openModal = (item = null) => {
        setEditItem(item)
        setFormData(item ? {
            title: item.cou_txt_title,
            desc: item.cou_txt_desc || '',
            image: item.cou_txt_image || '',
            price: item.cou_dec_price,
            duration: item.cou_txt_duration || '',
            seats: item.cou_int_seats || 10
        } : { title: '', desc: '', image: '', price: 99.90, duration: '', seats: 10 })
        setAttemptedSubmit(false)
        setShowModal(true)
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
        if (!validExts.includes(ext)) {
            toast.error('Solo se permiten imágenes (jpg, png, webp, gif)')
            return
        }

        setUploadingImage(true)
        const formDataUpload = new FormData()
        formDataUpload.append('courseImage', file)

        try {
            const { data } = await api.post('/admin/courses/upload', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setFormData(prev => ({ ...prev, image: data.filename }))
            toast.success('Imagen subida correctamente')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al subir imagen')
        } finally {
            setUploadingImage(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setAttemptedSubmit(true)

        // Validation fields
        if (!formData.title || !formData.desc || !formData.duration) {
            toast.error('Por favor completa los campos obligatorios')
            return
        }

        // Validation image
        if (!formData.image) {
            toast.error('Debes subir la imagen del curso')
            return
        }

        try {
            const payload = { ...formData, cou_int_seats: Number(formData.seats) }

            if (editItem) {
                await api.put(`/admin/courses/${editItem.cou_int_id}`, payload)
                toast.success('Actualizado correctamente')
            } else {
                await api.post('/admin/courses', payload)
                toast.success('Creado correctamente')
            }
            setShowModal(false)
            fetchCourses()
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al guardar')
        }
    }

    const filteredPurchases = searchTerm
        ? purchases.filter(p =>
            p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : purchases

    if (!isAdmin) return <div className="p-8 text-center">Verificando permisos...</div>

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión Cursos</h1>
                    <p className="text-gray-500 text-sm">Productos y ventas de cursos</p>
                </div>
                {subTab === 'products' && (
                    <button
                        onClick={() => openModal()}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg shadow-md hover:opacity-90 transition-all"
                        style={{ backgroundColor: THEME.primary }}
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Agregar Curso</span>
                    </button>
                )}
            </div>

            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => { setSubTab('products'); setSearchTerm(''); }}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${subTab === 'products' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Productos ({courses.length})
                </button>
                <button
                    onClick={() => setSubTab('purchases')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${subTab === 'purchases' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Compras ({purchases.length})
                </button>
            </div>

            {subTab === 'purchases' && (
                <div className="relative">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por cliente o curso..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                </div>
            )}

            {loading && <div className="text-gray-500">Cargando...</div>}

            {subTab === 'products' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(c => (
                        <div key={c.cou_int_id} className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${!c.cou_bool_active ? 'opacity-60' : ''}`}>
                            {c.cou_txt_image && (
                                <img
                                    src={`/uploads/courses/${c.cou_txt_image}`}
                                    onError={(e) => { e.target.src = `/cursos/${c.cou_txt_image}` }}
                                    alt={c.cou_txt_title}
                                    className="w-full h-32 object-cover rounded-lg mb-3"
                                />
                            )}
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{c.cou_txt_title}</h3>
                                    <p className="text-sm text-gray-500 truncate">{c.cou_txt_duration}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Cupos: <span className="font-medium text-gray-600">{c.cou_int_seats}</span>
                                        <span className="mx-1">•</span>
                                        Vendidos: <span className="font-medium text-gray-600">{c.cou_int_sold || 0}</span>
                                    </p>
                                </div>
                                <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full ${c.cou_bool_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {c.cou_bool_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div className="text-lg font-bold text-emerald-600 mb-3">{PEN.format(Number(c.cou_dec_price || 0))}</div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => openModal(c)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
                                    <PencilIcon className="w-4 h-4" /> Editar
                                </button>
                                <button onClick={() => handleToggle(c.cou_int_id)} className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg">
                                    {c.cou_bool_active ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                                <button onClick={() => handleDelete(c.cou_int_id)} className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded-lg">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {subTab === 'purchases' && (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Curso</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Monto</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPurchases.map((p, i) => (
                                <tr key={i} onClick={() => setDetailItem(p)} className="hover:bg-emerald-50 cursor-pointer transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{p.userName}</div>
                                        <div className="text-xs text-gray-500">{p.userEmail}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{p.courseTitle}</td>
                                    <td className="px-4 py-3 font-medium text-emerald-600">{PEN.format(Number(p.amount || 0))}</td>
                                    <td className="px-4 py-3"><StatusTag status={p.status} /></td>
                                    <td className="px-4 py-3 text-gray-500">{formatDateTime(p.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredPurchases.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No se encontraron resultados' : 'No hay compras aún'}
                        </div>
                    )}
                </div>
            )}

            {subTab === 'products' && !loading && courses.length === 0 && (
                <div className="text-center py-12 text-gray-500">No hay cursos. Haz clic en "Agregar" para crear uno.</div>
            )}

            {/* DETAIL MODAL */}
            <PurchaseDetailModal
                purchase={detailItem}
                onClose={() => setDetailItem(null)}
                type="Curso"
            />





            <AnimatedModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={`${editItem ? 'Editar' : 'Nuevo'} Curso`}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-1 block">Título *</span>
                        <input
                            value={formData.title || ''}
                            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                            required
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${attemptedSubmit && !formData.title ? 'border-red-300 ring-1 ring-red-100 placeholder-red-300' : 'border-gray-300'}`}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-1 block">Descripción *</span>
                        <textarea
                            value={formData.desc || ''}
                            onChange={e => setFormData(p => ({ ...p, desc: e.target.value }))}
                            rows={3}
                            required
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${attemptedSubmit && !formData.desc ? 'border-red-300 ring-1 ring-red-100 placeholder-red-300' : 'border-gray-300'}`}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-1 block">Duración (ej: 4 semanas) *</span>
                        <input
                            value={formData.duration || ''}
                            onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))}
                            placeholder="Ej: 6 semanas"
                            required
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${attemptedSubmit && !formData.duration ? 'border-red-300 ring-1 ring-red-100 placeholder-red-300' : 'border-gray-300'}`}
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-1 block">Cupos Totales *</span>
                        <input
                            type="number"
                            min="1"
                            value={formData.seats || ''}
                            onChange={e => setFormData(p => ({ ...p, seats: e.target.value }))}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </label>

                    {/* Image Upload */}
                    <div className="block">
                        <span className="text-sm font-medium text-gray-700 mb-2 block">Imagen del curso</span>
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
                                disabled={uploadingImage}
                                className={`flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-50 transition-colors ${attemptedSubmit && !formData.image ? 'border border-red-300 text-red-600 bg-red-50 hover:bg-red-100' : ''}`}
                            >
                                <PhotoIcon className="w-4 h-4" />
                                {uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                            </button>
                            {formData.image && (
                                <div className="flex items-center gap-2">
                                    <img src={`/cursos/${formData.image}`} alt="Curso" className="w-10 h-10 object-cover rounded" />
                                    <span className="text-sm text-emerald-600 truncate max-w-[120px]">{formData.image}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-1 block">Precio (S/)</span>
                        <input type="number" step="0.01" value={formData.price || ''} onChange={e => setFormData(p => ({ ...p, price: parseFloat(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </label>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                        <button
                            type="submit"
                            disabled={uploadingImage}
                            className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: THEME.primary }}
                        >
                            {editItem ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </AnimatedModal>
        </div>
    )
}
