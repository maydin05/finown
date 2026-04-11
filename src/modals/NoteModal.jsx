import React from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';

export const NoteModal = ({ item, noteText, setNoteText, onClose, onSave }) => {
    return (
        <ModalShell onClose={onClose}>
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                    <Icon name="sticky-note" size={20} className="text-purple-600" />
                    Notlarım
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2">
                    <Icon name="x" size={20} className="text-gray-500" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl mb-4 border border-gray-200/60 shadow-sm">
                    <h4 className="font-extrabold text-gray-800 mb-1">{item?.title}</h4>
                    <p className="text-xs text-gray-500">Bu kayıt için detaylı notunuzu aşağıya girebilirsiniz.</p>
                </div>

                <div className="flex-1 flex flex-col min-h-[160px]">
                    <textarea
                        className="w-full h-full flex-1 p-4 rounded-xl border border-gray-200 resize-none text-sm text-gray-700 focus:ring-4 focus:ring-purple-50 focus:border-purple-400 transition-all outline-none"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Buraya notunuzu yazın..."
                        autoFocus
                    />
                </div>
            </div>

            {/* Fixed Footer */}
            <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <button
                    onClick={onSave}
                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 shadow-md hover:shadow-lg transition-all"
                >
                    Kaydet
                </button>
            </div>
        </ModalShell>
    );
};
