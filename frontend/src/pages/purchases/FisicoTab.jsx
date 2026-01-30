// src/pages/purchases/FisicoTab.jsx
import Card from '../../components/ui/Card'
import { Tag, fmt } from './purchasesUtils'

export default function FisicoTab({ physical, loading }) {
    return (
        <>
            {!loading && physical.length === 0 && (
                <div className="text-sm opacity-60">Aún no tienes compras físicas.</div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {physical.map((it) => {
                    const name = it.ori_txt_name_snapshot || it.pro_txt_name || `Producto ${it.pro_int_id ?? ''}`.trim()
                    const qty = Number(it.ori_int_qty || 0)
                    const price = Number(it.ori_dec_price || 0)
                    const subtotal = qty * price

                    return (
                        <Card key={it.ori_int_id}>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm opacity-70">Item #{it.ori_int_id}</div>
                                    <div className="text-xs px-2 py-1 rounded bg-slate-100">Orden #{it.ord_int_id}</div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="font-medium truncate">{name}</div>
                                    <Tag tone="sky">Físico</Tag>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="opacity-60">Cantidad:</span> {qty}</div>
                                    <div><span className="opacity-60">Precio:</span> {fmt(price)}</div>
                                    <div className="col-span-2"><span className="opacity-60">Subtotal:</span> {fmt(subtotal)}</div>
                                </div>
                                <div className="text-xs text-zinc-600 mt-1">
                                    Nos pondremos en contacto por WhatsApp para coordinar el envío.
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </>
    )
}
