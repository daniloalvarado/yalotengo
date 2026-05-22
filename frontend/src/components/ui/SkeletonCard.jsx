import React from 'react';

/**
 * SkeletonCard
 * Componente que muestra una tarjeta simulada "cargando" con una animación de pulso.
 * Ayuda a mejorar la percepción de velocidad.
 */
export default function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl shadow-card p-4 sm:p-5 flex flex-col gap-4 border border-gray-100 animate-pulse-slow">
            {/* Imagen simulada */}
            <div className="w-full h-40 bg-gray-200 rounded-lg"></div>
            
            <div className="flex flex-col gap-2 mt-2">
                {/* Título simulado */}
                <div className="w-3/4 h-5 bg-gray-200 rounded"></div>
                {/* Categoría/Subtítulo simulado */}
                <div className="w-1/2 h-4 bg-gray-100 rounded"></div>
            </div>
            
            {/* Botón y precio simulados */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <div className="w-1/4 h-6 bg-gray-200 rounded"></div>
                <div className="w-1/3 h-10 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
    );
}
