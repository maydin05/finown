import React from 'react';
import { Icon } from '../ui/Icon';
import { formatDateTR, formatMoneyTR } from '../../utils';

export const IncomeItem = ({ item, onToggle, onEdit, onDelete, onOpenNote }) => {
    const isReceived = item.isReceived;

    return (
        <div
            className={`group relative p-4 rounded-xl shadow-sm border mb-3 transition-all ${isReceived ? "border-teal-100 bg-teal-50/30" : "border-gray-100 bg-white"
                }`}
        >
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-gray-100 z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                    <Icon name="edit-2" size={12} className="text-blue-600" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item);
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                    <Icon name="trash-2" size={12} className="text-red-600" />
                </button>
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isReceived ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-600"}`}>
                        {item.category === "salary" && <Icon name="briefcase" size={20} className="text-current" />}
                        {item.category === "freelance" && <Icon name="globe" size={20} className="text-current" />}
                        {!item.category && <Icon name="banknote" size={20} className="text-current" />}
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-800">{item.title}</h4>
                            {item.isRecurring && <Icon name="repeat" size={10} className="text-gray-400" />}
                        </div>

                        {item.note && (
                            <p className="text-[10px] text-gray-400 italic flex items-center gap-1 mt-1">
                                <Icon name="file-text" size={10} className="text-gray-400" /> {item.note}
                            </p>
                        )}

                        <div className="flex items-center gap-1 mt-1">
                            <Icon name="calendar" size={10} className="text-teal-600" />
                            <span className="text-xs font-medium text-teal-600">{formatDateTR(new Date(item.date))}</span>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenNote(item);
                            }}
                            className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full hover:bg-teal-100"
                        >
                            <Icon name="sticky-note" size={12} className="text-teal-700" />
                            Notlarım
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className={`font-bold ${isReceived ? "text-teal-700" : "text-gray-900"}`}>+₺{formatMoneyTR(item.amount)}</span>
                    <button
                        onClick={() => onToggle(item)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${isReceived ? "bg-teal-100 text-teal-700 hover:bg-teal-200" : "bg-gray-900 text-white hover:bg-black shadow-md"
                            }`}
                    >
                        {isReceived ? (
                            <>
                                <Icon name="check-circle" size={12} className="text-current" /> Alındı
                            </>
                        ) : (
                            <>
                                <Icon name="arrow-down-left" size={12} className="text-current" /> Tahsil Et
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
