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

    // Get the best card (first in the sorted list)
    const topCard = bestCards && bestCards.length > 0 ? bestCards[0] : null;

    return (
        <ModalShell onClose={onClose}>
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Avantajli Kart Onerisi</h3>
                    <p className="text-xs text-gray-500 mt-1">Bugun: {todayFormatted}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <Icon name="x" size={20} className="text-gray-400" />
                </button>
            </div>

            {topCard ? (
                <>
                    {/* Top Recommendation - Hero Card */}
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 mb-4 text-white relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium mb-3">
                                <span className="text-yellow-300">⭐</span>
                                <span>En Avantajli</span>
                            </div>

                            {/* Card Info */}
                            <div className="mb-4">
                                {(() => {
                                    const bank = banks.find(b => Number(b.id) === Number(topCard.card.bankId));
                                    const bankName = bank ? bank.name : "Bilinmeyen Banka";
                                    return (
                                        <>
                                            <p className="text-white/70 text-sm">{bankName}</p>
                                            <h4 className="text-2xl font-bold">{topCard.card.name}</h4>
                                            {topCard.card.last4Digits && (
                                                <p className="text-white/60 text-sm font-mono mt-1">**** {topCard.card.last4Digits}</p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                                    <p className="text-white/70 text-[10px] uppercase tracking-wider">Vade Suresi</p>
                                    <p className="text-2xl font-bold">{topCard.daysToPayment}</p>
                                    <p className="text-white/60 text-xs">gun</p>
                                </div>
                                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                                    <p className="text-white/70 text-[10px] uppercase tracking-wider">Son Odeme</p>
                                    <p className="text-lg font-bold">{formatDateTR(topCard.pay)}</p>
                                </div>
                            </div>

                            {/* Status Indicator */}
                            {topCard.isNextPeriod && (
                                <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <p className="text-xs text-white/80">
                                        Kesim tarihi gecti - harcama gelecek doneme kayar
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Other Cards List */}
                    {bestCards.length > 1 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">
                                Diger Secenekler
                            </p>

                            {bestCards.slice(1).map((x, i) => {
                                const bank = banks.find(b => Number(b.id) === Number(x.card.bankId));
                                const bankName = bank ? bank.name : "Bilinmeyen Banka";

                                return (
                                    <div
                                        key={`${x.card.id}-${i}`}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                                    >
                                        {/* Rank */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                            ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'}`}
                                        >
                                            {i + 2}
                                        </div>

                                        {/* Card Details */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 text-sm truncate">
                                                {bankName} - {x.card.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Kesim: {x.card.cutoffDay} • Odeme: {x.card.paymentDueDay}
                                            </p>
                                        </div>

                                        {/* Days Badge */}
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-700">{x.daysToPayment}</p>
                                            <p className="text-[10px] text-gray-400 uppercase">gun</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <div className="flex gap-2">
                            <Icon name="info" size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-blue-700">
                                <p className="font-medium mb-1">Nasil Hesaplaniyor?</p>
                                <p className="text-blue-600">
                                    Kesim tarihi gecmis kartlar en avantajlidir cunku
                                    harcama gelecek ayin ekstresine girer ve odeme suresi uzar.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* Empty State */
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="credit-card" size={32} className="text-gray-400" />
                    </div>
                    <h4 className="font-semibold text-gray-700 mb-2">Kart Bulunamadi</h4>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        Avantaj hesabi icin kartlarinizda <b>Kesim Gunu</b> ve{" "}
                        <b>Son Odeme Gunu</b> bilgilerinin dolu olmasi gerekiyor.
                    </p>
                </div>
            )}
        </ModalShell>
    );
};
