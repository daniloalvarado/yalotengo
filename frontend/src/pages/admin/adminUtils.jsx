// src/pages/admin/adminUtils.jsx
// Utilidades compartidas para el panel de admin

export const THEME = { primary: '#059669', primaryLight: '#ecfdf5' }

export const PEN = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
})

export const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

export const formatDateTime = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Componente Tag de estado
export function StatusTag({ status }) {
    const colors = {
        PAID: 'bg-emerald-100 text-emerald-700',
        PENDING: 'bg-amber-100 text-amber-700',
        FAILED: 'bg-red-100 text-red-600',
        USED: 'bg-blue-100 text-blue-700'
    }
    const labels = {
        PAID: 'Pagado',
        PENDING: 'Pendiente',
        FAILED: 'Fallido',
        USED: 'Usado'
    }
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
            {labels[status] || status}
        </span>
    )
}

// Componente de tabla de compras reutilizable
export function PurchasesTable({ purchases, columns, loading, emptyMessage = 'No hay compras' }) {
    if (loading) {
        return <div className="text-gray-500 py-4">Cargando...</div>
    }

    if (!purchases.length) {
        return <div className="text-gray-500 py-4 text-center">{emptyMessage}</div>
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map(col => (
                            <th key={col.key} className="px-4 py-3 text-left font-medium text-gray-600">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {purchases.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                            {columns.map(col => (
                                <td key={col.key} className="px-4 py-3 text-gray-700">
                                    {col.render ? col.render(p) : p[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// Buscador simple
export function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
    )
}
