// src/pages/purchases/Models3dTab.jsx
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Tag, fmt } from './purchasesUtils'
import api from '../../api/client'

export default function Models3dTab({ models3d = [], loading }) {
    if (loading) {
        return <div className="text-sm opacity-60">Cargando...</div>
    }

    if (!models3d || models3d.length === 0) {
        return <div className="text-sm opacity-60">Aún no tienes compras de modelos 3D.</div>
    }

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models3d.map((purchase) => {
                const model = purchase.model || {}
                const name = model.mod_txt_name || 'Modelo 3D'
                const price = Number(purchase.pur_dec_amount || model.mod_dec_price || 0)
                const purchaseDate = purchase.pur_dt_created
                    ? new Date(purchase.pur_dt_created).toLocaleDateString('es-PE')
                    : ''

                const isPrinted = model.mod_txt_category === 'IMPRESO' || model.mod_txt_glb_filename?.match(/\.(jpg|jpeg|png|webp)$/i)

                const handleDownload = () => {
                    if (isPrinted) return
                    const base = (api.defaults.baseURL || '').replace(/\/$/, '')
                    const token = localStorage.getItem('token')
                    const url = `${base}/models3d/download/${purchase.pur_int_id}?token=${encodeURIComponent(token)}`
                    window.location.href = url
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
                                {isPrinted ? (
                                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-medium">Físico</span>
                                ) : (
                                    <Tag tone="sky">GLB</Tag>
                                )}
                            </div>
                            {model.mod_txt_desc && (
                                <div className="text-sm text-gray-600 line-clamp-2">{model.mod_txt_desc}</div>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                <div><span className="opacity-60">Precio:</span> {fmt(price)}</div>
                                <div><span className="opacity-60">Fecha:</span> {purchaseDate}</div>
                            </div>

                            {isPrinted ? (
                                <div className="mt-3 bg-gray-50 p-2 rounded text-xs text-gray-500 text-center border border-gray-100">
                                    📦 Contactaremos contigo para la entrega.
                                </div>
                            ) : (
                                <Button
                                    className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white w-full flex justify-center items-center gap-2"
                                    onClick={handleDownload}
                                >
                                    📥 Descargar modelo
                                </Button>
                            )}
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}
