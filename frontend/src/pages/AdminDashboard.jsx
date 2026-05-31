import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import {
    CubeIcon, BookOpenIcon, AcademicCapIcon, TicketIcon,
    CurrencyDollarIcon, ChartBarIcon, ClockIcon, UserGroupIcon,
    TrophyIcon, ArrowTrendingUpIcon, CalendarDaysIcon, ChartPieIcon
} from '@heroicons/react/24/outline'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { cascade } from '../utils/animations';

const THEME = { primary: '#059669', secondary: '#3b82f6', accent: '#f59e0b', danger: '#ef4444' }
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ec4899']; // Verde, Azul, Amarillo, Rosa
const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState(null)
    const [history, setHistory] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [statsRes, historyRes, analyticsRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/stats/history'),
                    api.get('/admin/stats/analytics')
                ]);
                setStats(statsRes.data)
                setHistory(historyRes.data)
                setAnalytics(analyticsRes.data)
            } catch (e) {
                console.error('Error dashboard:', e)
            } finally {
                setLoading(false)
            }
        }
        loadDashboard()
    }, [])

    // --- PREPARACIÓN DE DATOS PARA GRÁFICOS ---
    const pieData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Museo', value: parseFloat(stats.reservations?.revenue || 0) },
            { name: 'Modelos 3D', value: parseFloat(stats.models3d?.revenue || 0) },
            { name: 'Libros', value: parseFloat(stats.books?.revenue || 0) },
            /* { name: 'Cursos', value: parseFloat(stats.courses?.revenue || 0) }, */
        ].filter(item => item.value > 0);
    }, [stats]);

    const volumeData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Entradas', cantidad: stats.reservations?.total || 0 },
            { name: '3D', cantidad: stats.models3d?.sold || 0 },
            { name: 'Libros', cantidad: stats.books?.sold || 0 },
            /* { name: 'Cursos', cantidad: stats.courses?.sold || 0 }, */
        ];
    }, [stats]);

    // Días rentables (traducción)
    const dayMap = { 'Monday': 'Lun', 'Tuesday': 'Mar', 'Wednesday': 'Mié', 'Thursday': 'Jue', 'Friday': 'Vie', 'Saturday': 'Sáb', 'Sunday': 'Dom' };
    const daysData = useMemo(() => {
        if (!analytics) return [];
        return analytics.bestDays.map(d => ({
            day: dayMap[d.day] || d.day,
            Ingresos: parseFloat(d.revenue)
        }));
    }, [analytics]);


    if (loading) return <div className="p-10 text-center text-gray-500">Cargando métricas...</div>
    if (!stats || !analytics) return null;

    const ticketPromedio = stats.total.revenue / (stats.total.transactions || 1);
    const crossSellRate = analytics.crossSell
        ? ((analytics.crossSell.multi_category_buyers / analytics.crossSell.total_customers) * 100).toFixed(1)
        : 0;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 bg-gray-50/50 min-h-screen">

            {/* 1. Header & Fecha */}
            <div className="flex justify-between items-end">
                <div {...cascade(0)}>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Resumen estratégico del negocio</p>
                </div>
                <div {...cascade(1, "hidden md:block text-right")}>
                    <p className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            {/* 2. KPIs ESTRATÉGICOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div {...cascade(2, "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group")}>
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CurrencyDollarIcon className="w-24 h-24 text-emerald-600" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Ingresos Totales</p>
                    <h2 className="text-4xl font-bold text-gray-900 mt-1">{PEN.format(stats.total.revenue)}</h2>
                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                        <span className="bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <ArrowTrendingUpIcon className="w-3 h-3" /> +{stats.total.transactions} ventas
                        </span>
                    </div>
                </div>

                <div {...cascade(3, "bg-white p-6 rounded-2xl shadow-sm border border-gray-100")}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Ticket Promedio</p>
                            <h2 className="text-3xl font-bold text-gray-900 mt-1">{PEN.format(ticketPromedio)}</h2>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Gasto promedio por cliente.</p>
                </div>

                <div {...cascade(4, "bg-white p-6 rounded-2xl shadow-sm border border-gray-100")}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Tasa de Compra Cruzada</p>
                            <h2 className="text-3xl font-bold text-gray-900 mt-1">{crossSellRate}%</h2>
                        </div>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <UserGroupIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Clientes comprando en múltiples categorías.</p>
                </div>
            </div>

            {/* 3. SECCIÓN GRÁFICA PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* A. Historial de Ventas (Area Chart) */}
                <div {...cascade(5, "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2")}>
                    <h3 className="font-bold text-gray-800 mb-6">Tendencia de Ingresos (7 Días)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={THEME.primary} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={THEME.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `S/${val}`} />
                                <Tooltip formatter={(value) => [PEN.format(value), "Ventas"]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="amount" stroke={THEME.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* B. Distribución de Ingresos (DONUT CHART - NUEVO) */}
                <div {...cascade(6, "bg-white p-6 rounded-2xl shadow-sm border border-gray-100")}>
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <ChartPieIcon className="w-5 h-5 text-gray-400" /> Fuentes de Ingreso
                    </h3>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => PEN.format(value)} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                            <span className="text-xs text-gray-400 font-medium">TOTAL</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. SECCIÓN SECUNDARIA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* C. Días Más Rentables (Bar Chart Vertical) */}
                <div {...cascade(7, "bg-white p-6 rounded-2xl shadow-sm border border-gray-100")}>
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5 text-gray-400" /> Días Rentables
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={daysData} layout="vertical" margin={{ left: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="day" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 500 }} width={30} />
                                <Tooltip cursor={{ fill: 'transparent' }} formatter={(val) => [PEN.format(val), "Ingresos"]} />
                                <Bar dataKey="Ingresos" fill={THEME.secondary} radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* D. Volumen de Ventas (Bar Chart Simple - NUEVO) */}
                <div {...cascade(8, "bg-white p-6 rounded-2xl shadow-sm border border-gray-100")}>
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <CubeIcon className="w-5 h-5 text-gray-400" /> Unidades Vendidas
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={volumeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                <Bar dataKey="cantidad" name="Ventas" fill={THEME.accent} radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* E. Top Productos (Lista) */}
                <div {...cascade(9, "bg-white p-6 rounded-2xl shadow-sm border border-gray-100")}>
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrophyIcon className="w-5 h-5 text-amber-500" /> Podio de Ventas
                    </h3>
                    <div className="space-y-4">
                        {[
                            { icon: BookOpenIcon, data: analytics.topProducts.book, color: 'text-amber-600 bg-amber-50', label: 'Libro' },
                            /* { icon: AcademicCapIcon, data: analytics.topProducts.course, color: 'text-pink-600 bg-pink-50', label: 'Curso' }, */
                            { icon: CubeIcon, data: analytics.topProducts.model, color: 'text-blue-600 bg-blue-50', label: '3D' },
                        ].map((item, idx) => (
                            <div key={idx} {...cascade(10 + idx, "flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors")}>
                                <div className={`p-2 rounded-lg ${item.color}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-400 font-medium uppercase">{item.label} #1</p>
                                    <p className="font-semibold text-gray-900 truncate">{item.data?.name || 'Sin ventas'}</p>
                                </div>
                                <div className="text-sm font-bold text-gray-600">
                                    {item.data?.sales || 0}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 5. DATOS ADICIONALES (Fila Inferior) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hora Pico */}
                <div {...cascade(13, "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between")}>
                    <div>
                        <p className="text-gray-500 font-medium mb-1">Hora Pico del Museo</p>
                        <h3 className="text-3xl font-black text-gray-900">
                            {analytics.peakHour ? analytics.peakHour.time : '--:--'}
                        </h3>
                        <p className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded mt-2 w-fit">
                            Mayor afluencia histórica
                        </p>
                    </div>
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full">
                        <ClockIcon className="w-8 h-8" />
                    </div>
                </div>

                {/* Clientes VIP */}
                <div {...cascade(14, "bg-white p-6 rounded-2xl shadow-sm border border-gray-100")}>
                    <h3 className="font-bold text-gray-800 mb-4">👑 Clientes VIP</h3>
                    <div className="space-y-3">
                        {analytics.vipClients.map((client, idx) => (
                            <div key={idx} {...cascade(15 + idx, "flex items-center justify-between border-b border-gray-50 last:border-0 pb-2 last:pb-0")}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                        {client.use_txt_nombres[0]}{client.use_txt_apellidos[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{client.use_txt_nombres}</p>
                                        <p className="text-xs text-gray-400">{client.use_txt_email}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-emerald-600">
                                    {PEN.format(client.total_spent)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}