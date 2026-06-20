import React, { useState, useEffect } from 'react';
import { CardPayment } from '@mercadopago/sdk-react';

export default function MercadoPagoForm({ price, onSubmit, onReady, onError }) {
    const [isDarkTheme, setIsDarkTheme] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsDarkTheme(document.documentElement.classList.contains('dark'));
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    return (
        <div className="dark:bg-[#141414] dark:p-2 dark:rounded-lg">
            <CardPayment
                initialization={{ amount: Number(price) }}
                customization={{
                    paymentMethods: { maxInstallments: 1 },
                    visual: {
                        style: {
                            theme: isDarkTheme ? 'dark' : 'default',
                            customVariables: {
                                formBackgroundColor: 'transparent',
                                baseColor: '#059669',
                                textPrimaryColor: isDarkTheme ? '#ffffff' : '#111827',
                                textSecondaryColor: isDarkTheme ? '#d1d5db' : '#4b5563',
                                inputBackgroundColor: isDarkTheme ? '#27272a' : '#ffffff'
                            }
                        }
                    }
                }}
                onSubmit={onSubmit}
                onReady={onReady || (() => console.log('CardPayment ready'))}
                onError={onError || ((error) => console.error('MP CardPayment Error:', error))}
            />
        </div>
    );
}
