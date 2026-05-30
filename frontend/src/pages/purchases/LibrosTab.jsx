// src/pages/purchases/LibrosTab.jsx
import Card from '../../components/ui/Card'
import DownloadButton from '../../components/DownloadButton'
import { Tag, fmt } from './purchasesUtils'
import api from '../../api/client'

export default function LibrosTab({ books, loading }) {
    return (
        <>
            {!loading && books.length === 0 && (
                <div className="text-sm opacity-60">Aún no tienes compras de libros.</div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.map((purchase) => {
                    const book = purchase.book || {}
                    const title = book.boo_txt_title || 'Libro'
                    const author = book.boo_txt_author || ''
                    const price = Number(purchase.bpu_dec_amount || book.boo_dec_price || 0)
                    const purchaseDate = purchase.bpu_dt_created
                        ? new Date(purchase.bpu_dt_created).toLocaleDateString('es-PE')
                        : ''

                    const handleDownload = () => {
                        const base = (api.defaults.baseURL || '').replace(/\/$/, '')
                        const token = localStorage.getItem('token')
                        const url = `${base}/books/download/${purchase.bpu_int_id}?token=${encodeURIComponent(token)}`
                        window.location.href = url
                    }

                    return (
                        <Card key={purchase.bpu_int_id}>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm opacity-70">Compra #{purchase.bpu_int_id}</div>
                                    <Tag tone="emerald">Pagado</Tag>
                                </div>
                                <div className="font-medium truncate">{title}</div>
                                {author && (
                                    <div className="text-sm text-gray-500">{author}</div>
                                )}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="opacity-60">Precio:</span> {fmt(price)}</div>
                                    <div><span className="opacity-60">Fecha:</span> {purchaseDate}</div>
                                </div>
                                <DownloadButton
                                    className="mt-3 w-full"
                                    onClick={handleDownload}
                                    text="Descargar PDF"
                                />
                            </div>
                        </Card>
                    )
                })}
            </div>
        </>
    )
}
