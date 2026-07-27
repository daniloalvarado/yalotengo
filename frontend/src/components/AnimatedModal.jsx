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
            className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeOnOutsideClick ? onClose : undefined}
        >
            <div
                className={`bg-white dark:bg-[#1c1c1c] dark:border dark:border-zinc-800 rounded-2xl w-full ${maxWidth} max-h-[85vh] my-8 flex flex-col shadow-2xl ${isVisible ? 'animate-slide-down' : 'animate-slide-up'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
