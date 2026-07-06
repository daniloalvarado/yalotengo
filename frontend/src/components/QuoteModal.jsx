import { useState, useEffect } from 'react'
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../api/client'
import AnimatedModal from './AnimatedModal'

export default function QuoteModal({ isOpen, onClose, onSuccess }) {
    const [description, setDescription] = useState('')
    const [images, setImages] = useState([])
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [notifyWhatsapp, setNotifyWhatsapp] = useState(false)
    const [notifyEmail, setNotifyEmail] = useState(false)
    const [loading, setLoading] = useState(false)
    const [profileError, setProfileError] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadUserProfile()
            // Reset form
            setDescription('')
            setImages([])
            setNotifyWhatsapp(false)
            setNotifyEmail(false)
            setProfileError(false)
        }
    }, [isOpen])

    const loadUserProfile = async () => {
        try {
            const { data } = await api.get('/auth/me')
            const u = data.user
            setPhone(u.use_txt_phone || '')
            setEmail(u.use_txt_email || '')
            if (!u.use_txt_phone || !u.use_txt_email) {
                setProfileError(true)
            }
        } catch (e) {
            console.error('Error loading profile', e)
        }
    }

    const handleImageDrop = (e) => {
        e.preventDefault()
        const files = Array.from(e.dataTransfer ? e.dataTransfer.files : e.target.files)
        
        const validFiles = files.filter(f => f.type.startsWith('image/'))
        if (validFiles.length + images.length > 5) {
            toast.error('Máximo 5 imágenes permitidas')
            return
        }
        
        setImages(prev => [...prev, ...validFiles])
    }

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!description.trim()) {
            toast.error('La descripción es obligatoria')
            return
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('description', description)
            formData.append('phone', phone)
            formData.append('notifyWhatsapp', notifyWhatsapp)
            formData.append('notifyEmail', notifyEmail)

            images.forEach(img => {
                formData.append('images', img)
            })

            await api.post('/cotizaciones3d', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            toast.success('Cotización enviada. Atenderemos tu solicitud pronto.')
            onSuccess()
            onClose()
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al enviar cotización')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatedModal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Cotización Personalizada" 
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Descripción de tu idea <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Describe qué deseas imprimir (medidas, colores, detalles específicos, material...)"
                                rows="4"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Imágenes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fotos de referencia (Max 5)
                            </label>
                            <div 
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleImageDrop}
                                className="border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-zinc-700 dark:bg-zinc-800 transition-colors"
                            >
                                <PhotoIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Arrastra y suelta tus imágenes aquí</p>
                                <label className="text-sm text-emerald-600 font-medium hover:text-emerald-700 cursor-pointer">
                                    O selecciona desde tu dispositivo
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleImageDrop}
                                    />
                                </label>
                            </div>

                            {/* Previews */}
                            {images.length > 0 && (
                                <div className="mt-4 grid grid-cols-5 gap-2">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
                                            <img src={URL.createObjectURL(img)} alt={`preview ${i}`} className="w-full h-full object-cover" />
                                            <button 
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <TrashIcon className="w-5 h-5 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Datos de contacto */}
                        <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Datos de Contacto</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-gray-400">Correo Electrónico</label>
                                    <input type="text" disabled value={email} className="w-full bg-transparent dark:text-white border-b border-gray-200 dark:border-zinc-700 py-1 text-sm text-gray-700 dark:text-gray-300" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-gray-400">Teléfono</label>
                                    <input type="text" disabled value={phone || 'No registrado'} className="w-full bg-transparent dark:text-white border-b border-gray-200 dark:border-zinc-700 py-1 text-sm text-gray-700 dark:text-gray-300" />
                                </div>
                            </div>
                            
                            <div className="mt-3 text-sm flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 text-xs">Se usarán estos datos para contactarte.</span>
                                <a href="/profile" className="text-emerald-600 hover:text-emerald-700 font-medium text-xs">
                                    ¿Tus datos son incorrectos? Actualizar datos
                                </a>
                            </div>
                        </div>

                        {/* Preferencias de Notificación */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferencias de respuesta</h3>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={notifyWhatsapp}
                                        onChange={e => setNotifyWhatsapp(e.target.checked)}
                                        className="rounded border-gray-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Deseo recibir una copia de mi cotización por WhatsApp (Si registraste teléfono)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={notifyEmail}
                                        onChange={e => setNotifyEmail(e.target.checked)}
                                        className="rounded border-gray-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Deseo recibir una copia por Correo Electrónico</span>
                                </label>
                            </div>
                        </div>

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || profileError}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                        >
                            {loading ? 'Enviando...' : 'Enviar Cotización'}
                        </button>
                    </div>
            </form>
        </AnimatedModal>
    )
}
