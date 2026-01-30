// src/pages/purchases/Models3dTab.jsx
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Tag, fmt } from './purchasesUtils'
import api from '../../api/client'

export default function Models3dTab({ models3d, loading }) {
    return (
        <>
            {!loading && models3d.length === 0 && (
                <div className="text-sm opacity-60">Aún no tienes compras de modelos 3D.</div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {models3d.map((purchase) => {
                    const model = purchase.model || {}
                    const name = model.mod_txt_name || 'Modelo 3D'
                    const price = Number(purchase.pur_dec_amount || model.mod_dec_price || 0)
                    const purchaseDate = purchase.pur_dt_created
                        ? new Date(purchase.pur_dt_created).toLocaleDateString('es-PE')
                        : ''

                    const handleDownload = () => {
                        const base = (api.defaults.baseURL || '').replace(/\/$/, '')
                        const token = localStorage.getItem('token')
                        const url = `${base}/models3d/download/${purchase.pur_int_id}?token=${encodeURIComponent(token)}`
                        window.open(url, '_blank')
                    }

                    return (
                        <Card key={purchase.pur_int_id}>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm opacity-70">Compra #{purchase.pur_int_id}</div>
                                    <Tag tone="emerald">Pagado</Tag>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="font-medium truncate">{name}</div>
                                    <Tag tone="sky">GLB</Tag>
                                </div>
                                {model.mod_txt_desc && (
                                    <div className="text-sm text-gray-600">{model.mod_txt_desc}</div>
                                )}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="opacity-60">Precio:</span> {fmt(price)}</div>
                                    <div><span className="opacity-60">Fecha:</span> {purchaseDate}</div>
                                </div>
                                <Button
                                    className="mt-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                                    onClick={handleDownload}
                                >
                                    📥 Descargar modelo
                                </Button>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </>
    )
}
