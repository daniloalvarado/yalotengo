// src/pages/purchases/CursosTab.jsx
import Card from '../../components/ui/Card'
import DownloadButton from '../../components/DownloadButton'
import { Tag, fmt } from './purchasesUtils'

export default function CursosTab({ courses, loading }) {
    return (
        <>
            {!loading && courses.length === 0 && (
                <div className="text-sm opacity-60">Aún no tienes compras de cursos.</div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((purchase) => {
                    const course = purchase.course || {}
                    const title = course.cou_txt_title || 'Curso'
                    const price = Number(purchase.cpu_dec_amount || course.cou_dec_price || 0)
                    const purchaseDate = purchase.cpu_dt_created
                        ? new Date(purchase.cpu_dt_created).toLocaleDateString('es-PE')
                        : ''

                    return (
                        <Card key={purchase.cpu_int_id}>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm opacity-70">Inscripción #{purchase.cpu_int_id}</div>
                                    <Tag tone="emerald">Inscrito</Tag>
                                </div>
                                <div className="font-medium truncate">{title}</div>
                                {course.cou_txt_duration && (
                                    <div className="text-sm text-emerald-600">⏱ {course.cou_txt_duration}</div>
                                )}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="opacity-60">Precio:</span> {fmt(price)}</div>
                                    <div><span className="opacity-60">Fecha:</span> {purchaseDate}</div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 mb-2">
                                    📧 Revisa tu email para las instrucciones de acceso
                                </div>
                                <DownloadButton
                                    className="w-full"
                                    onClick={() => alert('Próximamente disponible')}
                                    text="Materiales del Curso"
                                />
                            </div>
                        </Card>
                    )
                })}
            </div>
        </>
    )
}
