import React, { useEffect } from 'react';

export function ModalShell({ children, onClose }) {
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose && onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => onClose && onClose()}
        >
            <div
                className="bg-white w-full rounded-2xl p-6 animate-slide-up max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
