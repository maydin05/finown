import React from 'react';
import { supabase } from '../../lib/supabase';
import { Icon } from '../ui/Icon';

export const Header = () => {
    return (
        <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
            <span className="font-bold text-lg text-blue-600 tracking-tight">FinOwn</span>
            <button
                onClick={() => supabase.auth.signOut()}
                className="text-gray-400 hover:text-red-500 transition-colors"
            >
                <Icon name="log-out" size={20} className="text-gray-400" />
            </button>
        </div>
    );
};
