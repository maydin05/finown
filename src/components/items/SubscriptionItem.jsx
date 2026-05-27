import React from 'react';
import { Icon } from '../ui/Icon';
import { formatDateTR, formatMoneyTR, getDaysDifference } from '../../utils';

export const SubscriptionItem = ({ 
    item, 
    onOpenNote, 
    onEdit, 
    onDelete, 
    onTogglePaid, 
    onOpenPaymentEntry,
    banks, 
    products 
}) => {
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

    const t = (item.title || "").toLowerCase();
    let iconName = 'monitor';
    let iconColor = 'text-purple-600';
    let iconBg = 'bg-purple-100';

    if (t.includes('netflix') || t.includes('exxen') || t.includes('blutv') || t.includes('disney') || t.includes('amazon') || t.includes('prime') || t.includes('youtube')) {
        iconName = 'tv';
        iconColor = 'text-red-500';
        iconBg = 'bg-red-50';
    } else if (t.includes('spotify') || t.includes('apple music') || t.includes('pandora')) {
        iconName = 'music';
        iconColor = 'text-green-600';
        iconBg = 'bg-green-50';
    } else if (t.includes('google') || t.includes('icloud') || t.includes('onedrive') || t.includes('dropbox') || t.includes('cloud')) {
        iconName = 'cloud';
        iconColor = 'text-blue-500';
        iconBg = 'bg-blue-50';
    } else if (t.includes('spor') || t.includes('gym') || t.includes('macfit')) {
        iconName = 'activity';
        iconColor = 'text-orange-500';
        iconBg = 'bg-orange-50';
    } else if (t.includes('internet') || t.includes('turkcell') || t.includes('vodafone') || t.includes('telekom') || t.includes('fatura') || t.includes('elektrik') || t.includes('su') || t.includes('gaz')) {
        iconName = 'wifi';
        iconColor = 'text-indigo-500';
        iconBg = 'bg-indigo-50';
    }

    // Specific icons for water, electric, gas bills if possible
    if (t.includes('elektrik') || t.includes('enerji')) {
        iconName = 'zap';
        iconColor = 'text-yellow-600';
        iconBg = 'bg-yellow-50';
    } else if (t.includes('su') || t.includes('iski') || t.includes('maski') || t.includes('aski')) {
        iconName = 'droplet';
        iconColor = 'text-cyan-500';
        iconBg = 'bg-cyan-50';
    } else if (t.includes('gaz') || t.includes('igdaş') || t.includes('doğalgaz')) {
        iconName = 'flame';
        iconColor = 'text-orange-600';
        iconBg = 'bg-orange-50';
    }

    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);
    const itemDate = new Date(item.dueDate);
    itemDate.setHours(0,0,0,0);
    const diffDays = getDaysDifference(itemDate, todayDate);

    let badgeText = "";
    let badgeClass = "";

    if (diffDays > 0) {
        badgeText = `${diffDays} gün kaldı`;
        badgeClass = "bg-blue-50 text-blue-600 border border-blue-100";
    } else if (diffDays === 0) {
        badgeText = "Bugün";
        badgeClass = "bg-amber-50 text-amber-600 border border-amber-200 animate-pulse";
    } else {
        badgeText = `${Math.abs(diffDays)} gün geçti`;
        badgeClass = "bg-red-50 text-red-600 border border-red-200";
    }

    if (item.isPaid) {
        badgeText = "Ödendi";
        badgeClass = "bg-emerald-50 text-emerald-600 border border-emerald-200";
    }

    const handlePayClick = (e) => {
        e.stopPropagation();
        if (item.isVariable && !item.isPaid) {
            onOpenPaymentEntry(item);
        } else {
            onTogglePaid();
        }
    };

    const displayAmount = item.isPaid && item.actualAmount !== null && item.actualAmount !== undefined
        ? item.actualAmount 
        : (item.expectedAmount || item.amount || 0);

    const diff = item.isPaid && item.actualAmount !== null && item.actualAmount !== undefined
        ? Number(item.actualAmount) - Number(item.expectedAmount || item.amount || 0)
        : 0;

    return (
        <div className={`group relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border ${item.isPaid ? 'border-emerald-100 bg-emerald-50/40 opacity-80' : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-md'} mb-4 transition-all flex flex-col justify-between gap-3 sm:gap-4 overflow-hidden`}>
            
            {/* Hover Options */}
            <div className={`absolute top-3 right-3 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-1 border border-gray-100 z-10 ${item.isPaid ? 'hidden sm:flex' : ''}`}>
                <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Düzenle">
                    <Icon name="edit-2" size={13} className="text-current" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="w-7 h-7 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Sil">
                    <Icon name="trash-2" size={13} className="text-current" />
                </button>
            </div>

            <div className="flex gap-3 items-start w-full min-w-0 pr-8 sm:pr-12">
                {/* Paid Checkbox */}
                <button 
                    onClick={handlePayClick} 
                    className={`w-5 h-5 shrink-0 mt-2 sm:mt-1.5 rounded border-[1.5px] flex items-center justify-center transition-all ${item.isPaid ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'border-gray-300 hover:border-purple-400 bg-gray-50'}`}
                    title={item.isPaid ? "Ödemeyi Geri Al" : (item.isVariable ? "Tutar Gir ve Öde" : "Ödendi İşaretle")}
                >
                    {item.isPaid && <Icon name="check" size={12} className="text-white" />}
                </button>

                {/* Main Content */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${iconBg}`}>
                        <Icon name={iconName} size={20} className={iconColor} />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className={`font-extrabold text-sm sm:text-base line-clamp-1 ${item.isPaid ? 'text-gray-500 line-through decoration-1 decoration-gray-400' : 'text-gray-900'}`}>{item.title}</h4>
                            
                            {/* Variable Badge */}
                            {item.isVariable && (
                                <span className="bg-purple-50 text-purple-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-purple-100 flex items-center gap-0.5 shrink-0 uppercase tracking-wider">
                                    <Icon name="bar-chart-2" size={9} /> Fatura
                                </span>
                            )}
                            
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${badgeClass} whitespace-nowrap`}>
                                {badgeText}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-500 font-medium flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ${paymentMethodType === 'bank' && bankObj ? 'bg-gradient-to-r ' + bankObj.color + ' text-white font-bold' : 'bg-gray-100 text-gray-600'}`}>
                                {paymentMethodType === 'bank' ? <Icon name="landmark" size={10} /> : <Icon name="shopping-cart" size={10} />}
                                <span className="truncate max-w-[100px] sm:max-w-[150px]">{paymentDisplay}</span>
                            </span>
                            <span className="flex items-center gap-1 text-gray-500 shrink-0">
                                <Icon name="calendar" size={11} className="text-purple-400" />
                                {formatDateTR(item.dueDate)}
                            </span>
                            {item.isRecurring && (
                                <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded shrink-0">
                                    <Icon name="repeat" size={9} /> Tekrar
                                </span>
                            )}
                        </div>

                        {item.note && (
                            <p className="text-[10px] text-gray-400 italic line-clamp-1 mt-1 flex items-center gap-1 px-1 border-l-2 border-gray-100">
                                <Icon name="file-text" size={10} className="shrink-0 text-gray-300" /> "{item.note}"
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Amount & Notes Button */}
            <div className="flex flex-row items-center justify-between mt-1 pt-3 border-t border-dashed border-gray-100 sm:mt-0 sm:pt-4 sm:border-solid">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenNote(item);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-purple-600 border border-transparent hover:border-purple-100"
                >
                    <Icon name="sticky-note" size={12} /> Notlarım
                </button>

                <div className="text-right flex items-center gap-3">
                    {/* Expected vs Actual Diff badge for variable bill */}
                    {item.isVariable && item.isPaid && diff !== 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 border ${
                            diff > 0 
                                ? 'bg-red-50 text-red-600 border-red-100' 
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                            {diff > 0 ? '+' : ''}₺{formatMoneyTR(diff)}
                        </span>
                    )}

                    {/* Unpaid Variable Fatura Action */}
                    {item.isVariable && !item.isPaid ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-bold block sm:inline-block">
                                BEKLENEN: ₺{formatMoneyTR(item.expectedAmount || item.amount)}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); onOpenPaymentEntry(item); }}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm shadow-amber-200 flex items-center gap-1"
                            >
                                <Icon name="credit-card" size={12} /> Tutar Gir & Öde
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest hidden sm:block">
                                {item.isVariable ? "Ödenen" : "Tutar"}
                            </p>
                            <span className={`font-black tracking-tight ${item.isPaid ? 'text-gray-400 line-through decoration-emerald-500 decoration-2 text-lg sm:text-xl' : 'text-gray-900 text-xl sm:text-2xl'}`}>
                                ₺{formatMoneyTR(displayAmount)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
