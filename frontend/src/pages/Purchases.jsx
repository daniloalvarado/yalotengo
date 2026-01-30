// src/pages/Purchases.jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import api from '../api/client'

// Importar utilidades y componentes
import { THEME, Tag, STATUS_LABELS, fmtReservation, formatDate, formatTime, getReservationTone } from './purchases/purchasesUtils'
import ReservasTab from './purchases/ReservasTab'
import Models3dTab from './purchases/Models3dTab'
import LibrosTab from './purchases/LibrosTab'
import CursosTab from './purchases/CursosTab'
import FisicoTab from './purchases/FisicoTab'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'

export default function Purchases() {
  const [items, setItems] = useState([])
  const [reservations, setReservations] = useState([])
  const [models3d, setModels3d] = useState([])
  const [books, setBooks] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('RESERVAS')

  // Modal para ver QR
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [qrImage, setQrImage] = useState(null)
  const [loadingQr, setLoadingQr] = useState(false)

  // Fetch functions
  const fetchMyItems = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/my-items')
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error cargando items:', e)
      // No establecer error global, solo log
    }
  }, [])

  const fetchMyReservations = useCallback(async () => {
    try {
      const { data } = await api.get('/reservations/my')
      // La API devuelve { reservations: [...] }
      const allReservations = Array.isArray(data.reservations) ? data.reservations : []
      // Filtrar solo PAID y USED (no mostrar PENDING, EXPIRED, CANCELLED)
      const paidReservations = allReservations.filter(r => r.status === 'PAID' || r.status === 'USED')
      setReservations(paidReservations)
    } catch (e) {
      console.error('Error cargando reservas:', e)
    }
  }, [])

  const fetchMyModels3d = useCallback(async () => {
    try {
      const { data } = await api.get('/models3d/my/purchases')
      setModels3d(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error cargando modelos 3D:', e)
    }
  }, [])

  const fetchMyBooks = useCallback(async () => {
    try {
      const { data } = await api.get('/books/my/purchases')
      setBooks(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error cargando libros:', e)
    }
  }, [])

  const fetchMyCourses = useCallback(async () => {
    try {
      const { data } = await api.get('/courses/my/purchases')
      setCourses(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error cargando cursos:', e)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchMyItems(), fetchMyReservations(), fetchMyModels3d(), fetchMyBooks(), fetchMyCourses()])
      .finally(() => setLoading(false))
  }, [fetchMyItems, fetchMyReservations, fetchMyModels3d, fetchMyBooks, fetchMyCourses])

  const physical = useMemo(() => items.filter(i => !i.ori_bol_virtual), [items])

  // Cargar QR al seleccionar reserva
  const handleViewQr = async (reservation) => {
    setSelectedReservation(reservation)
    setQrImage(null)

    if (reservation.status !== 'PAID' && reservation.status !== 'USED') {
      return
    }

    setLoadingQr(true)
    try {
      const { data } = await api.get(`/reservations/${reservation.id}/qr`, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      setQrImage(url)
    } catch (e) {
      console.error('Error cargando QR:', e)
    } finally {
      setLoadingQr(false)
    }
  }

  // Componente de Tab Button
  const TabButton = ({ id, label, count }) => (
    <button
      className={`px-3 py-1.5 rounded-lg text-sm transition ${tab === id ? 'text-white' : 'border border-zinc-300 hover:bg-zinc-50'}`}
      style={{ backgroundColor: tab === id ? THEME.primary : undefined }}
      onClick={() => setTab(id)}
    >
      {label} ({count})
    </button>
  )

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-1">
        <ShoppingBagIcon className="w-10 h-10 text-emerald-600" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Mis compras
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <TabButton id="RESERVAS" label="Reservas" count={reservations.length} />
        <TabButton id="DIGITAL" label="Modelos 3D" count={models3d.length} />
        <TabButton id="LIBROS" label="Libros" count={books.length} />
        <TabButton id="CURSOS" label="Cursos" count={courses.length} />
        <TabButton id="FISICO" label="Impresiones 3D" count={physical.length} />
      </div>

      {loading && <div className="opacity-70 text-sm">Cargando…</div>}

      {/* Tab Content */}
      {tab === 'RESERVAS' && (
        <ReservasTab reservations={reservations} loading={loading} onViewQr={handleViewQr} />
      )}

      {tab === 'DIGITAL' && (
        <Models3dTab models3d={models3d} loading={loading} />
      )}

      {tab === 'LIBROS' && (
        <LibrosTab books={books} loading={loading} />
      )}

      {tab === 'CURSOS' && (
        <CursosTab courses={courses} loading={loading} />
      )}

      {tab === 'FISICO' && (
        <FisicoTab physical={physical} loading={loading} />
      )}

      {/* Modal QR */}
      {selectedReservation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedReservation(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-2xl text-zinc-400 hover:text-zinc-600"
              onClick={() => setSelectedReservation(null)}
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-4 text-center" style={{ color: THEME.primary }}>
              Detalles de Reserva
            </h2>

            {qrImage && (
              <div className="flex justify-center mb-4">
                <img
                  src={qrImage}
                  alt="Código QR"
                  className="w-48 h-48 rounded-lg border-4"
                  style={{ borderColor: THEME.primary }}
                />
              </div>
            )}

            {loadingQr && (
              <div className="text-center text-sm opacity-60 mb-4">Cargando QR...</div>
            )}

            <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: THEME.primaryLight }}>
              <div className="flex justify-between">
                <span className="opacity-70">Reserva #:</span>
                <strong>{selectedReservation.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">A nombre de:</span>
                <strong>{selectedReservation.userName || 'N/A'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Fecha:</span>
                <strong>{formatDate(selectedReservation.date)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Horario:</span>
                <strong>{formatTime(selectedReservation.timeslot)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Personas:</span>
                <strong>{selectedReservation.guests}</strong>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Estado:</span>
                <Tag tone={getReservationTone(selectedReservation.status)}>
                  {STATUS_LABELS[selectedReservation.status] || selectedReservation.status}
                </Tag>
              </div>
              <div className="flex justify-between border-t pt-2" style={{ borderColor: THEME.primary + '30' }}>
                <span className="opacity-70">Total Pagado:</span>
                <strong style={{ color: THEME.primary }}>{fmtReservation(selectedReservation.price, selectedReservation.currency)}</strong>
              </div>
            </div>

            <p className="text-center text-sm text-zinc-500 mt-4">
              Presenta este código QR en la entrada del museo
            </p>
          </div>
        </div>
      )}
    </div>
  )
}