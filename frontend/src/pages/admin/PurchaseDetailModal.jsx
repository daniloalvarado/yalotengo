import React, { useState, useEffect } from 'react'
import { UserCircleIcon, CalendarIcon, CreditCardIcon, MapPinIcon, PhoneIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import { StatusTag, formatDateTime, PEN } from './adminUtils'
import api from '../../api/client'
import AnimatedModal from '../../components/AnimatedModal'

export default function PurchaseDetailModal({ purchase, onClose, type = 'Producto' }) {
    // Cache purchase data to allow exit animation when purchase becomes null
    const [cachedPurchase, setCachedPurchase] = useState(purchase)

    useEffect(() => {
        if (purchase) {
            setCachedPurchase(purchase)
        }
    }, [purchase])

    const item = purchase || cachedPurchase

    // If we have no data at all (not even cached), don't render content
    if (!item) return null

    // Determine product name based on purchase object structure
    const productName = item.modelName || item.bookTitle || item.courseTitle || 'Producto desconocido'
    const productType = item.modelId ? 'Modelo 3D' : item.bookId ? 'Libro' : item.courseId ? 'Curso' : type

    // Avatar URL logic
    let avatarUrl = null
    if (item.userAvatar) {
        if (item.userAvatar.startsWith('http')) {
            avatarUrl = item.userAvatar
        } else {
            const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')
            avatarUrl = `${base}/uploads/avatars/${item.userAvatar}`
        }
    }

    return (
        <AnimatedModal
            isOpen={!!purchase}
            onClose={onClose}
            title="Detalle de Compra"
            subtitle={`ID: #${item.id}`}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-8">
                {/* 1. User Card */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <UserCircleIcon className="w-5 h-5 text-gray-500" />
                        Información del Cliente
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Avatar */}
                        <div className="shrink-0 flex justify-center">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-sm bg-gray-200 flex items-center justify-center">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-gray-400">
                                        {item.userName ? item.userName[0] : 'U'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <div>
                                <span className="block text-gray-500 text-xs mb-1">Nombre Completo</span>
                                <span className="font-medium text-gray-900 text-base">{item.userName}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs mb-1">Email</span>
                                <span className="text-gray-900 truncate block text-base">{item.userEmail}</span>
                            </div>

                            <div>
                                <span className="block text-gray-500 text-xs mb-1 flex items-center gap-1">
                                    <IdentificationIcon className="w-3 h-3" /> DNI
                                </span>
                                <span className="text-gray-900">{item.userDni || 'No registrado'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs mb-1 flex items-center gap-1">
                                    <PhoneIcon className="w-3 h-3" /> Teléfono
                                </span>
                                <span className="text-gray-900">{item.userPhone || 'No registrado'}</span>
                            </div>

                            <div className="sm:col-span-2">
                                <span className="block text-gray-500 text-xs mb-1 flex items-center gap-1">
                                    <MapPinIcon className="w-3 h-3" /> Dirección
                                </span>
                                <span className="text-gray-900">{item.userAddress || 'No registrada'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Transaction & Product Info */}
                <div className="grid md:grid-cols-2 gap-6">

                    {/* Transaction */}
                    <div className="border border-gray-200 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CreditCardIcon className="w-5 h-5 text-gray-500" />
                            Transacción
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Monto Total</span>
                                <span className="font-bold text-lg text-emerald-600">{PEN.format(Number(item.amount || 0))}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Estado</span>
                                <StatusTag status={item.status} />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">ID Pago</span>
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{item.paymentId || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 flex items-center gap-1">
                                    <CalendarIcon className="w-4 h-4" /> Fecha
                                </span>
                                <span>{formatDateTime(item.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Product */}
                    <div className="border border-gray-200 rounded-xl p-5 bg-emerald-50/50 border-emerald-100">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 text-emerald-800">
                            Producto Adquirido
                        </h3>
                        <div className="flex flex-col h-full justify-center">
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-700 w-fit mb-2">
                                {productType}
                            </span>
                            <p className="text-lg font-medium text-gray-900 leading-snug">
                                {productName}
                            </p>
                            {item.bookAuthor && (
                                <p className="text-sm text-emerald-600 mt-1">Autor: {item.bookAuthor}</p>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer Action */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors shadow-sm"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </AnimatedModal>
    )
}
