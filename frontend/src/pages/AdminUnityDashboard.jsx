import { useState, useEffect } from 'react'
import api from '../api/client'
import { UsersIcon, CubeIcon, ChartBarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

const THEME = { primary: '#059669' }

export default function AdminUnityDashboard() {
    const [metrics, setMetrics] = useState({
        totalLeads: 0,
        recentLeads: [],
        totalModels: 0,
        activeModels: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const { data } = await api.get('/microscopicos/admin/dashboard')
                setMetrics(data)
            } catch (error) {
                console.error("Error fetching dashboard metrics:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchDashboard()
    }, [])

    if (loading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando métricas...</div>
    }

    return (
        <div className="space-y-6">
            {/* Tarjetas de Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Usuarios Captados (Leads AR)</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{metrics.totalLeads}</h3>
                        <p className="text-xs text-emerald-600 mt-1 font-medium bg-emerald-50 inline-block px-2 py-0.5 rounded-full">
                            Tasa de Instalación
                        </p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-full">
                        <UsersIcon className="w-8 h-8 text-emerald-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Modelos 3D Activos</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{metrics.activeModels} <span className="text-lg text-gray-400 font-normal">/ {metrics.totalModels}</span></h3>
                        <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-50 inline-block px-2 py-0.5 rounded-full">
                            Disponibles en el Servidor
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-full">
                        <CubeIcon className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de últimos registros */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">Últimos Leads Registrados</h3>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 border rounded shadow-sm">Top 5 recientes</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {metrics.recentLeads && metrics.recentLeads.length > 0 ? (
                            metrics.recentLeads.map((user, idx) => (
                                <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                                            {user.use_txt_nombres ? user.use_txt_nombres.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{user.use_txt_nombres}</p>
                                            <p className="text-xs text-gray-500">{user.use_txt_email}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-sm text-gray-500">Aún no hay usuarios de la app AR.</div>
                        )}
                    </div>
                </div>

                {/* Banner de Unity Analytics */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-md p-6 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -right-10 -top-10 opacity-10">
                        <ChartBarIcon className="w-48 h-48 text-white" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/20 text-white text-xs font-semibold mb-4 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            ANÁLISIS EN TIEMPO REAL
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Comportamiento In-App (Unity)</h3>
                        <p className="text-gray-300 text-sm mb-6 max-w-sm">
                            Descubre qué modelos microscópicos escanean más tus usuarios (Mapas de Calor), retención diaria y reportes de errores técnicos en vivo.
                        </p>
                    </div>

                    <div className="relative z-10">
                         <a 
                            href="https://dashboard.unity3d.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/30 w-full sm:w-auto"
                        >
                            <span>Abrir Unity Analytics</span>
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
