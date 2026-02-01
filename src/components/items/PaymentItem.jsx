import React from 'react';
import { Icon } from '../ui/Icon';
import { getDaysDifference, formatDateTR, formatMoneyTR } from '../../utils';

export const PaymentItem = ({ item, onToggle, onEdit, onDelete, onCardNeedAmount }) => {
    const today = new Date();
    const itemDate = new Date(item.dueDate);
    const daysDiff = getDaysDifference(itemDate, today);

    const isOverdue = !item.isPaid && daysDiff < 0;
    const isApproaching = !item.isPaid && daysDiff >= 0 && daysDiff <= 3;

    let containerStyle = "border-gray-100 bg-white";
    let iconStyle = "bg-gray-100 text-gray-600";
    let titleColor = "text-gray-800";
    let dateColor = "text-blue-600";
    let statusBadge = null;

    if (isOverdue) {
        containerStyle = "border-red-200 bg-red-50/40";
        iconStyle = "bg-red-100 text-red-600";
        titleColor = "text-red-700";
        dateColor = "text-red-600";
        statusBadge = (
            <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                <Icon name="alert-triangle" size={10} className="text-red-600" /> Gecikmiş
            </span>
        );
    } else if (isApproaching) {
        containerStyle = "border-orange-200 bg-orange-50/40";
        iconStyle = "bg-orange-100 text-orange-600";
        titleColor = "text-gray-900";
        dateColor = "text-orange-600";
        statusBadge = (
            <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1">
                <Icon name="clock" size={10} className="text-orange-600" />
                {daysDiff === 0 ? "Bugün" : `${daysDiff} Gün Kaldı`}
            </span>
        );
    } else if (item.isPaid) {
        containerStyle = "border-green-100 bg-green-50/20 opacity-75";
        iconStyle = "bg-green-100 text-green-600";
        titleColor = "text-gray-600";
        dateColor = "text-green-600";
    }

    const renderIcon = () => {
        if (item.type === "card") return <Icon name="credit-card" size={20} className="text-current" />;
        if (item.type === "loan") return <Icon name="pie-chart" size={20} className="text-current" />;
        if (item.category === "rent") return <Icon name="home" size={20} className="text-current" />;
        if (item.category === "bills") return <Icon name="zap" size={20} className="text-current" />;
        if (item.category === "market") return <Icon name="shopping-cart" size={20} className="text-current" />;
        return <Icon name="banknote" size={20} className="text-current" />;
    };

    return (
        <div className={`group relative p-4 rounded-xl shadow-sm border mb-3 transition-all ${containerStyle}`}>
            {(item.isManual || item.type === 'card' || item.productId || item.isVirtual) && (
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
            )}

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${iconStyle}`}>{renderIcon()}</div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className={`font-bold text-sm ${titleColor}`}>{item.title}</h4>
                            {item.isRecurring && <Icon name="repeat" size={10} className="text-gray-400" />}
                            {item.needsCardAmount && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCardNeedAmount(item);
                                    }}
                                    className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full hover:bg-amber-100"
                                    title="Bu ayın kredi kartı ödeme miktarını girin!"
                                >
                                    <Icon name="info" size={12} className="text-amber-700" />
                                    Kart Tutarı Gir
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <p className="text-xs text-gray-500">{item.subtitle}</p>
                            {statusBadge && <div className="mt-1">{statusBadge}</div>}
                            {item.note && (
                                <p className="text-[10px] text-gray-400 italic flex items-center gap-1 mt-1">
                                    <Icon name="file-text" size={10} className="text-gray-400" /> {item.note}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-1 mt-1">
                            <Icon name="calendar" size={10} className={dateColor} />
                            <span className={`text-xs font-medium ${dateColor}`}>{formatDateTR(itemDate)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className={`font-bold ${item.isPaid ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        ₺{formatMoneyTR(item.amount)}
                    </span>
                    {(() => {
                        const isZeroAmount = !item.isPaid && Number(item.amount) === 0;
                        const buttonClass = item.isPaid
                            ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            : isZeroAmount
                                ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-200"
                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200";

                        return (
                            <button
                                onClick={() => onToggle(item)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${buttonClass}`}
                            >
                                {item.isPaid ? (
                                    <>
                                        <Icon name="arrow-up-right" size={12} className="text-current" /> Geri Al
                                    </>
                                ) : isZeroAmount ? (
                                    <>
                                        <Icon name="edit-2" size={12} className="text-current" /> Ödeme Gir
                                    </>
                                ) : (
                                    <>
                                        <Icon name="check-circle" size={12} className="text-current" /> Öde
                                    </>
                                )}
                            </button>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};
