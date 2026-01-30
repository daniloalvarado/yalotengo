import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import qrStatic from '../assets/qr_plin.png' 

// Util: formato
const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })
const fmt = (n) => PEN.format(Number(n || 0))

// 📲 Soporte / WhatsApp
const SUPPORT_LOCAL = '949244198'          // mostrado al usuario
const SUPPORT_INTL = '51949244198'         // para wa.me (código país +51)

// Button base
function Btn({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default function Checkout() {
  const nav = useNavigate()

  // Estado
  const [cart, setCart] = useState([])
  const [me, setMe] = useState(null)
  const [qrInfo, setQrInfo] = useState(null) // { imagePreview, label }
  const [bankList, setBankList] = useState([]) // [{bank,alias,account,cci,holder}]
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [payCode, setPayCode] = useState('')
  const [errMsg, setErrMsg] = useState('')

  // Identidad (para libros)
  const [idNombres, setIdNombres] = useState('')
  const [idApellidos, setIdApellidos] = useState('')
  const [idDocumento, setIdDocumento] = useState('')

  // Flags calculados en front (pueden fallar si no viene product.*)
  const hasBooksClient = useMemo(
    () => cart.some(i => i.product?.pro_bol_virtual || i.product?.pro_txt_kind === 'LIBRO'),
    [cart]
  )
  const hasPhysicalClient = useMemo(
    () => cart.some(i => !i.product?.pro_bol_virtual),
    [cart]
  )

  // ✅ Flags confiables del servidor
  const [hasBooksSrv, setHasBooksSrv] = useState(false)
  const [hasPhysicalSrv, setHasPhysicalSrv] = useState(false)

  // Mostrar bloque de identidad si cualquiera de los dos dice que hay libros
  const showIdentity = hasBooksClient || hasBooksSrv
  const needIdentity = useMemo(
    () => showIdentity && (!(idNombres?.trim()) || !(idApellidos?.trim()) || !(idDocumento?.trim())),
    [showIdentity, idNombres, idApellidos, idDocumento]
  )

  // Total robusto (product.* o cit_*)
  const total = useMemo(
    () =>
      cart.reduce((s, it) => {
        const price = Number(it.product?.pro_dec_price ?? it.cit_dec_price ?? 0)
        const qty = Number(it.qty ?? it.cit_int_qty ?? 0)
        return s + price * qty
      }, 0),
    [cart]
  )

  // Fallback bancario solicitado
  const FALLBACK_BANKS = [
    {
      bank: 'Interbank',
      alias: 'Cuenta Simple Soles',
      account: '740 3099137880',
      cci: '00374001309913788088',
      holder: 'Lelis Antony Saravia LLaja',
    },
  ]

  // Cargar data inicial
  useEffect(() => {
    (async () => {
      try {
        const meRes = await api.get('/auth/me')
        setMe(meRes.data.user)
        setIdNombres(meRes.data.user?.use_txt_nombres || '')
        setIdApellidos(meRes.data.user?.use_txt_apellidos || '')
        setIdDocumento(meRes.data.user?.use_txt_documento || '')
      } catch {}

      try { const cartRes = await api.get('/cart'); setCart(cartRes.data.items || []) } catch {}

      try {
        const q = await api.get('/payments/manual/info')
        // QR: usa el del backend si existe; si no, usa imagen local
        const backendQR = q.data?.qr?.imagePreview
        if (backendQR) {
          setQrInfo(q.data.qr)
        } else {
          setQrInfo({ imagePreview: qrStatic, label: 'Interbank QR' })
        }

        // Bancos: usa los del backend si hay; si no, tu fallback
        const banks = Array.isArray(q.data?.banks) ? q.data.banks : []
        setBankList(banks.length ? banks : FALLBACK_BANKS)
      } catch {
        // Si falla la API, usa fallbacks
        setQrInfo({ imagePreview: qrStatic, label: 'Interbank QR' })
        setBankList(FALLBACK_BANKS)
      }

      // 🔎 Flags de servidor
      try {
        const f = await api.get('/cart/flags')
        setHasBooksSrv(!!f.data?.has_virtual)
        setHasPhysicalSrv(!!f.data?.has_physical)
      } catch {}
    })()
  }, [])

  function copy(text) { navigator.clipboard?.writeText(String(text)) }

  // --- Helpers para PDF (sin popups)
  async function downloadSummaryPDF({ ordId, payCode }) {
    let jsPDFMod
    try {
      jsPDFMod = await import('jspdf')
    } catch {
      alert('Falta dependencia jsPDF. Ejecuta: npm i jspdf')
      return
    }
    const { jsPDF } = jsPDFMod
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    const margin = 12
    let x = margin, y = margin
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const contentW = pageW - margin * 2

    const addLine = (h = 6) => { y += h; if (y > pageH - margin) { doc.addPage(); y = margin } }

    // Título
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
    doc.text('Resumen de compra', x, y); addLine(8)

    // Metadatos
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    const fecha = new Date().toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
    doc.text(`Fecha: ${fecha}`, x, y); addLine(5)
    doc.text(`Pedido: #${ordId || '-'}`, x, y); addLine(5)
    if (payCode) { doc.text(`Código de pago: ${payCode}`, x, y); addLine(6) }

    // Identidad (si libro)
    if (showIdentity) {
      const full = [idNombres, idApellidos].filter(Boolean).join(' ') || '-'
      const dni = idDocumento || '-'
      doc.setFont('helvetica', 'bold'); doc.text('Datos para libro digital', x, y); addLine(6)
      doc.setFont('helvetica', 'normal')
      doc.text(`Cliente: ${full}`, x, y); addLine(5)
      doc.text(`DNI: ${dni}`, x, y); addLine(6)
    }

    // Envío / WhatsApp
    const hasPhysical = hasPhysicalClient || hasPhysicalSrv
    doc.setFont('helvetica', 'bold'); doc.text('Entrega', x, y); addLine(6)
    doc.setFont('helvetica', 'normal')
    if (hasPhysical) {
      doc.text(`WhatsApp: ${whatsapp || '-'}`, x, y); addLine(5)
      doc.text('Envío: Se coordina por WhatsApp', x, y); addLine(6)
    } else {
      doc.text('Entrega: Digital', x, y); addLine(6)
    }

    // Cuentas bancarias
    if (bankList.length > 0) {
      doc.setFont('helvetica', 'bold'); doc.text('Cuentas bancarias', x, y); addLine(6)
      doc.setFont('helvetica', 'normal')
      bankList.forEach((b) => {
        doc.text(`Banco: ${b.bank}${b.alias ? `  |  Alias: ${b.alias}` : ''}`, x, y); addLine(5)
        doc.text(`Cuenta: ${b.account}`, x, y); addLine(5)
        if (b.cci) { doc.text(`CCI: ${b.cci}`, x, y); addLine(5) }
        if (b.holder) { doc.text(`Titular: ${b.holder}`, x, y); addLine(5) }
        addLine(2)
      })
    }

    // QR (si es base64 o imagen importada)
    if (qrInfo?.imagePreview) {
      const imgW = 50, imgH = 50
      if (y + imgH > pageH - margin) { doc.addPage(); y = margin }
      // jsPDF detecta base64. Para import local, se asume PNG.
      doc.addImage(qrInfo.imagePreview, 'PNG', x, y, imgW, imgH)
      y += imgH + 4
      doc.setFont('helvetica','normal'); doc.setFontSize(9)
      doc.text(`Referencia WhatsApp: ${SUPPORT_LOCAL}`, x, y); addLine(6)
    }

    // Tabla de items
    doc.setFont('helvetica', 'bold'); doc.text('Detalle de productos', x, y); addLine(6)
    const th = 7
    const colName = x
    const colQty = x + contentW * 0.60
    const colPrice = x + contentW * 0.75
    const colSub = x + contentW * 0.87

    doc.setFontSize(10)
    doc.text('Producto', colName, y)
    doc.text('Cant', colQty, y, { align: 'right' })
    doc.text('Precio', colPrice, y, { align: 'right' })
    doc.text('Subtotal', colSub, y, { align: 'right' })
    addLine(th)

    doc.setFont('helvetica', 'normal')
    cart.forEach((it) => {
      const name = it.product?.pro_txt_name ?? it.cit_txt_name_snapshot ?? 'Producto'
      const price = Number(it.product?.pro_dec_price ?? it.cit_dec_price ?? 0)
      const qty = Number(it.qty ?? it.cit_int_qty ?? 0)
      const sub = price * qty

      const maxWidth = contentW * 0.58
      const lines = doc.splitTextToSize(name, maxWidth)
      const rowH = Math.max(th, lines.length * 5)

      if (y + rowH > pageH - margin) { doc.addPage(); y = margin }

      doc.text(lines, colName, y)
      doc.text(String(qty), colQty, y, { align: 'right' })
      doc.text(fmt(price), colPrice, y, { align: 'right' })
      doc.text(fmt(sub), colSub, y, { align: 'right' })

      y += rowH
    })

    // Total
    addLine(6)
    doc.setFont('helvetica', 'bold')
    doc.text('Total:', colPrice, y, { align: 'right' })
    doc.text(fmt(total), colSub, y, { align: 'right' })
    addLine(10)

    // Nota (pago requerido)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    const nota = payCode
      ? `Debes realizar el pago por transferencia o QR. Luego, envía el comprobante por WhatsApp al ${SUPPORT_LOCAL} indicando tu código de pago ${payCode} y adjunta el PDF "resumen-pedido-${ordId}.pdf".`
      : `Debes realizar el pago por transferencia o QR. Luego, envía el comprobante por WhatsApp al ${SUPPORT_LOCAL} y adjunta el PDF del resumen.`
    const notaLines = doc.splitTextToSize(nota, contentW)
    notaLines.forEach(line => { doc.text(line, x, y); addLine(4) })

    const filename = `resumen-pedido-${ordId || 's/n'}.pdf`
    doc.save(filename)
  }

  // Abre WhatsApp con mensaje prellenado (el adjunto debe hacerlo el usuario)
  function openWhatsApp({ ordId, payCode }) {
    const full = [idNombres, idApellidos].filter(Boolean).join(' ') || (me?.use_txt_nombres || '')
    const dni = idDocumento || me?.use_txt_documento || ''
    const msgLines = [
      `Hola, acabo de generar mi pedido #${ordId}.`,
      payCode ? `Código de pago: ${payCode}` : null,
      `Total: ${fmt(total)}`,
      dni ? `DNI: ${dni}` : null,
      full ? `Cliente: ${full}` : null,
      `Adjunto el PDF del resumen y el comprobante de pago.`
    ].filter(Boolean)
    const text = encodeURIComponent(msgLines.join('\n'))
    const url = `https://wa.me/${SUPPORT_INTL}?text=${text}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Guarda identidad si faltan datos (para encriptación)
  async function ensureIdentityUpToDate() {
    let needVirtual = hasBooksSrv || hasBooksClient
    try {
      const f = await api.get('/cart/flags')
      needVirtual = !!f.data?.has_virtual
      setHasBooksSrv(needVirtual)
      setHasPhysicalSrv(!!f.data?.has_physical)
    } catch {}

    if (!needVirtual) return

    if (!idNombres.trim() || !idApellidos.trim() || !idDocumento.trim()) {
      throw new Error('Completa Nombres, Apellidos y DNI para continuar.')
    }

    const changed =
      idNombres !== (me?.use_txt_nombres || '') ||
      idApellidos !== (me?.use_txt_apellidos || '') ||
      idDocumento !== (me?.use_txt_documento || '')

    if (changed) {
      const { data } = await api.patch('/auth/me', {
        nombres: idNombres.trim(),
        apellidos: idApellidos.trim(),
        documento: idDocumento.trim(),
      })
      setMe(prev => ({ ...(prev || {}), ...(data?.user || {}) }))
    }
  }

  // Checkout
  async function placeOrder() {
    setErrMsg('')
    try {
      await ensureIdentityUpToDate()

      const hasPhysical = hasPhysicalClient || hasPhysicalSrv
      if (hasPhysical && !whatsapp.trim()) {
        throw new Error('Ingresa tu WhatsApp para coordinar envíos.')
      }

      setLoading(true)
      setPayCode('')

      const created = await api.post('/orders/from-cart', {})
      const ordId = created.data?.order?.ord_int_id
      if (!ordId) throw new Error('No se pudo crear la orden')

      const start = await api.post('/payments/manual/start', {
        ord_int_id: ordId,
        bank_alias: null,
      })
      const code = start.data?.pay_code || ''
      setPayCode(code)

      const ord = await api.get(`/orders/${ordId}`)
      const hasVirtual = Array.isArray(ord.data?.items) && ord.data.items.some(it => !!it.ori_bol_virtual)
      if (hasVirtual) {
        await api.post(`/orders/${ordId}/mark-paid`, { delayMin: 0 })
      }

      // 1) Genera y guarda el PDF local
      await downloadSummaryPDF({ ordId, payCode: code })

      // 2) Abre WhatsApp con mensaje listo para adjuntar PDF y comprobante
      openWhatsApp({ ordId, payCode: code })

      // 3) Navega a la vista del pedido
      nav(`/order/${ordId}`)
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Error en checkout'
      setErrMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
      {/* Columna izquierda: pago manual */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Pago manual (QR / Transferencia)</h2>

        {errMsg && (
          <div className="rounded-lg border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
            {errMsg}
          </div>
        )}

        {/* 🔐 Identidad si hay libros */}
        {showIdentity && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-amber-800">Datos para libro digital</div>
            <p className="text-xs text-amber-700/80 mt-1">
              Se usan para encriptar tu PDF. La contraseña será tu <b>DNI</b>.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-zinc-700 mb-1">Nombres</label>
                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                  value={idNombres}
                  onChange={(e) => setIdNombres(e.target.value)}
                  placeholder="Tus nombres"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-700 mb-1">Apellidos</label>
                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                  value={idApellidos}
                  onChange={(e) => setIdApellidos(e.target.value)}
                  placeholder="Tus apellidos"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-zinc-700 mb-1">DNI</label>
              <input
                className="w-full sm:w-64 rounded-lg border border-zinc-300 px-3 py-2"
                value={idDocumento}
                onChange={(e) => setIdDocumento(e.target.value)}
                placeholder="Ej. 12345678"
              />
            </div>
          </div>
        )}

        {/* Cuentas bancarias */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-medium mb-3">Cuentas bancarias</div>
          {bankList.length === 0 ? (
            <p className="text-sm text-zinc-600">No hay cuentas bancarias configuradas.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {bankList.map((b, i) => (
                <div key={b.alias || i} className="rounded-lg border p-3">
                  <div className="font-medium">{b.bank}</div>
                  <div className="text-xs text-zinc-500">Alias: {b.alias || '-'}</div>
                  <div className="mt-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span>Cuenta:</span>
                      <button type="button" className="text-emerald-600 text-xs underline" onClick={() => copy(b.account)}>copiar</button>
                    </div>
                    <div className="font-mono text-sm select-all">{b.account}</div>
                    {b.cci && (
                      <>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span>CCI:</span>
                          <button type="button" className="text-emerald-600 text-xs underline" onClick={() => copy(b.cci)}>copiar</button>
                        </div>
                        <div className="font-mono text-sm select-all">{b.cci}</div>
                      </>
                    )}
                    {b.holder && <div className="mt-1 text-xs text-zinc-500">Titular: {b.holder}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QR */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-medium">QR</div>
          <p className="text-sm text-zinc-600 mb-3">
            <b>Debes realizar el pago</b> por QR o transferencia. Luego, envía el comprobante por WhatsApp junto con tu <span className="font-medium">código de pago</span> y el PDF del resumen.
          </p>
          {qrInfo?.imagePreview ? (
            <div className="flex flex-col items-start gap-2">
              <img src={qrInfo.imagePreview} alt="QR" className="w-56 h-56 object-contain border rounded" />
              <div className="text-xs text-zinc-600">
                Referencia WhatsApp: <span className="font-mono">{SUPPORT_LOCAL}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-500">Sin QR configurado.</div>
          )}
        </div>

        {/* Contacto / WhatsApp (si hay envío físico) */}
        {(hasPhysicalClient || hasPhysicalSrv) && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-sm font-medium">Contacto para envío (WhatsApp)</div>
            <input
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="+51 9XXXXXXXX"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
            />
            <p className="text-xs text-zinc-500 mt-1">Usaremos este número para coordinar entrega.</p>
          </div>
        )}

        <Btn
          disabled={loading || cart.length === 0}
          onClick={placeOrder}
          className={`w-full ${loading ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}
        >
          {loading ? 'Procesando…' : 'Generar código, descargar PDF y abrir WhatsApp'}
        </Btn>

        {payCode && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
            <div className="text-sm font-semibold text-emerald-700">¡Pedido registrado!</div>
            <div className="mt-1 text-sm">
              Código de pago: <span className="font-mono">{payCode}</span>
            </div>
            <p className="mt-2 text-xs text-emerald-700/80">
              Se descargó el PDF con el resumen. Adjunta ese archivo en el chat de WhatsApp que abrimos y envíanos también tu comprobante de pago.
            </p>
          </div>
        )}
      </section>

      {/* Columna derecha: RESUMEN */}
      <aside className="space-y-4">
        <h3 className="text-base font-semibold">Resumen</h3>
        <div className="rounded-xl border border-zinc-200 bg-white divide-y">
          {cart.length === 0 && (
            <div className="p-4 text-sm text-zinc-600">Tu carrito está vacío.</div>
          )}

          {cart.map((it) => {
            const key = it.cart_item_id ?? it.cit_int_id
            const name = it.product?.pro_txt_name ?? it.cit_txt_name_snapshot ?? 'Producto'
            const desc = it.product?.pro_txt_desc ?? ''
            const img = it.product?.pro_txt_image_url ?? null
            const price = Number(it.product?.pro_dec_price ?? it.cit_dec_price ?? 0)
            const qty = Number(it.qty ?? it.cit_int_qty ?? 0)
            const subtotal = price * qty

            return (
              <div key={key} className="p-4 flex items-start gap-3">
                {img ? (
                  <img src={img} alt="thumb" className="h-16 w-16 object-cover rounded" />
                ) : (
                  <div className="h-16 w-16 rounded bg-zinc-100 grid place-items-center text-xs text-zinc-500">IMG</div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium line-clamp-1">{name}</div>
                  {desc && <div className="text-xs text-zinc-500 line-clamp-2">{desc}</div>}
                  <div className="mt-1 text-sm font-medium">{fmt(price)}</div>
                  <div className="mt-2 text-xs text-zinc-600">Cant: {qty}</div>
                </div>

                <div className="text-right font-medium">{fmt(subtotal)}</div>
              </div>
            )
          })}

          <div className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">{fmt(total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Envío</span>
              <span>Se coordina por WhatsApp</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
