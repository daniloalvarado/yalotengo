// src/pages/purchases/purchasesUtils.js
// Helpers y constantes compartidas para la página de compras

export const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })
export const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export const fmt = (n) => PEN.format(Number(n || 0))

// Formateador dinámico para reservas según moneda
export const fmtReservation = (price, currency) => {
    const amount = Number(price || 0)
    if (currency === 'USD') return USD.format(amount)
    return PEN.format(amount)
}

export const THEME = {
    primary: '#0d9467',
    primaryLight: '#e6f7f2',
}

export const STATUS_LABELS = {
    PENDING: 'Pendiente',
    PAID: 'Pagado',
    USED: 'Usado',
    EXPIRED: 'Vencido',
    CANCELLED: 'Cancelado'
}

export function Tag({ children, tone = 'zinc' }) {
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

// -------- helpers de descarga sin abrir pestañas --------
export function filenameFromDisposition(dispo) {
    if (!dispo) return null
    const utf8 = dispo.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
    if (utf8?.[1]) return decodeURIComponent(utf8[1].replace(/["']/g, ''))
    const ascii = dispo.match(/filename\s*=\s*("?)([^";]+)\1/i)
    if (ascii?.[2]) return ascii[2]
    return null
}

export function triggerBlobDownload(blob, fallbackName) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fallbackName || 'archivo'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

export async function downloadFromUrl(url, suggestedName) {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' })
    if (!res.ok) throw new Error(`No se pudo descargar (${res.status})`)
    const dispo = res.headers.get('content-disposition')
    const nameFromHdr = filenameFromDisposition(dispo)
    const blob = await res.blob()
    const fallback = nameFromHdr || suggestedName || 'archivo'
    triggerBlobDownload(blob, fallback)
}

// Helper para formato de fecha DD/MM/YYYY
export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

// Helper para formato de hora
export const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
};

// Helper para obtener el tono del status de reserva
export function getReservationTone(status) {
    switch (status) {
        case 'PAID': return 'emerald'
        case 'USED': return 'sky'
        case 'PENDING': return 'amber'
        case 'EXPIRED': return 'zinc'
        case 'CANCELLED': return 'rose'
        default: return 'zinc'
    }
}
