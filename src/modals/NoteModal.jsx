import React from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';

export const NoteModal = ({ item, noteText, setNoteText, onClose, onSave }) => {
    return (
        <ModalShell onClose={onClose}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Icon name="sticky-note" size={20} className="text-purple-600" />
                    Notlarım
                </h3>
                <button onClick={onClose}>
                    <Icon name="x" size={24} className="text-gray-400" />
                </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-1">{item?.title}</h4>
                <p className="text-xs text-gray-500">Bu kayıt için uzun notunuzu aşağıya girebilirsiniz.</p>
            </div>

            <textarea
                className="w-full p-4 rounded-xl border border-gray-200 h-32 resize-none text-sm focus:outline-none focus:border-purple-500"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
            />

            <button onClick={onSave} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors mt-4">
                Kaydet
            </button>
        </ModalShell>
    );
};
