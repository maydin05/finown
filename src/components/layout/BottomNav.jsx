import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';

export const BottomNav = ({ onOpenQuickMenu }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;

    return (
        <div className="fixed bottom-0 max-w-md w-full bg-white border-t border-gray-200 flex justify-around py-3 px-2 z-20 pb-safe">
            <button
                onClick={() => navigate('/incomes')}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${path === "/incomes" ? "text-teal-600 scale-105" : "text-gray-400"
                    }`}
            >
                <Icon name="trending-up" size={24} className="text-current" />
                <span className="text-[10px] font-medium">Gelir</span>
            </button>

            <button
                onClick={() => navigate('/')}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${path === "/" ? "text-blue-600 scale-105" : "text-gray-400"
                    }`}
            >
                <Icon name="trending-down" size={24} className="text-current" />
                <span className="text-[10px] font-medium">Gider</span>
            </button>

            <button
                onClick={onOpenQuickMenu}
                className="bg-gray-900 text-white rounded-full p-4 -mt-8 shadow-lg shadow-gray-400 hover:bg-black transition-colors transform active:scale-95 border-4 border-gray-50"
            >
                <Icon name="plus" size={28} className="text-white" />
            </button>

            <button
                onClick={() => navigate('/subscriptions')}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${path === "/subscriptions" ? "text-purple-600 scale-105" : "text-gray-400"
                    }`}
            >
                <Icon name="monitor" size={24} className="text-current" />
                <span className="text-[10px] font-medium">Abonelik</span>
            </button>

            <button
                onClick={() => navigate('/banks')}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${path === "/banks" ? "text-blue-600 scale-105" : "text-gray-400"
                    }`}
            >
                <Icon name="building-2" size={24} className="text-current" />
                <span className="text-[10px] font-medium">Bankalar</span>
            </button>
        </div>
    );
};
