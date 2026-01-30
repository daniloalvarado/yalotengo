// src/pages/OrderDetail.jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'

const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })
const fmt = (n) => PEN.format(Number(n || 0))

function Tag({ children, tone='zinc' }) {
  const tones = {
    zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
    sky: 'bg-sky-100 text-sky-700 border-sky-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border ${tones[tone]||tones.zinc}`}>
      {children}
    </span>
  )
}

export default function OrderDetail() {
  const { ordId } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(null) // ori_int_id mientras descarga

  // Cargar pedido
  const fetchOrder = useCallback(async () => {
    try {
      setError('')
      const { data } = await api.get(`/orders/${ordId}`)
      setOrder(data.order || null)
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudo cargar el pedido')
    } finally {
      setLoading(false)
    }
  }, [ordId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // ¿Hay algo pendiente? (para polling)
  const hasPending = useMemo(() => {
    return items.some(it => {
      if (!it.ori_bol_virtual) return false // físico no bloquea
      if (it.ori_txt_status === 'FAILED') return false
      // pendiente si: processing, o listo pero falta habilitación admin
      return (it.ori_txt_status !== 'READY') || (it.ori_txt_status === 'READY' && !it.ori_bol_admin_download)
    })
  }, [items])

  // Polling cada 5s mientras haya pendientes
  useEffect(() => {
    if (!hasPending) return
    const t = setInterval(fetchOrder, 5000)
    return () => clearInterval(t)
  }, [hasPending, fetchOrder])

  // Etiquetas de estado por item
  function renderItemStatus(it) {
    if (!it.ori_bol_virtual) {
      return <Tag tone="sky">Preparando</Tag>
    }
    const st = it.ori_txt_status || 'PROCESSING'
    if (st === 'FAILED') return <Tag tone="rose">Error en preparación</Tag>
    if (st !== 'READY') return <Tag tone="amber">Procesando…</Tag>
    // READY:
    if (!it.ori_bol_admin_download) return <Tag tone="zinc">Listo (pendiente habilitación)</Tag>
    return <Tag tone="emerald">Listo para descargar</Tag>
  }

  // Total pedido (por si no viene en order)
  const total = useMemo(
    () => items.reduce((s, it) => s + Number(it?.ori_dec_price||0) * Number(it?.ori_int_qty||0), 0),
    [items]
  )

  // Resolver descarga según tu módulo /files (intenta varias rutas)
  async function downloadViaFilesModule(fileKey) {
    const base = (api.defaults.baseURL || '').replace(/\/$/, '')

    // 1) firmar URL (si existe)
    try {
      const sign = await api.get('/files/sign', { params: { key: fileKey } })
      const url = sign?.data?.url
      if (url) { window.open(url, '_blank'); return true }
    } catch {}

    // 2) stream como blob (ruta común)
    const tryBlob = async (path) => {
      try {
        const res = await api.get(path, { params: { key: fileKey }, responseType: 'blob' })
        const blobUrl = URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = fileKey.split('/').pop() || 'archivo.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(blobUrl)
        return true
      } catch { return false }
    }
    if (await tryBlob('/files/stream')) return true
    if (await tryBlob('/files/download')) return true

    // 3) público (si tienes una ruta estática)
    const publicUrl = `${base}/files/public/${encodeURIComponent(fileKey)}`
    try {
      // Intento abrir directo (puede fallar si no existe)
      window.open(publicUrl, '_blank')
      return true
    } catch {}

    // 4) fallback: mostrar el key para copiar
    navigator.clipboard?.writeText(String(fileKey))
    alert('No pude descargar automáticamente. Copié la ruta del archivo al portapapeles:\n' + fileKey)
    return false
  }

  // Descargar un item (pide permiso a /orders/:ordId/items/:oriId/download)
  async function handleDownload(it) {
    setDownloading(it.ori_int_id)
    try {
      const { data } = await api.get(`/orders/${ordId}/items/${it.ori_int_id}/download`)
      const key = data?.file_key || data?.key
      if (!key) throw new Error('Archivo no disponible')
      await downloadViaFilesModule(key)
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'No se pudo descargar'
      alert(msg)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Pedido #{ordId}</h1>
        <button
          onClick={fetchOrder}
          className="text-sm rounded-lg border border-zinc-300 bg-white px-3 py-1.5 hover:bg-zinc-50"
        >
          Actualizar
        </button>
      </div>

      {/* Estado general del pedido */}
      <div className="mt-3 text-sm text-zinc-600">
        Estado: <b>{order?.ord_txt_status || '—'}</b>
        {order?.ord_dt_ready_at && (
          <span className="ml-2">| ETA: {new Date(order.ord_dt_ready_at).toLocaleString('es-PE')}</span>
        )}
      </div>

      {loading && <div className="mt-6 text-sm text-zinc-600">Cargando…</div>}
      {error && !loading && (
        <div className="mt-6 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 grid gap-4">
          {items.map((it) => {
            const name = it.ori_txt_name_snapshot || it.pro_txt_name || `Item ${it.ori_int_id}`
            const qty = Number(it.ori_int_qty || 0)
            const price = Number(it.ori_dec_price || 0)
            const subtotal = qty * price
            const canDownload = !!(
              it.ori_bol_virtual &&
              it.ori_txt_status === 'READY' &&
              it.ori_bol_admin_download &&
              it.ori_txt_prepared_key
            )

            return (
              <div key={it.ori_int_id} className="rounded-xl border border-zinc-200 bg-white p-4 flex items-start gap-4">
                <div className="h-14 w-14 rounded bg-zinc-100 grid place-items-center text-xs text-zinc-500">ITEM</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium truncate">{name}</div>
                    {it.ori_bol_virtual ? <Tag tone="zinc">Libro digital</Tag> : <Tag tone="sky">Artículo físico</Tag>}
                    {renderItemStatus(it)}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">Cantidad: {qty}</div>
                  <div className="mt-0.5 text-sm">{fmt(price)} <span className="text-zinc-500">/ unidad</span></div>
                </div>

                <div className="text-right">
                  <div className="font-semibold">{fmt(subtotal)}</div>

                  {it.ori_bol_virtual && (
                    <button
                      disabled={!canDownload || downloading === it.ori_int_id}
                      onClick={() => handleDownload(it)}
                      className={`mt-2 inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        canDownload
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'bg-zinc-200 text-zinc-600 cursor-not-allowed'
                      }`}
                      title={
                        canDownload
                          ? 'Descargar'
                          : 'Disponible cuando el admin habilite y el archivo esté listo'
                      }
                    >
                      {downloading === it.ori_int_id ? 'Preparando…' : 'Descargar'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Total */}
          <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Total</span>
              <span className="text-base font-semibold">{fmt(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
