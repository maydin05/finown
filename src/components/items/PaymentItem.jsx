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
        <div className={`group relative p-4 rounded-2xl shadow-sm border mb-3 transition-all hover:shadow-md hover:border-gray-300 ${containerStyle}`}>
            <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4 sm:gap-2">
                
                {/* Left Section: Icon & Info */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`p-3.5 rounded-2xl ${iconStyle} flex-shrink-0 transition-transform group-hover:scale-105`}>
                        {renderIcon()}
                    </div>

                    <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h4 className={`font-bold text-base tracking-tight ${titleColor}`}>
                                {item.title}
                            </h4>
                            {item.isRecurring && (
                                <div className="bg-gray-100 p-1 rounded-md" title="Düzenli Ödeme">
                                    <Icon name="repeat" size={12} className="text-gray-500" />
                                </div>
                            )}
                            {item.needsCardAmount && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCardNeedAmount(item);
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-1 rounded-md hover:bg-amber-100 transition-colors"
                                    title="Bu ayın kredi kartı ödeme miktarını girin!"
                                >
                                    <Icon name="alert-circle" size={12} className="text-amber-600" />
                                    Tutar Bekleniyor
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <p className="text-sm text-gray-500 font-medium">{item.subtitle}</p>
                            {statusBadge && <div className="mt-0.5">{statusBadge}</div>}
                            {item.note && (
                                <p className="text-xs text-gray-400 italic flex items-center gap-1.5 mt-0.5 bg-gray-50 w-fit px-2 py-0.5 rounded border border-gray-100">
                                    <Icon name="file-text" size={10} className="text-gray-400" /> {item.note}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-2">
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${item.isPaid ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'} border ${item.isPaid ? 'border-green-100' : 'border-gray-100'}`}>
                                <Icon name="calendar" size={12} className={item.isPaid ? 'text-green-600' : 'text-gray-500'} />
                                <span>{formatDateTR(itemDate)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Amount & Actions */}
                <div className="flex items-center sm:flex-col sm:items-end justify-between w-full sm:w-auto gap-3 sm:gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    <span className={`text-xl font-bold tracking-tight ${item.isPaid ? "text-gray-400 line-through decoration-gray-300" : "text-gray-900"}`}>
                        ₺{formatMoneyTR(item.amount)}
                    </span>

                    <div className="flex items-center gap-2">
                        {/* Secondary Actions (Edit / Delete) */}
                        {(item.isManual || item.type === 'card' || item.productId || item.isVirtual) && (
                            <div className="flex items-center opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity p-0.5 bg-gray-50 rounded-xl border border-gray-200">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(item);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors shadow-sm hover:shadow"
                                    title="Düzenle"
                                >
                                    <Icon name="edit-2" size={14} className="text-current" />
                                </button>
                                <div className="w-px h-4 bg-gray-200 mx-0.5" />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(item);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors shadow-sm hover:shadow"
                                    title="Sil"
                                >
                                    <Icon name="trash-2" size={14} className="text-current" />
                                </button>
                            </div>
                        )}

                        {/* Primary Action Button */}
                        {(() => {
                            const isZeroAmount = !item.isPaid && Number(item.amount) === 0;
                            
                            let btnStyle = "";
                            let btnText = "";
                            let btnIcon = null;

                            if (item.isPaid) {
                                btnStyle = "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300";
                                btnText = "Geri Al";
                                btnIcon = <Icon name="rotate-ccw" size={14} className="text-current" />;
                            } else if (isZeroAmount) {
                                btnStyle = "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/20 text-[13px] px-3.5"; // smaller typography and padding
                                btnText = "Ödeme Gir";
                                btnIcon = null; // Removed the pen icon
                            } else {
                                btnStyle = "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/30";
                                btnText = "Öde";
                                btnIcon = <Icon name="check-circle" size={14} className="text-current" />;
                            }

                            return (
                                <button
                                    onClick={(e) => {
                                        if (isZeroAmount) {
                                            e.stopPropagation();
                                            onEdit(item);
                                        } else {
                                            onToggle(item);
                                        }
                                    }}
                                    className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all transform active:scale-95 ${btnStyle}`}
                                >
                                    {btnIcon}
                                    {btnText}
                                </button>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};
