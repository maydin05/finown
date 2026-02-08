import React from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';
import { formatDateTR } from '../utils';

export const BestCardsModal = ({ bestCards, banks, onClose }) => {
    const today = new Date();
    const todayFormatted = today.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Get the best card (first in the sorted list - longest payment term)
    const topCard = bestCards && bestCards.length > 0 ? bestCards[0] : null;

    // Find the card with the nearest payment date (for quick payment option)
    const nearestPaymentCard = bestCards && bestCards.length > 0
        ? bestCards.reduce((min, curr) => curr.daysToPayment < min.daysToPayment ? curr : min, bestCards[0])
        : null;

    const getBankName = (card) => {
        const bank = banks.find(b => Number(b.id) === Number(card.bankId));
        return bank ? bank.name : "Bilinmeyen Banka";
    };

    return (
        <ModalShell onClose={onClose}>
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Avantajli Kart Onerisi</h3>
                    <p className="text-xs text-gray-500">{todayFormatted}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2"
                >
                    <Icon name="x" size={20} className="text-gray-500" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {topCard ? (
                    <>
                        {/* Top Recommendation - Compact Hero Card */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 mb-4 text-white relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                            <div className="relative z-10">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-medium mb-2">
                                    <span className="text-yellow-300">⭐</span>
                                    <span>En Uzun Vade</span>
                                </div>

                                {/* Card Info - Compact */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/70 text-xs">{getBankName(topCard.card)}</p>
                                        <h4 className="text-lg font-bold leading-tight">{topCard.card.name}</h4>
                                        {topCard.card.last4Digits && (
                                            <p className="text-white/60 text-xs font-mono">**** {topCard.card.last4Digits}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold">{topCard.daysToPayment}</p>
                                        <p className="text-white/70 text-xs">gun vade</p>
                                    </div>
                                </div>

                                {/* Compact Info Row */}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20 text-xs">
                                    <div>
                                        <span className="text-white/60">Kesim: </span>
                                        <span className="font-medium">{topCard.card.cutoffDay}</span>
                                    </div>
                                    <div>
                                        <span className="text-white/60">Son Odeme: </span>
                                        <span className="font-medium">{formatDateTR(topCard.pay)}</span>
                                    </div>
                                    {topCard.isNextPeriod && (
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                            <span className="text-green-300">Gelecek ay</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Nearest Payment Card - Highlighted if different from top card */}
                        {nearestPaymentCard && nearestPaymentCard.card.id !== topCard.card.id && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                        <Icon name="clock" size={16} className="text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-amber-700 font-medium">En Yakin Odeme</p>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {getBankName(nearestPaymentCard.card)} - {nearestPaymentCard.card.name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-amber-600">{nearestPaymentCard.daysToPayment}</p>
                                        <p className="text-[10px] text-amber-500">gun</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* All Cards List */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">
                                Tum Kartlar ({bestCards.length})
                            </p>

                            {bestCards.map((x, i) => {
                                const isTop = i === 0;
                                const isNearest = nearestPaymentCard && x.card.id === nearestPaymentCard.card.id && !isTop;

                                return (
                                    <div
                                        key={`${x.card.id}-${i}`}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
                                            ${isTop ? 'bg-emerald-50 border-emerald-200' :
                                                isNearest ? 'bg-amber-50 border-amber-200' :
                                                    'bg-gray-50 border-gray-100 hover:border-gray-200'}`}
                                    >
                                        {/* Rank */}
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs
                                            ${isTop ? 'bg-emerald-500 text-white' :
                                                isNearest ? 'bg-amber-500 text-white' :
                                                    'bg-gray-200 text-gray-600'}`}
                                        >
                                            {i + 1}
                                        </div>

                                        {/* Card Details */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 text-sm truncate">
                                                {getBankName(x.card)} - {x.card.name}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                Kesim: {x.card.cutoffDay} • Odeme: {x.card.paymentDueDay}
                                                {x.isNextPeriod && <span className="text-emerald-600 ml-1">• Gelecek ay</span>}
                                            </p>
                                        </div>

                                        {/* Days Badge */}
                                        <div className="text-right flex-shrink-0">
                                            <p className={`text-lg font-bold ${isTop ? 'text-emerald-600' : isNearest ? 'text-amber-600' : 'text-gray-700'}`}>
                                                {x.daysToPayment}
                                            </p>
                                            <p className="text-[9px] text-gray-400 uppercase">gun</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Info Box */}
                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
                            <div className="flex gap-2">
                                <Icon name="info" size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-blue-600">
                                    <b>Ipucu:</b> Kesim tarihi gecmis kartlar en avantajlidir cunku harcama gelecek ayin ekstresine girer.
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div className="text-center py-8">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Icon name="credit-card" size={28} className="text-gray-400" />
                        </div>
                        <h4 className="font-semibold text-gray-700 mb-2">Kart Bulunamadi</h4>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            Avantaj hesabi icin kartlarinizda <b>Kesim Gunu</b> ve{" "}
                            <b>Son Odeme Gunu</b> bilgilerinin dolu olmasi gerekiyor.
                        </p>
                    </div>
                )}
            </div>

            {/* Fixed Footer - Close Button for Mobile */}
            <div className="p-4 border-t border-gray-100 flex-shrink-0 sm:hidden">
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                    Kapat
                </button>
            </div>
        </ModalShell>
    );
};
