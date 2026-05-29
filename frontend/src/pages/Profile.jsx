import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import { UserCircleIcon, CameraIcon, LockClosedIcon, IdentificationIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { cascade } from '../utils/animations'

export default function Profile() {
    const navigate = useNavigate()
    const location = useLocation()
    const fileInputRef = useRef(null)

    const [missingFields, setMissingFields] = useState(location.state?.missing || [])
    const isMissing = (field) => missingFields.includes(field)

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form State
    const [nombres, setNombres] = useState('')
    const [apellidos, setApellidos] = useState('')
    const [documento, setDocumento] = useState('')
    const [address, setAddress] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')

    // Password State
    const [currPass, setCurrPass] = useState('')
    const [newPass, setNewPass] = useState('')
    const [confirmPass, setConfirmPass] = useState('')

    useEffect(() => {
        fetchUser()
    }, [])

    const fetchUser = async () => {
        try {
            const { data } = await api.get('/auth/me')
            const u = data.user
            setUser(u)
            setNombres(u.use_txt_nombres || '')
            setApellidos(u.use_txt_apellidos || '')
            setDocumento(u.use_txt_documento || '')
            setAddress(u.use_txt_address || '')
            setPhone(u.use_txt_phone || '')
            setEmail(u.use_txt_email || '')
        } catch (e) {
            toast.error('Error cargando perfil')
            navigate('/auth')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setSaving(true)

        // Validar DNI si se ingresó
        if (documento && documento.length !== 8) {
            toast.error("El DNI debe tener exactamente 8 números.")
            setSaving(false)
            return
        }

        try {
            await api.put('/auth/me', {
                nombres,
                apellidos,
                documento,
                address,
                phone
            })
            toast.success('Perfil actualizado')
            setMissingFields([]) // Clear red borders immediately
            // Clear location state to remove red borders
            navigate(location.pathname, { replace: true, state: {} })
            // Forzar actualización en Header
            window.dispatchEvent(new Event('auth:changed'))
        } catch (e) {
            console.error(e)
            toast.error('Error al guardar cambios')
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (newPass.length < 8) {
            toast.error('La nueva contraseña debe tener al menos 8 caracteres')
            return
        }
        if (newPass !== confirmPass) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        setSaving(true)
        try {
            await api.put('/auth/change-password', {
                currentPassword: currPass,
                newPassword: newPass
            })
            toast.success('Contraseña actualizada')
            setCurrPass('')
            setNewPass('')
            setConfirmPass('')
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al cambiar contraseña')
        } finally {
            setSaving(false)
        }
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append('avatar', file)

        const loadingToast = toast.loading('Subiendo foto...')
        try {
            const { data } = await api.post('/auth/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            toast.success('Foto actualizada', { id: loadingToast })

            // Actualizar estado local
            setUser(prev => ({ ...prev, use_txt_avatar: data.avatar }))
            // Forzar actualización en Header
            window.dispatchEvent(new Event('auth:changed'))
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error subiendo foto', { id: loadingToast })
        }
    }

    if (loading) return <div className="p-8 text-center text-zinc-500">Cargando perfil...</div>

    // Check if user has password (local user)
    const isLocalUser = !!user?.use_txt_passwordhash

    // Avatar URL logic
    let avatarUrl = null
    if (user?.use_txt_avatar) {
        if (user.use_txt_avatar.startsWith('http')) {
            avatarUrl = user.use_txt_avatar
        } else {
            // Construct backend URL
            const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')
            avatarUrl = `${base}/uploads/avatars/${user.use_txt_avatar}`
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <h1 {...cascade(1)} className="text-3xl font-bold text-zinc-900">Mi Perfil</h1>

            <div className="grid md:grid-cols-[1fr_2fr] gap-8">

                {/* LEFT COLUMN: AVATAR & BASIC BADGE */}
                <div className="flex flex-col items-center gap-4">
                    <div {...cascade(2)} className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg bg-zinc-100 flex items-center justify-center">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        if (user?.use_txt_provider_avatar && e.target.src !== user.use_txt_provider_avatar) {
                                            e.target.src = user.use_txt_provider_avatar;
                                        } else {
                                            e.target.onerror = null;
                                            e.target.style.display = 'none'; // Ocultar si falla todo para mostrar el icono de fondo
                                        }
                                    }}
                                />
                            ) : (
                                <UserCircleIcon className="w-full h-full text-zinc-300 p-4" />
                            )}
                        </div>
                        {/* Overlay */}
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <CameraIcon className="w-8 h-8 text-white" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp, image/gif"
                            onChange={handleFileChange}
                        />
                    </div>
                    <p {...cascade(3)} className="text-sm text-zinc-500 text-center">
                        Click para cambiar foto<br />
                        (Max 5MB)
                    </p>
                </div>

                {/* RIGHT COLUMN: FORMS */}
                <div className="space-y-8">

                    {/* PERSONAL INFO */}
                    <section className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                        <h2 {...cascade(4)} className="text-xl font-semibold text-zinc-800 mb-6 flex items-center gap-2">
                            <IdentificationIcon className="w-5 h-5 text-emerald-500" />
                            Información Personal
                        </h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label {...cascade(5)} className="block text-sm font-medium text-zinc-700 mb-1">Nombres</label>
                                    <input
                                        {...cascade(6, "w-full px-4 py-2 rounded-lg border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:ring-offset-1 transition-shadow")}
                                        type="text"
                                        value={nombres}
                                        onChange={e => setNombres(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label {...cascade(7)} className="block text-sm font-medium text-zinc-700 mb-1">Apellidos</label>
                                    <input
                                        {...cascade(8, "w-full px-4 py-2 rounded-lg border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:ring-offset-1 transition-shadow")}
                                        type="text"
                                        value={apellidos}
                                        onChange={e => setApellidos(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* DNI & PHONE */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label {...cascade(9)} className="block text-sm font-medium text-zinc-700 mb-1">DNI (8 dígitos)</label>
                                    <input
                                        {...cascade(10, `w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:ring-offset-1 transition-shadow ${isMissing('DNI') ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-zinc-300'}`)}
                                        type="text"
                                        maxLength={8}
                                        value={documento}
                                        onChange={e => setDocumento(e.target.value.replace(/\D/g, ''))}
                                    />
                                    {isMissing('DNI') && <span className="text-xs text-red-500">Requerido para compras</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1 flex items-center gap-1">
                                        <PhoneIcon className="w-4 h-4" /> Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:ring-offset-1 transition-shadow ${isMissing('Teléfono') ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-zinc-300'}`}
                                        placeholder="9xx xxx xxx"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                    />
                                    {isMissing('Teléfono') && <span className="text-xs text-red-500">Requerido para compras</span>}
                                </div>
                            </div>

                            {/* EMAIL */}
                            <div {...cascade(6)}>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    disabled
                                    className="w-full px-4 py-2 rounded-lg border-zinc-200 bg-zinc-50 text-zinc-500 cursor-not-allowed"
                                    value={email}
                                />
                            </div>

                            {/* ADDRESS (Full Width, Textarea) */}
                            <div {...cascade(7)}>
                                <label className="block text-sm font-medium text-zinc-700 mb-1 flex items-center gap-1">
                                    <MapPinIcon className="w-4 h-4" /> Dirección
                                </label>
                                <textarea
                                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:ring-offset-1 transition-shadow resize-y ${isMissing('Dirección') ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-zinc-300'}`}
                                    rows={3}
                                    placeholder="Av. Principal 123, Distrito, Provincia..."
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                />
                                {isMissing('Dirección') && <span className="text-xs text-red-500">Requerido para compras</span>}
                            </div>

                            <div {...cascade(8)} className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70"
                                >
                                    {saving ? 'Guardando...' : 'Guardar Información'}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* CHANGE PASSWORD (ONLY LOCAL USERS) */}
                    {isLocalUser && (
                        <section {...cascade(4)} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-zinc-800 mb-6 flex items-center gap-2">
                                <LockClosedIcon className="w-5 h-5 text-amber-500" />
                                Seguridad
                            </h2>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div {...cascade(5)}>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Contraseña Actual</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:ring-offset-1 transition-shadow"
                                        value={currPass}
                                        onChange={e => setCurrPass(e.target.value)}
                                    />
                                </div>
                                <div {...cascade(6)} className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Nueva Contraseña (min 8)</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:ring-offset-1 transition-shadow"
                                            value={newPass}
                                            onChange={e => setNewPass(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Confirmar</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:ring-offset-1 transition-shadow"
                                            value={confirmPass}
                                            onChange={e => setConfirmPass(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div {...cascade(7)} className="pt-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-zinc-800 hover:bg-zinc-900 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70"
                                    >
                                        Actualizar Contraseña
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

                </div>
            </div>
        </div>
    )
}
