import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon, ArrowUpTrayIcon, CheckCircleIcon, ChartBarSquareIcon, CircleStackIcon } from '@heroicons/react/24/outline'
import AnimatedModal from '../components/AnimatedModal'
import AdminUnityDashboard from './AdminUnityDashboard'

const THEME = { primary: '#059669' }
const API_BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:3000').replace(/\/api$/, '');

export default function AdminUnityModels() {
    const navigate = useNavigate()
    const [models, setModels] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedPanel, setSelectedPanel] = useState('')
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    const [showModal, setShowModal] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [formData, setFormData] = useState({})
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [uploadingAsset, setUploadingAsset] = useState(false)
    const [uploadingQr, setUploadingQr] = useState(false)
    const [uploadingQr2, setUploadingQr2] = useState(false)
    const [tabIdiomaActivo, setTabIdiomaActivo] = useState(null)
    const fileInputRef = useRef(null)
    const qrInputRef = useRef(null)
    const qrInput2Ref = useRef(null)

    // Nuevo estado para Pestañas
    const [activeTab, setActiveTab] = useState('gestion')

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

        let trans = []
        if (item && item.translations && item.translations.length > 0) {
            trans = [...item.translations]
        }

        setFormData(item ? { ...item, translations: trans } : {
            scientificName: '', kingdom: 'Animalia', phylum: '', subphylum: '', class: '', subclass: '', order: '', family: '', genus: '', specificEpithet: '',
            vernacularName: '', taxonRemarks: '', fuente: '', tematica: '', assetBundleFileName: '', qr_image_url: '', qr_image_url2: '',
            translations: trans
        })

        if (trans.length > 0) {
            setTabIdiomaActivo(trans[0].language_code);
        } else {
            setTabIdiomaActivo(null);
        }

        setShowModal(true)
    }

    const handleFileUpload = async (e, type = 'asset') => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log(`[FRONTEND] INICIANDO SUBIDA: ${file.name} (Tipo: ${type}, Tamaño: ${file.size} bytes)`);

        if (type === 'asset') setUploadingAsset(true);
        else if (type === 'qr') setUploadingQr(true);
        else setUploadingQr2(true);

        const formDataUpload = new FormData();
        formDataUpload.append(type === 'asset' ? 'assetBundleFile' : (type === 'qr' ? 'qrImageFile' : 'qrImageFile2'), file);

        // Si ya hay un archivo, avisamos para que el servidor lo borre
        const oldFile = type === 'asset' ? formData.assetBundleFileName : (type === 'qr' ? formData.qr_image_url : formData.qr_image_url2);
        if (oldFile) formDataUpload.append('oldFile', oldFile);

        const toastId = toast(`Subiendo ${file.name}...`, { icon: '⏳' });

        try {
            console.log("[FRONTEND] Enviando petición POST a /microscopicos/admin/upload...");
            const { data } = await api.post('/microscopicos/admin/upload', formDataUpload);
            console.log("[FRONTEND] Respuesta del servidor recibida:", data);

            if (type === 'asset' && data.assetBundleFileName) {
                setFormData(prev => ({ ...prev, assetBundleFileName: data.assetBundleFileName }));
                toast.success('Archivo 3D actualizado');
            } else if (type === 'qr' && data.qr_image_url) {
                setFormData(prev => ({ ...prev, qr_image_url: data.qr_image_url }));
                toast.success('Marcador AR actualizado');
            } else if (type === 'qr2' && data.qr_image_url2) {
                setFormData(prev => ({ ...prev, qr_image_url2: data.qr_image_url2 }));
                toast.success('Marcador Secundario actualizado');
            }
        } catch (err) {
            console.error("[FRONTEND] ERROR CRÍTICO EN SUBIDA:", err);
            toast.error('Fallo en la comunicación con el servidor');
        } finally {
            console.log("[FRONTEND] Proceso de subida finalizado.");
            setUploadingAsset(false);
            setUploadingQr(false);
            setUploadingQr2(false); 
            toast.dismiss(toastId);
        }
    };

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

    const uniquePanels = [...new Set(models.map(m => m.tematica).filter(Boolean))].sort()

    const filteredModels = models.filter(m => {
        const term = searchTerm.toLowerCase()
        const matchText = (m.scientificName || '').toLowerCase().includes(term) ||
            (m.vernacularName || '').toLowerCase().includes(term)

        const matchPanel = selectedPanel === '' || m.tematica === selectedPanel

        return matchText && matchPanel
    })

    // Lógica de Paginación
    const totalPages = Math.ceil(filteredModels.length / itemsPerPage)
    const paginatedModels = filteredModels.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Resetear a página 1 al buscar o filtrar
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, selectedPanel])

    if (!isAdmin) return <div className="p-8 text-center text-gray-500">Verificando permisos...</div>

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de App AR</h1>
                    <p className="text-gray-500 text-sm">Panel de control de Realidad Aumentada</p>
                </div>
                {activeTab === 'gestion' && (
                    <button
                        onClick={() => openModal()}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg shadow-md hover:opacity-90 transition-all"
                        style={{ backgroundColor: THEME.primary }}
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Agregar Especie</span>
                    </button>
                )}
            </div>

            {/* Pestañas de Navegación */}
            <div className="flex space-x-1 bg-gray-100/50 p-1.5 rounded-xl border border-gray-200">
                <button
                    onClick={() => setActiveTab('gestion')}
                    className={`flex items-center gap-2 flex-1 justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'gestion' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                >
                    <CircleStackIcon className="w-5 h-5" />
                    Modelos 3D
                </button>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-2 flex-1 justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                >
                    <ChartBarSquareIcon className="w-5 h-5" />
                    Dashboard AR
                </button>
            </div>

            {activeTab === 'dashboard' ? (
                <AdminUnityDashboard />
            ) : (
                <>
                    <div className="mb-4 mt-2">
                        <div className="flex flex-row flex-wrap xs:flex-nowrap gap-3 items-center justify-between w-full">
                            <div className="relative w-full sm:max-w-md">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre científico o común..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all shadow-sm hover:border-emerald-300"
                                />
                            </div>
                            <div className="w-full sm:w-auto min-w-[200px]">
                                <select
                                    value={selectedPanel}
                                    onChange={(e) => setSelectedPanel(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all shadow-sm hover:border-emerald-300 bg-white cursor-pointer"
                                >
                                    <option value="">Todas las Temáticas</option>
                                    {uniquePanels.map((tematica, idx) => (
                                        <option key={idx} value={tematica}>{tematica}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? <div className="text-gray-500">Cargando datos...</div> : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600 w-12 text-center">N°</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600">Especie</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600">Temática</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600">Taxonomía</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600">Idiomas</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600">Marcador AR</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-600">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedModels.map((m, idx) => (
                                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-center text-gray-400 font-mono text-xs">
                                                {(currentPage - 1) * itemsPerPage + idx + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-gray-900 italic">{m.scientificName}</div>
                                                <div className="text-xs text-gray-500">{m.vernacularName || 'Sin nombre común'} (ID: {m.id})</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-700">{m.tematica || <span className="text-gray-300 italic">No asignada</span>}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs text-gray-600">
                                                    {m.class || '?'} &gt; {m.order || '?'} &gt; {m.family || '?'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex gap-1 flex-wrap justify-center">
                                                    <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100 font-bold">es</span>
                                                    {m.translations?.filter(t => t.name || t.descripcion).map(t => (
                                                        <span key={t.id} className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100 font-bold">
                                                            {t.language_code}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex gap-2 justify-center">
                                                    {!m.qr_image_url && !m.qr_image_url2 ? (
                                                        <span className="text-gray-400 text-[10px] italic">Sin marcadores</span>
                                                    ) : (
                                                        <>
                                                            {m.qr_image_url && (
                                                                <div className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center">
                                                                    <img
                                                                        src={`${API_BASE_URL}/uploads/microscopicos/${m.qr_image_url}`}
                                                                        alt="Marcador"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            )}
                                                            {m.qr_image_url2 && (
                                                                <div className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center">
                                                                    <img
                                                                        src={`${API_BASE_URL}/uploads/microscopicos/${m.qr_image_url2}`}
                                                                        alt="Marcador 2"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
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
                                    {filteredModels.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                No se encontraron especies microscópicas.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Controles de Paginación */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200 mt-4 shadow-sm">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredModels.length)}</span> de <span className="font-medium">{filteredModels.length}</span> modelos
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setCurrentPage(p => Math.max(1, p - 1));
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
                                    >
                                        Anterior
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => {
                                                setCurrentPage(i + 1);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className={`px-3 py-1 border rounded text-sm transition-colors ${currentPage === i + 1 ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            setCurrentPage(p => Math.min(totalPages, p + 1));
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <AnimatedModal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Editar Especie' : 'Nueva Especie'} maxWidth="max-w-2xl" closeOnOutsideClick={false}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block col-span-1 md:col-span-2">
                            <span className="text-sm font-medium text-gray-700 block mb-1">Nombre Común</span>
                            <input
                                value={formData.vernacularName || ''}
                                onChange={e => setFormData(p => ({ ...p, vernacularName: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Ej: Abeja Melipona"
                            />
                        </label>

                        <label className="block col-span-1 md:col-span-2">
                            <span className="text-sm font-medium text-gray-700 block mb-1">Nombre Científico</span>
                            <input
                                value={formData.scientificName || ''}
                                onChange={e => setFormData(p => ({ ...p, scientificName: e.target.value }))}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Ej: Melipona beecheii"
                            />
                        </label>

                        <label className="block col-span-1 md:col-span-2">
                            <span className="text-sm font-medium text-gray-700 block mb-1">Temática (Para Filtros en Galería)</span>
                            <input
                                value={formData.tematica || ''}
                                onChange={e => setFormData(p => ({ ...p, tematica: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-emerald-50/10"
                                placeholder="Ej: Insectos, Cultura, Microscopio"
                            />
                        </label>

                        <div className="col-span-1 md:col-span-2 p-3 bg-gray-50 rounded-lg border text-sm grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <p className="col-span-full font-semibold text-gray-600 mb-1 text-xs uppercase tracking-wider">Taxonomía</p>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Reino</span><input value={formData.kingdom || ''} onChange={e => setFormData(p => ({ ...p, kingdom: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Filo</span><input value={formData.phylum || ''} onChange={e => setFormData(p => ({ ...p, phylum: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Subfilo</span><input value={formData.subphylum || ''} onChange={e => setFormData(p => ({ ...p, subphylum: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Clase</span><input value={formData.class || ''} onChange={e => setFormData(p => ({ ...p, class: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Subclase</span><input value={formData.subclass || ''} onChange={e => setFormData(p => ({ ...p, subclass: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Orden</span><input value={formData.order || ''} onChange={e => setFormData(p => ({ ...p, order: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Familia</span><input value={formData.family || ''} onChange={e => setFormData(p => ({ ...p, family: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Género</span><input value={formData.genus || ''} onChange={e => setFormData(p => ({ ...p, genus: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></label>
                            <label className="block"><span className="text-xs text-gray-500 block mb-1">Epíteto (Especie)</span><input value={formData.specificEpithet || ''} onChange={e => setFormData(p => ({ ...p, specificEpithet: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" /></label>
                        </div>

                        <label className="block col-span-1 md:col-span-2">
                            <span className="text-sm font-medium text-gray-700 block mb-1">Descripción / Notas</span>
                            <textarea
                                value={formData.taxonRemarks || ''}
                                onChange={e => setFormData(p => ({ ...p, taxonRemarks: e.target.value }))}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none transition-all"
                                placeholder="Descripción general de la especie..."
                            />
                        </label>


                        {/* TRADUCCIONES DINÁMICAS (TABS) */}
                        <div className="col-span-1 md:col-span-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <CircleStackIcon className="w-4 h-4 text-emerald-600" />
                                    Traducciones e Idiomas
                                </h3>
                                <button type="button" onClick={async () => {
                                    const { value: lang } = await Swal.fire({
                                        title: 'Añadir Idioma',
                                        input: 'select',
                                        inputOptions: { 'en': 'Inglés', 'pt': 'Portugués', 'fr': 'Francés', 'de': 'Alemán', 'it': 'Italiano' },
                                        inputPlaceholder: 'Selecciona uno...',
                                        showCancelButton: true,
                                        confirmButtonColor: '#059669'
                                    });
                                    if (lang) {
                                        if (formData.translations?.find(t => t.language_code === lang)) return toast.error('Este idioma ya existe');
                                        const newTrans = [...(formData.translations || []), { language_code: lang, name: '', descripcion: '' }];
                                        setFormData(p => ({ ...p, translations: newTrans }));
                                        setTabIdiomaActivo(lang); // Cambiar automáticamente a la nueva pestaña
                                    }
                                }} className="text-xs bg-white border border-emerald-200 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors font-semibold flex items-center gap-1 shadow-sm">
                                    <PlusIcon className="w-4 h-4" /> Añadir Idioma
                                </button>
                            </div>

                            {/* CABECERA DE TABS */}
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                                {(formData.translations || []).length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-2">No hay traducciones adicionales agregadas.</p>
                                ) : (
                                    formData.translations.map((t) => {
                                        const nombres = { en: 'Inglés', pt: 'Portugués', fr: 'Francés', de: 'Alemán', it: 'Italiano' };
                                        const isActive = tabIdiomaActivo === t.language_code;
                                        return (
                                            <button
                                                key={t.language_code}
                                                type="button"
                                                onClick={() => setTabIdiomaActivo(t.language_code)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${isActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-md translate-y-[-1px]' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'}`}
                                            >
                                                {nombres[t.language_code] || t.language_code}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* CONTENIDO DEL TAB ACTIVO */}
                            {formData.translations?.map((t, idx) => (
                                tabIdiomaActivo === t.language_code && (
                                    <div key={idx} className="bg-white rounded-xl p-4 border border-emerald-100 shadow-inner space-y-4 animate-fadeIn">
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                            <span className="text-xs font-black text-emerald-700 uppercase">Editando: {({ en: 'Inglés', pt: 'Portugués', fr: 'Francés', de: 'Alemán', it: 'Italiano' }[t.language_code])}</span>
                                            <button type="button" onClick={() => {
                                                const newTrans = formData.translations.filter((_, i) => i !== idx);
                                                setFormData({ ...formData, translations: newTrans });
                                                if (newTrans.length > 0) setTabIdiomaActivo(newTrans[0].language_code);
                                            }} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <label className="block">
                                            <span className="text-[11px] font-bold text-gray-500 block mb-1">Nombre ({t.language_code})</span>
                                            <input value={t.name || ''} onChange={(e) => {
                                                const newTrans = [...formData.translations];
                                                newTrans[idx].name = e.target.value;
                                                setFormData({ ...formData, translations: newTrans });
                                            }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                                        </label>
                                        <label className="block">
                                            <span className="text-[11px] font-bold text-gray-500 block mb-1">Descripción ({t.language_code})</span>
                                            <textarea value={t.descripcion || ''} onChange={(e) => {
                                                const newTrans = [...formData.translations];
                                                newTrans[idx].descripcion = e.target.value;
                                                setFormData({ ...formData, translations: newTrans });
                                            }} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none transition-all" />
                                        </label>
                                    </div>
                                )
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 col-span-1 md:col-span-2">
                            <div className="border rounded-lg p-3 bg-white">
                                <span className="text-sm font-medium text-gray-700 mb-2 block">Archivo 3D (.molde / .glb)</span>
                                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'asset')} accept=".molde,.glb" className="hidden" />
                                <div className="flex flex-col gap-2">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAsset} className="flex items-center justify-center gap-2 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-50 transition-colors">
                                        <ArrowUpTrayIcon className="w-4 h-4" />
                                        {uploadingAsset ? 'Subiendo...' : 'Subir Modelo 3D'}
                                    </button>
                                    {formData.assetBundleFileName && (
                                        <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                            <CheckCircleIcon className="w-3 h-3 shrink-0" />
                                            <span className="truncate max-w-[150px] font-mono">{formData.assetBundleFileName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border rounded-lg p-3 bg-white">
                                <span className="text-sm font-medium text-gray-700 mb-2 block">Marcador AR(JPG/PNG)</span>
                                <input type="file" ref={qrInputRef} onChange={(e) => handleFileUpload(e, 'qr')} accept="image/png, image/jpeg" className="hidden" />
                                <div className="flex flex-col gap-2">
                                    <button type="button" onClick={() => qrInputRef.current?.click()} disabled={uploadingQr} className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm disabled:opacity-50 transition-colors">
                                        <ArrowUpTrayIcon className="w-4 h-4" />
                                        {uploadingQr ? 'Subiendo...' : 'Subir Foto'}
                                    </button>
                                    {formData.qr_image_url && (
                                        <div className="flex flex-col items-center justify-center gap-2 mt-2">
                                            <img
                                                src={`${API_BASE_URL}/uploads/microscopicos/${formData.qr_image_url}`}
                                                alt="QR Preview"
                                                className="w-24 h-24 object-cover rounded-md border border-gray-200 shadow-sm"
                                            />
                                            <div className="flex items-center justify-center gap-1 text-[11px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-full">
                                                <CheckCircleIcon className="w-3 h-3 shrink-0" />
                                                <span className="truncate flex-1 font-mono text-center">
                                                    {formData.qr_image_url.split('/').pop()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border rounded-lg p-3 bg-white">
                                <span className="text-sm font-medium text-gray-700 mb-2 block">Marcador AR(JPG/PNG)</span>
                                <input type="file" ref={qrInput2Ref} onChange={(e) => handleFileUpload(e, 'qr2')} accept="image/png, image/jpeg" className="hidden" />
                                <div className="flex flex-col gap-2">
                                    <button type="button" onClick={() => qrInput2Ref.current?.click()} disabled={uploadingQr2} className="flex items-center justify-center gap-2 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm disabled:opacity-50 transition-colors">
                                        <ArrowUpTrayIcon className="w-4 h-4" />
                                        {uploadingQr2 ? 'Subiendo...' : 'Subir Foto'}
                                    </button>
                                    {formData.qr_image_url2 && (
                                        <div className="flex flex-col items-center justify-center gap-2 mt-2">
                                            <img
                                                src={`${API_BASE_URL}/uploads/microscopicos/${formData.qr_image_url2}`}
                                                alt="QR Preview"
                                                className="w-24 h-24 object-cover rounded-md border border-gray-200 shadow-sm"
                                            />
                                            <div className="flex items-center justify-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-2 py-1 rounded w-full">
                                                <CheckCircleIcon className="w-3 h-3 shrink-0" />
                                                <span className="truncate flex-1 font-mono text-center">
                                                    {formData.qr_image_url2.split('/').pop()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <label className="block col-span-1 md:col-span-2">
                            <span className="text-sm font-medium text-gray-700 block mb-1">Fuente de Información</span>
                            <textarea
                                value={formData.fuente || ''}
                                onChange={e => setFormData(p => ({ ...p, fuente: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm resize-y min-h-[60px]"
                                placeholder="Ej: Wikipedia, Universidad de X, etc."
                            />
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">Cancelar</button>
                        <button type="submit" disabled={uploadingAsset || uploadingQr || uploadingQr2} className="px-5 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium" style={{ backgroundColor: THEME.primary }}>
                            {editItem ? 'Guardar Cambios' : 'Registrar Especie'}
                        </button>
                    </div>
                </form>
            </AnimatedModal>
        </div>
    )
}
