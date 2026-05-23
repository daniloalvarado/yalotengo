/**
 * animations.js
 * Utilidades globales para manejar animaciones en la aplicación.
 */

/**
 * Genera las clases y estilos necesarios para un efecto de aparición en cascada (barrido).
 * 
 * @param {number} index - El orden de aparición del elemento (ej: 1, 2, 3...)
 * @param {string} extraClasses - Clases de Tailwind adicionales que el elemento ya tenga.
 * @param {number} baseDelay - Retardo inicial opcional en milisegundos (por defecto 0).
 * @param {number} step - Milisegundos entre cada elemento (por defecto 50).
 * @returns {Object} Un objeto con { className, style } para inyectar en el elemento JSX.
 */
export const cascade = (index, extraClasses = "", baseDelay = 0, step = 50) => {
    return {
        className: `opacity-0 animate-fade-in-up ${extraClasses}`.trim(),
        style: { animationDelay: `${baseDelay + (index * step)}ms` }
    };
};
