import React from 'react'
import { XMarkIcon, UserCircleIcon, CalendarIcon, CreditCardIcon, MapPinIcon, PhoneIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import { StatusTag, formatDateTime, PEN } from './adminUtils'

export default function PurchaseDetailModal({ purchase, onClose, type = 'Producto' }) {
    if (!purchase) return null

    // Determine product name based on purchase object structure
    const productName = purchase.modelName || purchase.bookTitle || purchase.courseTitle || 'Producto desconocido'
    const productType = purchase.modelId ? 'Modelo 3D' : purchase.bookId ? 'Libro' : purchase.courseId ? 'Curso' : type

    // Avatar logic
    let avatarUrl = null
    if (purchase.userAvatar) {
        avatarUrl = purchase.userAvatar.startsWith('http') ? purchase.userAvatar : `/avatars/${purchase.userAvatar}`
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Detalle de Compra</h2>
                        <p className="text-sm text-gray-500">ID: #{purchase.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">

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
                                            {purchase.userName ? purchase.userName[0] : 'U'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                <div>
                                    <span className="block text-gray-500 text-xs text-xs mb-1">Nombre Completo</span>
                                    <span className="font-medium text-gray-900 text-base">{purchase.userName}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs mb-1">Email</span>
                                    <span className="text-gray-900 truncate block text-base">{purchase.userEmail}</span>
                                </div>

                                <div>
                                    <span className="block text-gray-500 text-xs mb-1 flex items-center gap-1">
                                        <IdentificationIcon className="w-3 h-3" /> DNI
                                    </span>
                                    <span className="text-gray-900">{purchase.userDni || 'No registrado'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs mb-1 flex items-center gap-1">
                                        <PhoneIcon className="w-3 h-3" /> Teléfono
                                    </span>
                                    <span className="text-gray-900">{purchase.userPhone || 'No registrado'}</span>
                                </div>

                                <div className="sm:col-span-2">
                                    <span className="block text-gray-500 text-xs mb-1 flex items-center gap-1">
                                        <MapPinIcon className="w-3 h-3" /> Dirección
                                    </span>
                                    <span className="text-gray-900">{purchase.userAddress || 'No registrada'}</span>
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
                                    <span className="font-bold text-lg text-emerald-600">{PEN.format(Number(purchase.amount || 0))}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Estado</span>
                                    <StatusTag status={purchase.status} />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">ID Pago</span>
                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{purchase.paymentId || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 flex items-center gap-1">
                                        <CalendarIcon className="w-4 h-4" /> Fecha
                                    </span>
                                    <span>{formatDateTime(purchase.createdAt)}</span>
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
                                {purchase.bookAuthor && (
                                    <p className="text-sm text-emerald-600 mt-1">Autor: {purchase.bookAuthor}</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end rounded-b-2xl border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors shadow-sm"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}
