import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon, ArrowUpTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import AnimatedModal from '../components/AnimatedModal'

const THEME = { primary: '#059669' }

export default function AdminUnityModels() {
    const navigate = useNavigate()
    const [models, setModels] = useState([])
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    
    const [showModal, setShowModal] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [formData, setFormData] = useState({})
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                // Hacemos el fetch inicial aquí mismo para verificar si es admin
                const { data } = await api.get('/microscopicos/admin')
                setModels(Array.isArray(data) ? data : [])
                setIsAdmin(true)
                setLoading(false)
            } catch (e) {
                if (e.response?.status === 403 || e.response?.status === 401) {
                    toast.error('Acceso denegado: se requiere rol de administrador')
                    navigate('/')
                }
                setLoading(false)
            }
        }
        checkAdmin()
    }, [navigate])

    const fetchModels = async () => {
        try {
            setLoading(true)
            const { data } = await api.get('/microscopicos/admin')
            setModels(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Error fetching microscopicos:', e)
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = async (item) => {
        try {
            const newStatus = item.estado === 'activo' ? 'desactivo' : 'activo'
            await api.put(`/microscopicos/admin/${item.id}`, { estado: newStatus })
            fetchModels()
            toast.success('Estado actualizado')
        } catch (e) {
            toast.error('Error al cambiar estado')
        }
    }

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Se ocultará (eliminará lógicamente) este modelo. No podrás deshacerlo.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        })

        if (!result.isConfirmed) return

        try {
            await api.delete(`/microscopicos/admin/${id}`)
            fetchModels()
            Swal.fire({
                title: '¡Eliminado!',
                text: 'El modelo microscópico ha sido eliminado.',
                icon: 'success',
                confirmButtonColor: '#059669'
            })
        } catch (e) {
            Swal.fire('Error', 'Error al eliminar', 'error')
        }
    }

    const openModal = (item = null) => {
        setEditItem(item)
        setFormData(item ? { ...item } : {
            scientificName: '', kingdom: 'Animalia', phylum: '', subphylum: '', class: '', subclass: '', order: '', family: '', genus: '', specificEpithet: '',
            vernacularName: '', taxonRemarks: '', assetBundleFileName: ''
        })
        setShowModal(true)
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formDataUpload = new FormData()
        formDataUpload.append('assetBundleFile', file)

        try {
            const { data } = await api.post('/microscopicos/admin/upload', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setFormData(prev => ({ ...prev, assetBundleFileName: data.filename }))
            toast.success('AssetBundle subido correctamente')
        } catch (err) {
            toast.error('Error al subir archivo')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editItem) {
                await api.put(`/microscopicos/admin/${editItem.id}`, formData)
                toast.success('Actualizado correctamente')
            } else {
                await api.post('/microscopicos/admin', formData)
                toast.success('Creado correctamente')
            }
            setShowModal(false)
            fetchModels()
        } catch (e) {
            toast.error('Error al guardar')
        }
    }

    if (!isAdmin) return <div className="p-8 text-center text-gray-500">Verificando permisos...</div>

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Modelos Unity AR</h1>
                    <p className="text-gray-500 text-sm">Base de datos de Microscópicos (Darwin Core)</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg shadow-md hover:opacity-90 transition-all"
                    style={{ backgroundColor: THEME.primary }}
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Agregar Especie</span>
                </button>
            </div>

            {loading ? <div className="text-gray-500">Cargando datos Darwin Core...</div> : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">ID / Nombre Científico</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Taxonomía</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">AssetBundle</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {models.map(m => (
                                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-gray-900 italic">{m.scientificName}</div>
                                        <div className="text-xs text-gray-500">{m.vernacularName || 'Sin nombre común'} (ID: {m.id})</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-xs text-gray-600">
                                            {m.class || '?'} &gt; {m.order || '?'} &gt; {m.family || '?'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {m.assetBundleFileName ? (
                                            <span className="text-emerald-600 text-xs font-mono bg-emerald-50 px-2 py-1 rounded truncate max-w-[150px] inline-block">
                                                {m.assetBundleFileName}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Sin archivo Unity</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.estado === 'activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                            {m.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            <button onClick={() => openModal(m)} className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleToggle(m)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded">
                                                {m.estado === 'activo' ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                            <button onClick={() => handleDelete(m.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {models.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                        No hay modelos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatedModal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Editar Especie' : 'Nueva Especie'} maxWidth="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block col-span-1 md:col-span-2">
                            <span className="text-sm font-medium text-gray-700 block mb-1">Nombre Científico (scientificName) *</span>
                            <input value={formData.scientificName || ''} onChange={e => setFormData(p => ({ ...p, scientificName: e.target.value }))} required className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 outline-none" />
                        </label>
                        
                        <div className="col-span-1 md:col-span-2 p-3 bg-gray-50 rounded-lg border text-sm grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <p className="col-span-full font-semibold text-gray-600 mb-1 text-xs uppercase tracking-wider">Taxonomía Darwin Core</p>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Reino</span><input value={formData.kingdom || ''} onChange={e => setFormData(p => ({ ...p, kingdom: e.target.value }))} className="w-full px-2 py-1 border rounded text-xs outline-none" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Filo</span><input value={formData.phylum || ''} onChange={e => setFormData(p => ({ ...p, phylum: e.target.value }))} className="w-full px-2 py-1 border rounded text-xs outline-none" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Subfilo</span><input value={formData.subphylum || ''} onChange={e => setFormData(p => ({ ...p, subphylum: e.target.value }))} className="w-full px-2 py-1 border rounded text-xs outline-none" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Clase</span><input value={formData.class || ''} onChange={e => setFormData(p => ({ ...p, class: e.target.value }))} className="w-full px-2 py-1 border rounded text-xs outline-none" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Subclase</span><input value={formData.subclass || ''} onChange={e => setFormData(p => ({ ...p, subclass: e.target.value }))} className="w-full px-2 py-1 border rounded text-xs outline-none" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Orden</span><input value={formData.order || ''} onChange={e => setFormData(p => ({ ...p, order: e.target.value }))} className="w-full px-2 py-1 border rounded text-xs outline-none" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Familia</span><input value={formData.family || ''} onChange={e => setFormData(p => ({ ...p, family: e.target.value }))} className="w-full px-2 py-1 border rounded text-xs outline-none" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Género</span><input value={formData.genus || ''} onChange={e => setFormData(p => ({ ...p, genus: e.target.value }))} className="w-full px-2 py-1 border rounded text-xs outline-none" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Epíteto (Especie)</span><input value={formData.specificEpithet || ''} onChange={e => setFormData(p => ({ ...p, specificEpithet: e.target.value }))} className="w-full px-2 py-1 border rounded text-xs outline-none" /></label>
                        </div>

                        <label className="block col-span-1 md:col-span-2">
                            <span className="text-sm font-medium text-gray-700 block mb-1">Nombre Común (vernacularName)</span>
                            <input value={formData.vernacularName || ''} onChange={e => setFormData(p => ({ ...p, vernacularName: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 outline-none" />
                        </label>
                        
                        <label className="block col-span-1 md:col-span-2">
                            <span className="text-sm font-medium text-gray-700 block mb-1">Descripción / Notas (taxonRemarks)</span>
                            <textarea value={formData.taxonRemarks || ''} onChange={e => setFormData(p => ({ ...p, taxonRemarks: e.target.value }))} rows={4} className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 outline-none resize-none" />
                            <p className="text-[10px] text-gray-400 mt-1">Texto que verá el usuario en la app de Unity.</p>
                        </label>

                        <div className="block col-span-1 md:col-span-2 border rounded-lg p-3 bg-white">
                            <span className="text-sm font-medium text-gray-700 mb-2 block">Archivo Unity (AssetBundle)</span>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-50 transition-colors">
                                    <ArrowUpTrayIcon className="w-4 h-4" />
                                    {uploading ? 'Subiendo a MinIO...' : 'Subir AssetBundle'}
                                </button>
                                {formData.assetBundleFileName && (
                                    <div className="flex items-center gap-1 text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        <span className="truncate max-w-[200px] font-mono text-xs">{formData.assetBundleFileName}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">Cancelar</button>
                        <button type="submit" disabled={uploading} className="px-5 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium" style={{ backgroundColor: THEME.primary }}>
                            {editItem ? 'Guardar Cambios' : 'Registrar Especie'}
                        </button>
                    </div>
                </form>
            </AnimatedModal>
        </div>
    )
}
