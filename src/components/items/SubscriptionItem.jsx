import React from 'react';
import { Icon } from '../ui/Icon';
import { formatDateTR, formatMoneyTR } from '../../utils';

export const SubscriptionItem = ({ item, onOpenNote, onEdit, onDelete, banks, products }) => {
    // Support both nested paymentMethod object (legacy) and flat fields (from DB)
    const paymentMethodType = item.paymentMethod?.type || item.paymentMethodType;
    const paymentMethodValue = item.paymentMethod?.value || item.paymentMethodValue;

    let paymentDisplay = paymentMethodValue || "Diğer";
    let bankObj = null;

    if (paymentMethodType === "bank") {
        bankObj = banks?.find((b) => String(b.id) === String(paymentMethodValue));
        const bankName = bankObj ? bankObj.name : "Bilinmeyen Banka";

        let cardDisplay = "";
        if (item.relatedCardId) {
            const card = products?.find((p) => String(p.id) === String(item.relatedCardId));
            if (card && card.last4Digits) cardDisplay = ` - **** ${card.last4Digits}`;
        }
        paymentDisplay = `${bankName}${cardDisplay}`;
    }

    return (
        <div className="group relative p-4 rounded-xl shadow-sm border border-gray-100 bg-white mb-3 transition-all hover:border-purple-200">
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
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                        <Icon name="monitor" size={20} className="text-purple-600" />
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-800">{item.title}</h4>
                            {item.isRecurring && <Icon name="repeat" size={10} className="text-gray-400" />}
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                            <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 w-fit ${paymentMethodType === "bank" && bankObj
                                    ? `bg-gradient-to-r ${bankObj.color} text-white`
                                    : "bg-gray-100 text-gray-500"
                                    }`}
                            >
                                {paymentMethodType === "bank" ? (
                                    <Icon name="landmark" size={10} className="text-current" />
                                ) : (
                                    <Icon name="shopping-cart" size={10} className="text-current" />
                                )}
                                {paymentDisplay}
                            </span>

                            {item.note && (
                                <p className="text-[10px] text-gray-400 italic flex items-center gap-1 line-clamp-1">
                                    <Icon name="file-text" size={10} className="text-gray-400" /> {item.note}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-1 mt-1">
                            <Icon name="calendar" size={10} className="text-purple-600" />
                            <span className="text-xs font-medium text-purple-600">{formatDateTR(new Date(item.dueDate))}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-gray-900">₺{formatMoneyTR(item.amount)}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenNote(item);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100"
                    >
                        <Icon name="sticky-note" size={12} className="text-purple-600" /> Notlarım
                    </button>
                </div>
            </div>
        </div>
    );
};
