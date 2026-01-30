import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'
import { Link, useSearchParams } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#eef2f7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="20">Sin imagen</text></svg>`
  )

export default function Catalog() {
  const [prods, setProds] = useState([])
  const [params] = useSearchParams()
  const kind = params.get('kind') || 'ARTICULO' // 'ARTICULO' | 'LIBRO'

  // Modal preview
  const [preview, setPreview] = useState(null) // { url, title } | null

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/catalog/products', { params: { kind } })
        const list = Array.isArray(data) ? data : []
        setProds(list)
      } catch (e) {
        console.error(e)
        setProds([])
      }
    })()
  }, [kind])

  // Cerrar con ESC
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setPreview(null)
  }, [])
  useEffect(() => {
    if (!preview) return
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [preview, onKeyDown])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Link
          to="/catalog?kind=ARTICULO"
          className={`px-3 py-1 rounded ${kind === 'ARTICULO' ? 'bg-slate-900 text-white' : 'border'}`}
        >
          Digitalizados
        </Link>
        <Link
          to="/catalog?kind=LIBRO"
          className={`px-3 py-1 rounded ${kind === 'LIBRO' ? 'bg-slate-900 text-white' : 'border'}`}
        >
          Impresos
        </Link>
      </div>

      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {prods.map((p) => {
          const imgUrl = p.pro_txt_image || '' // nueva URL que mencionaste
          return (
            <li key={p.pro_int_id}>
              <Card>
                <div className="flex flex-col gap-3">
                  {/* Imagen representativa */}
                  <button
                    type="button"
                    className="relative w-full overflow-hidden rounded-lg bg-slate-100 aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-slate-400"
                    onClick={() =>
                      setPreview({
                        url: imgUrl || PLACEHOLDER,
                        title: p.pro_txt_name || 'Producto',
                      })
                    }
                    title="Ver imagen en grande"
                  >
                    <img
                      src={imgUrl || PLACEHOLDER}
                      alt={p.pro_txt_name || 'Producto'}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER
                      }}
                    />
                  </button>

                  <div className="text-base font-semibold">{p.pro_txt_name}</div>
                  <div className="text-sm text-slate-600 line-clamp-2">{p.pro_txt_desc}</div>
                  <div className="mt-1 text-lg font-semibold">
                    S/ {Number(p.pro_dec_price).toFixed(2)}
                  </div>
                  <div className="mt-1">
                    <Button onClick={() => addToCart(p.pro_int_id)} className="w-full">
                      Agregar al carrito
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          )
        })}
      </ul>

      {/* Modal de imagen ampliada */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()} // prevenir cierre al click dentro
          >
            <div className="absolute -top-10 right-0">
              <button
                onClick={() => setPreview(null)}
                className="px-3 py-1 rounded-md bg-white/90 hover:bg-white text-slate-900 text-sm font-medium shadow"
              >
                Cerrar (Esc)
              </button>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-xl">
              <div className="text-slate-700 font-semibold mb-2">
                {preview.title}
              </div>
              <div className="w-full">
                <img
                  src={preview.url}
                  alt={preview.title}
                  className="mx-auto max-h-[80vh] w-auto object-contain"
                  onError={(e) => {
                    if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  async function addToCart(id) {
    await api.post('/cart/items', { pro_int_id: id, qty: 1 })
    alert('Agregado al carrito')
  }
}
