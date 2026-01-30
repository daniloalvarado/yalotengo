// src/pages/Order.jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'

const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })
const fmt = (n) => PEN.format(Number(n || 0))

function Tag({ children, tone = 'zinc' }) {
  const tones = {
    zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
    sky: 'bg-sky-100 text-sky-700 border-sky-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border ${tones[tone] || tones.zinc}`}>
      {children}
    </span>
  )
}

export default function Order() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(null) // ori_int_id

  const orderReady = order?.ord_txt_status === 'READY'

  const loadOrder = useCallback(async () => {
    try {
      setError('')
      const { data } = await api.get('/orders/' + id)
      setOrder(data?.order || null)
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudo cargar el pedido')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadOrder() }, [loadOrder])

  // Hay pendientes mientras la orden no esté READY o existan libros sin habilitar/clave preparada
  const hasPending = useMemo(() => {
    return !orderReady || items.some(it => {
      if (!it.ori_bol_virtual) return false
      return !it.ori_bol_admin_download || !it.ori_txt_prepared_key
    })
  }, [items, orderReady])

  // Polling cada 5s mientras haya algo pendiente
  useEffect(() => {
    if (!hasPending) return
    const t = setInterval(loadOrder, 5000)
    return () => clearInterval(t)
  }, [hasPending, loadOrder])

  const total = useMemo(
    () => items.reduce((s, it) => s + Number(it.ori_dec_price || 0) * Number(it.ori_int_qty || 0), 0),
    [items]
  )

  function renderItemStatus(it) {
    if (!it.ori_bol_virtual) return <Tag tone="sky">Preparando</Tag>
    if (!orderReady) return <Tag tone="amber">Procesando…</Tag>
    if (!it.ori_bol_admin_download) return <Tag tone="zinc">Listo (pendiente habilitación)</Tag>
    // (opcional) si quieres mostrar “Listo para descargar” solo si hay key:
    if (!it.ori_txt_prepared_key) return <Tag tone="zinc">Listo (generando enlace)</Tag>
    return <Tag tone="emerald">Listo para descargar</Tag>
  }

  function canDownload(it) {
    // Regla pedida: orden READY + admin habilitó; añadimos prepared_key para evitar 404
    return Boolean(orderReady && it.ori_bol_admin_download && it.ori_txt_prepared_key)
  }

  // Descarga como blob usando Authorization (sin abrir ventanas ni meter token en URL)
  async function downloadViaFiles(key, fallbackOriId) {
    const tryBlob = async (path) => {
      try {
        const res = await api.get(path, { params: { key }, responseType: 'blob' })
        const blobUrl = URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = key.split('/').pop() || 'archivo.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(blobUrl)
        return true
      } catch { return false }
    }
    if (await tryBlob('/files/stream')) return
    if (await tryBlob('/files/download')) return

    // Fallback (si tu backend solo expone /files/download-stream/:oriId?token=...)
    const API_BASE = (import.meta.env.VITE_API_BASE || api.defaults.baseURL || 'http://localhost:8000/api').replace(/\/$/, '')
    const token = localStorage.getItem('token')
    if (fallbackOriId && token) {
      const url = `${API_BASE}/files/download-stream/${fallbackOriId}?token=${encodeURIComponent(token)}`
      window.location.href = url
      return
    }

    // Último recurso: copiar key
    navigator.clipboard?.writeText(String(key))
    alert('No se pudo descargar automáticamente. Copié la ruta del archivo:\n' + key)
  }

  async function handleDownload(it) {
    if (!canDownload(it)) {
      alert(!orderReady ? 'El archivo aún se está procesando…' : 'Listo, pendiente habilitación del administrador')
      return
    }
    setDownloading(it.ori_int_id)
    try {
      // Si existe un endpoint dedicado, úsalo:
      // GET /orders/:id/items/:oriId/download -> { url? , file_key? }
      try {
        const { data } = await api.get(`/orders/${id}/items/${it.ori_int_id}/download`)
        const url = data?.url
        const key = data?.file_key || data?.key || it.ori_txt_prepared_key
        if (url) { window.location.href = url; return }
        if (key) { await downloadViaFiles(key, it.ori_int_id); return }
      } catch {
        // Si no existe, usa directamente la clave preparada
        const key = it.ori_txt_prepared_key
        await downloadViaFiles(key, it.ori_int_id)
        return
      }
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
        <h1 className="text-2xl font-semibold">Pedido #{id}</h1>
        <button
          onClick={loadOrder}
          className="text-sm rounded-lg border border-zinc-300 bg-white px-3 py-1.5 hover:bg-zinc-50"
        >
          Actualizar
        </button>
      </div>

      {/* Estado general */}
      <div className="mt-3 text-sm text-zinc-600">
        Estado: <b>{order?.ord_txt_status || '—'}</b>
        {order?.ord_dt_ready_at && (
          <span className="ml-2">
            | ETA: {new Date(order.ord_dt_ready_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
          </span>
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
            const name = it.ori_txt_name_snapshot || `Item ${it.ori_int_id}`
            const qty = Number(it.ori_int_qty || 0)
            const price = Number(it.ori_dec_price || 0)
            const subtotal = qty * price
            const readyToDownload = canDownload(it)

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
                  <div className="mt-0.5 text-sm">
                    {fmt(price)} <span className="text-zinc-500">/ unidad</span>
                  </div>

                  {it.ori_bol_virtual && (
                    <div className="mt-2 text-xs text-zinc-500">
                      Contraseña del PDF: <b>tu DNI</b>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="font-semibold">{fmt(subtotal)}</div>

                  {it.ori_bol_virtual && (
                    <button
                      disabled={!readyToDownload || downloading === it.ori_int_id}
                      onClick={() => handleDownload(it)}
                      className={`mt-2 inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        readyToDownload
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'bg-zinc-200 text-zinc-600 cursor-not-allowed'
                      }`}
                      title={
                        readyToDownload
                          ? 'Descargar'
                          : (!orderReady
                              ? 'El archivo aún se está procesando…'
                              : (!it.ori_bol_admin_download
                                  ? 'Listo, pendiente habilitación del administrador'
                                  : 'Generando enlace de descarga'))
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
