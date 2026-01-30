import { useEffect, useState } from 'react'
import api from '../api/client'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function AdminDownloads() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadAll() {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get('/orders/items/all')
      const list = Array.isArray(data) ? data : []
      setItems(list)
    } catch (e) {
      console.error(e)
      setError('No se pudo cargar la lista')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  async function toggleDownload(oriId, current) {
    try {
      await api.patch(`/orders/items/${oriId}/admin-download`, { enabled: !current })
      setItems(prev => prev.map(it =>
        it.ori_int_id === oriId ? { ...it, ori_bol_admin_download: current ? 0 : 1 } : it
      ))
    } catch (e) {
      alert(e?.response?.data?.error || 'No se pudo actualizar')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Gestión de descargas (Admin)</h1>
        <Button onClick={loadAll}>Refrescar</Button>
      </div>

      {loading && <div className="opacity-70">Cargando…</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => {
          // ⚠️ Ahora viene PLANO desde el backend
          const cliente = [it.apellidos, it.nombres].filter(Boolean).join(' ') || 'Cliente'
          const dni = it.dni || '—'
          const estado = it.ori_txt_status || it.ord_txt_status || '—'
          const virtual = !!it.ori_bol_virtual
          const enabled = !!it.ori_bol_admin_download

          return (
            <Card key={it.ori_int_id}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm opacity-70">Item #{it.ori_int_id}</div>
                  <div className="text-xs px-2 py-1 rounded bg-slate-100">
                    Orden #{it.ord_int_id}
                  </div>
                </div>

                <div className="text-base font-semibold">{cliente}</div>
                <div className="text-sm text-slate-600">DNI: {dni}</div>

                <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                  <div><span className="opacity-60">Producto:</span> {it.pro_int_id}</div>
                  <div><span className="opacity-60">Cant:</span> {it.ori_int_qty}</div>
                  <div><span className="opacity-60">Precio:</span> S/ {Number(it.ori_dec_price||0).toFixed(2)}</div>
                  <div><span className="opacity-60">Virtual:</span> {virtual ? 'Sí' : 'No'}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-1 rounded bg-slate-100">{estado}</span>
                  <span className={`text-xs px-2 py-1 rounded ${enabled ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    {enabled ? 'Descarga habilitada' : 'Descarga deshabilitada'}
                  </span>
                  {it.ori_txt_prepared_key && (
                    <span className="text-xs px-2 py-1 rounded bg-indigo-100" title={it.ori_txt_prepared_key}>
                      preparado: {it.ori_txt_prepared_key.split('/').pop()}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => toggleDownload(it.ori_int_id, enabled)}
                  >
                    {enabled ? 'Deshabilitar descarga' : 'Habilitar descarga'}
                  </Button>

                  {!virtual && (
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 self-center">
                      No virtual
                    </span>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {(!loading && items.length === 0) && (
        <div className="opacity-60 text-sm">No hay ítems.</div>
      )}
    </div>
  )
}
