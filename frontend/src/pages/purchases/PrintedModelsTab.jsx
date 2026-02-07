import Card from '../../components/ui/Card'
import { Tag, fmt } from './purchasesUtils'

// Steps configs
const STEPS = [
    { id: 'ACCEPTED', label: 'Aceptado', desc: '' },
    { id: 'IN_PROGRESS', label: 'En curso', desc: '1 día' },
    { id: 'DELIVERED', label: 'Entregado', desc: '' }
]

function StatusTimeline({ status, estimate }) {
    // Logic: ACCEPTED -> IN_PROGRESS -> DELIVERED
    const statusMap = { 'ACCEPTED': 0, 'IN_PROGRESS': 1, 'DELIVERED': 2 }
    const currentIndex = statusMap[status] || 0

    return (
        <div className="flex items-start justify-between w-full mt-6 relative px-2">
            {/* Connecting Line */}
            <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-200 -z-10"></div>
            <div
                className="absolute top-3 left-0 h-0.5 bg-emerald-500 -z-10 transition-all duration-500"
                style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
            ></div>

            {STEPS.map((step, idx) => {
                const completed = idx <= currentIndex
                const current = idx === currentIndex

                // Dynamic description for In Progress
                let displayDesc = step.desc
                if (step.id === 'IN_PROGRESS' && estimate) {
                    displayDesc = estimate
                }

                return (
                    <div key={step.id} className="flex flex-col items-center relative group w-1/3">
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white transition-colors
                                ${completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300'}
                            `}
                        >
                            {completed && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className={`text-xs mt-2 font-medium ${current ? 'text-emerald-700' : 'text-gray-500'}`}>
                            {step.label}
                        </span>

                        {/* Description with more spacing */}
                        {current && (
                            <span className="text-[10px] text-gray-500 font-medium absolute top-12 w-32 text-center bg-white/80 px-1 rounded">
                                {displayDesc}
                            </span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export default function PrintedModelsTab({ printedModels = [], loading }) {
    if (loading) {
        return <div className="text-sm opacity-60">Cargando...</div>
    }

    if (!printedModels || printedModels.length === 0) {
        return <div className="text-sm opacity-60">Aún no tienes pedidos de impresiones 3D.</div>
    }

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {printedModels.map((purchase) => {
                const model = purchase.model || {}
                const name = model.mod_txt_name || 'Modelo Impreso'
                const price = Number(purchase.pur_dec_amount || model.mod_dec_price || 0)
                const purchaseDate = purchase.pur_dt_created
                    ? new Date(purchase.pur_dt_created).toLocaleDateString('es-PE')
                    : ''
                const status = purchase.pur_txt_delivery_status || 'ACCEPTED'
                const estimate = purchase.pur_txt_delivery_estimate || '1 día'

                return (
                    <Card key={purchase.pur_int_id}>
                        <div className="flex flex-col gap-2 pb-6"> {/* Increased padding bottom for timeline text */}
                            <div className="flex items-center justify-between">
                                <div className="text-sm opacity-70">Pedido #{purchase.pur_int_id}</div>
                                <Tag tone="emerald">Pagado</Tag>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden shrink-0">
                                    <img
                                        src={`http://localhost:3000/uploads/impresos/${model.mod_txt_glb_filename}`} // Hardcoded base for now, ideal to pass base url
                                        alt={name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.target.src = 'https://placehold.co/100?text=IMG'}
                                    />
                                </div>
                                <div>
                                    <div className="font-medium truncate">{name}</div>
                                    <div className="text-xs text-gray-500">{fmt(price)} • {purchaseDate}</div>
                                </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-gray-50">
                                <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Estado del Pedido</span>
                                <StatusTimeline status={status} estimate={estimate} />
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}
