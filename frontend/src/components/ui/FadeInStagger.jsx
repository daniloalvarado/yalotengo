import React, { Children } from 'react';

/**
 * FadeInStagger
 * Envoltorio que toma a sus hijos directos y les aplica una animación
 * de entrada (fade-in-up) escalonada usando clases de Tailwind.
 */
export default function FadeInStagger({ 
    children, 
    className = "", 
    baseDelay = 0,
    staggerDelay = 100 // ms entre cada hijo
}) {
    return (
        <div className={className}>
            {Children.map(children, (child, index) => {
                if (!React.isValidElement(child)) return child;
                
                // Mapear delay a clases de Tailwind (soportamos hasta 500ms por simplicidad o usamos style inline para retrasos exactos)
                const delayMs = baseDelay + (index * staggerDelay);
                
                // Para mantenerlo puramente en CSS sin que falle si el delay no existe en tailwind,
                // usamos inline style solo para el delay, que es la forma más segura y optimizada.
                return React.cloneElement(child, {
                    className: `opacity-0 animate-fade-in-up ${child.props.className || ''}`,
                    style: { ...child.props.style, animationDelay: `${delayMs}ms` }
                });
            })}
        </div>
    );
}
