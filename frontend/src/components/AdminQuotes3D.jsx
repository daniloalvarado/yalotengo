import { useState, useEffect } from 'react'
import { EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon, ChatBubbleBottomCenterTextIcon, PhoneIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../api/client'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { cascade } from '../utils/animations'

export default function AdminQuotes3D() {
    const [quotes, setQuotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedQuote, setSelectedQuote] = useState(null)
    const [adminResponse, setAdminResponse] = useState('')
    const [statusEdit, setStatusEdit] = useState('')
    const [isSaving, setIsSaving] = useState(false)
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

    const loadQuotes = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/cotizaciones3d/admin/all')
            setQuotes(data)
        } catch (e) {
            console.error('Error fetching admin quotes', e)
            toast.error('Error al cargar cotizaciones')
        } finally {
            setLoading(false)
        }
    }

    const openResponseModal = (quote) => {
        setSelectedQuote(quote)
        setAdminResponse(quote.cot_txt_admin_response || '')
        setStatusEdit(quote.cot_txt_status)
    }

    const closeResponseModal = () => {
        setSelectedQuote(null)
    }

    const handleResponseSubmit = async (e) => {
        e.preventDefault()
        if (isSaving) return;
        setIsSaving(true)
        try {
            await api.patch(`/cotizaciones3d/admin/${selectedQuote.cot_int_id}`, {
                status: statusEdit,
                adminResponse: adminResponse
            })
            toast.success('Cotización actualizada y respondida')
            closeResponseModal()
            loadQuotes()
        } catch (error) {
            toast.error('Error al guardar respuesta')
        } finally {
            setIsSaving(false)
        }
    }

    const downloadImagesZip = async (quote) => {
        const images = parseImages(quote.cot_jso_images)
        if (images.length === 0) {
            toast.error('No hay imágenes para descargar')
            return
        }

        const toastId = toast.loading('Descargando imágenes...')
        try {
            const zip = new JSZip()
            const folder = zip.folder(`cotizacion_${quote.cot_int_id}`)

            for (const img of images) {
                const imgUrl = `${API_BASE}/uploads/cotizaciones/${img.filename}`
                const response = await fetch(imgUrl)
                const blob = await response.blob()
                folder.file(img.originalName || img.filename, blob)
            }

            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `Cotizacion_${quote.cot_int_id}_Ref.zip`)
            toast.success('Descarga completada', { id: toastId })
        } catch (error) {
            console.error(error)
            toast.error('Error al generar el ZIP', { id: toastId })
        }
    }

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'Cotizado': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'Comprado': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            case 'Rechazado': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    if (loading) return <div className="text-center py-10">Cargando cotizaciones...</div>

    if (quotes.length === 0) return (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 text-gray-500">
            No hay cotizaciones registradas aún.
        </div>
    )

    return (
        <div className="space-y-4">
            {quotes.map((quote, idx) => (
                <div key={quote.cot_int_id} {...cascade(idx, `bg-white rounded-xl border ${quote.cot_txt_status === 'Pendiente' ? 'border-yellow-300 shadow-md' : 'border-gray-200'} p-5 relative`)}>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Info Cliente */}
                        <div className="md:w-1/3 space-y-3 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                            <div>
                                <h3 className="font-bold text-gray-900">{quote.user?.use_txt_nombres} {quote.user?.use_txt_apellidos}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><EnvelopeIcon className="w-4 h-4"/> {quote.user?.use_txt_email}</p>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><PhoneIcon className="w-4 h-4"/> {quote.cot_txt_phone || quote.user?.use_txt_phone || 'No registrado'}</p>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg border text-xs">
                                <p className="font-semibold text-gray-700 mb-1">Preferencias del cliente:</p>
                                <ul className="space-y-1 text-gray-600">
                                    <li className="flex items-center gap-1">
                                        {quote.cot_bool_notify_whatsapp ? <CheckCircleIcon className="w-3 h-3 text-emerald-500"/> : <ExclamationTriangleIcon className="w-3 h-3 text-red-400"/>}
                                        Avisar por WhatsApp
                                    </li>
                                    <li className="flex items-center gap-1">
                                        {quote.cot_bool_notify_email ? <CheckCircleIcon className="w-3 h-3 text-emerald-500"/> : <ExclamationTriangleIcon className="w-3 h-3 text-red-400"/>}
                                        Avisar por Correo
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Info Cotización */}
                        <div className="md:w-2/3 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={`px-2 py-1 text-xs font-bold rounded border ${getStatusStyle(quote.cot_txt_status)}`}>
                                        {quote.cot_txt_status}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-2">
                                        {new Date(quote.cot_dat_created).toLocaleString('es-ES')}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => openResponseModal(quote)}
                                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-1"
                                >
                                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                                    Responder / Gestionar
                                </button>
                            </div>

                            <div className="bg-gray-50 border rounded-lg p-3">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción del requerimiento</h4>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{quote.cot_txt_description}</p>
                            </div>

                            {/* Galeria */}
                            {(() => {
                                const images = parseImages(quote.cot_jso_images)
                                if (images.length === 0) return null
                                return (
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fotos Referenciales ({images.length})</h4>
                                            <button onClick={() => downloadImagesZip(quote)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium underline">
                                                Descargar Todo (ZIP)
                                            </button>
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {images.map((img, i) => (
                                                <a 
                                                    key={i} 
                                                    href={`${API_BASE}/uploads/cotizaciones/${img.filename}`} 
                                                    target="_blank" rel="noreferrer"
                                                    className="shrink-0"
                                                >
                                                    <img 
                                                        src={`${API_BASE}/uploads/cotizaciones/${img.filename}`} 
                                                        alt="ref" 
                                                        className="w-16 h-16 rounded border object-cover hover:opacity-80 transition-opacity" 
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })()}

                        </div>
                    </div>

                </div>
            ))}

            {/* Modal de Respuesta */}
            {selectedQuote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Gestionar Cotización</h2>
                        
                        <form onSubmit={handleResponseSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado de cotización</label>
                                <select 
                                    value={statusEdit}
                                    onChange={(e) => setStatusEdit(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 outline-none text-sm"
                                >
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Cotizado">Cotizado (Respondido)</option>
                                    <option value="Comprado">Comprado (Cerrado)</option>
                                    <option value="Rechazado">Rechazado (Cerrado)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tu Respuesta / Oferta</label>
                                <p className="text-xs text-gray-500 mb-2">Este texto será visible para el cliente en su panel web.</p>
                                <textarea
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    rows="5"
                                    placeholder="Hola, el costo de impresión sería de S/ 50.00 y demora 2 días hábiles..."
                                    className="w-full px-3 py-2 border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none rounded-lg text-sm bg-emerald-50"
                                />
                            </div>

                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={closeResponseModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:opacity-50">
                                    {isSaving ? 'Guardando...' : 'Guardar Respuesta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
