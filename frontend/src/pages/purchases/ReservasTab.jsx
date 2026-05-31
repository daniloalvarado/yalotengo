// src/pages/purchases/ReservasTab.jsx
import Card from '../../components/ui/Card'
import QrButton from '../../components/QrButton'
import { Tag, THEME, STATUS_LABELS, fmtReservation, formatDate, formatTime, getReservationTone } from './purchasesUtils'
import { cascade } from '../../utils/animations'

export default function ReservasTab({ reservations, loading, onViewQr }) {
    return (
        <>
            {!loading && reservations.length === 0 && (
                <div className="text-sm opacity-60">Aún no tienes reservas de museo.</div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reservations.map((r, index) => (
                    <div key={r.id} {...cascade(index, '', 0, 100)}>
                        <Card>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm opacity-70">Reserva #{r.id}</div>
                                <Tag tone={getReservationTone(r.status)}>
                                    {STATUS_LABELS[r.status] || r.status}
                                </Tag>
                            </div>

                            <div className="font-medium text-lg" style={{ color: THEME.primary }}>
                                Entrada al Museo
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="opacity-60">Fecha:</span> {formatDate(r.date)}</div>
                                <div><span className="opacity-60">Hora:</span> {formatTime(r.timeslot)}</div>
                                <div><span className="opacity-60">Personas:</span> {r.guests}</div>
                                <div><span className="opacity-60">Total:</span> {fmtReservation(r.price, r.currency)}</div>
                            </div>

                            {(r.status === 'PAID' || r.status === 'USED') && (
                                <QrButton
                                    className="mt-2"
                                    onClick={() => onViewQr(r)}
                                    text="Ver QR / Detalles"
                                />
                            )}

                            {r.status === 'PENDING' && (
                                <div className="text-xs text-amber-600 mt-1">
                                    ⚠️ Pago pendiente - Completa tu reserva
                                </div>
                            )}
                        </div>
                        </Card>
                    </div>
                ))}
            </div>
        </>
    )
}
