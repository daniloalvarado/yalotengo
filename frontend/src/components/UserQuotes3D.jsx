import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react'
import { PencilSquareIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon, DocumentMagnifyingGlassIcon, EnvelopeIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import api from '../api/client'
import QuoteModal from './QuoteModal'
import Swal from 'sweetalert2'

const UserQuotes3D = forwardRef((props, ref) => {
    const [quotes, setQuotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingQuote, setEditingQuote] = useState(null)
    const [editDesc, setEditDesc] = useState('')
    const [editRetainedImages, setEditRetainedImages] = useState([])
    const [editNewImages, setEditNewImages] = useState([])
    const [editNotifyWhatsapp, setEditNotifyWhatsapp] = useState(false)
    const [editNotifyEmail, setEditNotifyEmail] = useState(false)
    const API_BASE = (import.meta.env.VITE_API_BASE || api.defaults.baseURL || 'http://localhost:3000').replace(/\/api\/?$/, '')

    const parseImages = (imgs) => {
        if (!imgs) return []
        if (Array.isArray(imgs)) return imgs
        try {
            const parsed = JSON.parse(imgs)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }

    useEffect(() => {
        loadQuotes()
    }, [])

    useImperativeHandle(ref, () => ({
        loadQuotes
    }))

    const loadQuotes = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/cotizaciones3d/me')
            setQuotes(data)
        } catch (e) {
            console.error('Error loading quotes', e)
            toast.error('Error cargando cotizaciones')
        } finally {
            setLoading(false)
        }
    }

    const startEdit = (quote) => {
        setEditingQuote(quote)
        setEditDesc(quote.cot_txt_description)
        setEditRetainedImages(parseImages(quote.cot_jso_images))
        setEditNewImages([])
        setEditNotifyWhatsapp(quote.cot_bool_notify_whatsapp === 1)
        setEditNotifyEmail(quote.cot_bool_notify_email === 1)
    }

    const cancelEdit = () => {
        setEditingQuote(null)
        setEditDesc('')
        setEditRetainedImages([])
        setEditNewImages([])
        setEditNotifyWhatsapp(false)
        setEditNotifyEmail(false)
    }

    const saveEdit = async (id) => {
        if (!editDesc.trim()) {
            toast.error('La descripción no puede estar vacía')
            return
        }
        if (editRetainedImages.length + editNewImages.length === 0) {
            toast.error('Debes incluir al menos 1 imagen referencial')
            return
        }
        if (editRetainedImages.length + editNewImages.length > 5) {
            toast.error('No puedes tener más de 5 imágenes en total')
            return
        }

        const toastId = toast.loading('Guardando cambios...')
        try {
            const formData = new FormData()
            formData.append('description', editDesc)
            formData.append('notifyWhatsapp', editNotifyWhatsapp)
            formData.append('notifyEmail', editNotifyEmail)
            formData.append('retainedImages', JSON.stringify(editRetainedImages))
            editNewImages.forEach(file => {
                formData.append('images', file)
            })

            await api.put(`/cotizaciones3d/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            toast.success('Cotización actualizada', { id: toastId })
            setEditingQuote(null)
            loadQuotes()
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al actualizar', { id: toastId })
        }
    }

    const onDrop = useCallback((acceptedFiles) => {
        const currentTotal = editRetainedImages.length + editNewImages.length
        const remainingSlots = 5 - currentTotal
        
        if (acceptedFiles.length > remainingSlots) {
            toast.error(`Solo puedes subir ${remainingSlots} imagen(es) más. (Máx 5)`)
            acceptedFiles = acceptedFiles.slice(0, remainingSlots)
        }

        setEditNewImages(prev => [
            ...prev,
            ...acceptedFiles.map(file => Object.assign(file, {
                preview: URL.createObjectURL(file)
            }))
        ])
    }, [editRetainedImages.length, editNewImages.length])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
        maxSize: 5 * 1024 * 1024 // 5MB
    })

    const removeRetainedImage = (index) => {
        setEditRetainedImages(prev => prev.filter((_, i) => i !== index))
    }

    const removeNewImage = (index) => {
        setEditNewImages(prev => prev.filter((_, i) => i !== index))
    }

    useEffect(() => {
        return () => editNewImages.forEach(file => URL.revokeObjectURL(file.preview))
    }, [editNewImages])

    const deleteQuote = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar cotización?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        })

        if (!result.isConfirmed) return

        try {
            await api.delete(`/cotizaciones3d/${id}`)
            toast.success('Cotización eliminada')
            loadQuotes()
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al eliminar')
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pendiente':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg break-words">En Revisión</span>
            case 'Cotizado':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg break-words flex items-center gap-1"><EnvelopeIcon className="w-3 h-3"/> Cotizado</span>
            case 'Comprado':
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg break-words flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Comprado</span>
            case 'Rechazado':
                return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg break-words flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3"/> Rechazado</span>
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg">{status}</span>
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    if (quotes.length === 0) {
        return (
            <div className="text-center py-16 bg-gray-50 dark:bg-[#141414] rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                <DocumentMagnifyingGlassIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-zinc-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No tienes cotizaciones activas</h3>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Solicita una cotización personalizada de tus propias imágenes</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {quotes.map(quote => (
                <div key={quote.cot_int_id} className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        
                        {/* Status + Date + Info */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                {getStatusBadge(quote.cot_txt_status)}
                                <span className="text-xs text-gray-500">
                                    {new Date(quote.cot_dat_created).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                            </div>

                            {/* Editar o Mostrarla */}
                            {editingQuote?.cot_int_id === quote.cot_int_id ? (
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">Descripción</span>
                                        <textarea 
                                            value={editDesc}
                                            onChange={e => setEditDesc(e.target.value)}
                                            className="w-full px-3 py-2 border dark:border-zinc-700 dark:bg-[#141414] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            rows="3"
                                        />
                                    </label>

                                    {/* Imágenes (Edición) */}
                                    <div>
                                        <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Imágenes Referenciales ({editRetainedImages.length + editNewImages.length}/5)</span>
                                        
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {/* Retained Images */}
                                            {editRetainedImages.map((img, i) => (
                                                <div key={`ret-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden border group">
                                                    <img 
                                                        src={`${API_BASE}/uploads/cotizaciones/${img.filename}`} 
                                                        className="w-full h-full object-cover" 
                                                        alt="ret"
                                                    />
                                                    <button onClick={() => removeRetainedImage(i)} className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white transition-all">
                                                        <XMarkIcon className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            ))}
                                            {/* New Previews */}
                                            {editNewImages.map((file, i) => (
                                                <div key={`new-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden border border-emerald-500 group">
                                                    <img 
                                                        src={file.preview} 
                                                        className="w-full h-full object-cover" 
                                                        alt="new"
                                                    />
                                                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] px-1 rounded-bl">Nuevo</div>
                                                    <button onClick={() => removeNewImage(i)} className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white transition-all">
                                                        <XMarkIcon className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {(editRetainedImages.length + editNewImages.length) < 5 && (
                                            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${isDragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-300 dark:border-zinc-700 hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-[#141414]'}`}>
                                                <input {...getInputProps()} />
                                                <PhotoIcon className="w-6 h-6 mx-auto text-gray-400 dark:text-zinc-500 mb-1" />
                                                <p className="text-xs text-gray-500 dark:text-zinc-400">Arrastra fotos aquí, o clic para buscar</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Notificaciones */}
                                    <div className="flex gap-4 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={editNotifyWhatsapp} onChange={e => setEditNotifyWhatsapp(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded border-gray-300 dark:border-zinc-700 dark:bg-[#141414] focus:ring-emerald-600" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Notificar por WhatsApp</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={editNotifyEmail} onChange={e => setEditNotifyEmail(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded border-gray-300 dark:border-zinc-700 dark:bg-[#141414] focus:ring-emerald-600" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Notificar por Correo</span>
                                        </label>
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                        <button onClick={() => saveEdit(quote.cot_int_id)} className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 shadow-sm">Guardar Cambios</button>
                                        <button onClick={cancelEdit} className="px-4 py-2 bg-gray-100 dark:bg-[#141414] text-gray-700 dark:text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800">Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-800 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                        {quote.cot_txt_description}
                                    </p>
                                    {/* Archivos Adjuntos y Notificaciones */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                                        {(() => {
                                            const images = parseImages(quote.cot_jso_images)
                                            if (images.length > 0) {
                                                return (
                                                    <div className="flex gap-2 flex-wrap flex-1">
                                                        {images.map((img, i) => (
                                                            <a 
                                                                key={i} 
                                                                href={`${API_BASE}/uploads/cotizaciones/${img.filename}`}
                                                                target="_blank" rel="noreferrer"
                                                                className="w-12 h-12 rounded-lg overflow-hidden border block hover:opacity-80 transition-opacity"
                                                            >
                                                                <img 
                                                                    src={`${API_BASE}/uploads/cotizaciones/${img.filename}`} 
                                                                    alt="ref" 
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )
                                            }
                                            return <div className="flex-1 text-xs text-gray-400 dark:text-zinc-600 italic">Sin imágenes adjuntas</div>
                                        })()}

                                        {/* Mostrar checks en vista de lectura */}
                                        <div className="flex gap-4 sm:pl-4 sm:border-l border-gray-200 dark:border-zinc-800">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${quote.cot_bool_notify_whatsapp ? 'bg-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/50' : 'bg-gray-300 dark:bg-zinc-700'}`}></div>
                                                <span className={`text-xs ${quote.cot_bool_notify_whatsapp ? 'text-gray-700 dark:text-gray-300 font-bold' : 'text-gray-400 dark:text-zinc-600'}`}>WhatsApp</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${quote.cot_bool_notify_email ? 'bg-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/50' : 'bg-gray-300 dark:bg-zinc-700'}`}></div>
                                                <span className={`text-xs ${quote.cot_bool_notify_email ? 'text-gray-700 dark:text-gray-300 font-bold' : 'text-gray-400 dark:text-zinc-600'}`}>Correo</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Respuesta del Admin! */}
                            {quote.cot_txt_admin_response && (
                                <div className="mt-4 p-4 bg-emerald-50 dark:bg-[#00D1AE]/10 border border-emerald-100 dark:border-[#00D1AE]/30 rounded-xl relative">
                                    <h4 className="text-xs font-bold text-emerald-800 dark:text-[#5eead4] uppercase tracking-wider mb-2">Respuesta de Soporte</h4>
                                    <p className="text-sm text-emerald-900 dark:text-[#a7f3d0] whitespace-pre-wrap">{quote.cot_txt_admin_response}</p>
                                </div>
                            )}
                        </div>

                        {/* Botones Acciones */}
                        {quote.cot_txt_status === 'Pendiente' && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => startEdit(quote)}
                                    className="p-2 text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                                    title="Editar"
                                >
                                    <PencilSquareIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => deleteQuote(quote.cot_int_id)}
                                    className="p-2 text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-800"
                                    title="Eliminar"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
})

export default UserQuotes3D
