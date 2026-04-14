import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function AnimatedModal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg', closeOnOutsideClick = true }) {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            // Slight delay to allow render before animation starts
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
            // Wait for animation to finish before unmounting
            const timer = setTimeout(() => setShouldRender(false), 500); // 0.5s matches animation duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeOnOutsideClick ? onClose : undefined}
        >
            <div
                className={`bg-white rounded-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col shadow-2xl ${isVisible ? 'animate-slide-down' : 'animate-slide-up'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content with Custom Scrollbar */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
