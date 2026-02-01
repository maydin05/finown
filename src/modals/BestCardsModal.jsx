import React from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';
import { formatDateTR } from '../utils';

export const BestCardsModal = ({ bestCards, banks, onClose }) => {
    return (
        <ModalShell onClose={onClose}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Kart Avantajı Detayları</h3>
                <button onClick={onClose}>
                    <Icon name="x" size={24} className="text-gray-400" />
                </button>
            </div>

            <div className="space-y-4">
                {(bestCards || []).map((x, i) => {
                    const bank = banks.find(b => Number(b.id) === Number(x.card.bankId));
                    const bankName = bank ? bank.name : "Bilinmeyen Banka";
                    const cardLabel = `${bankName} - ${x.card.name}${x.card.last4Digits ? ` (**** ${x.card.last4Digits})` : ""}`;

                    return (
                        <div key={`${x.card.id}-${i}`} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-blue-600">
                                {i + 1}.
                            </div>
                            <div className="text-sm text-gray-700 leading-6">
                                Bugün <b>{cardLabel}</b> kartını kullanırsanız, ödemenizi{" "}
                                <b>{x.daysToPayment} gün sonra</b> yapacaksınız.
                                <div className="text-[11px] text-gray-500 mt-1">
                                    Kesim: <b>{formatDateTR(x.cutoff)}</b> • Ödeme: <b>{formatDateTR(x.pay)}</b>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {(!bestCards || bestCards.length === 0) && (
                    <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 p-3 rounded-xl">
                        Avantaj hesabı için kartlarda <b>Kesim Günü</b> ve <b>Son Ödeme Günü</b> dolu olmalı.
                    </div>
                )}
            </div>
        </ModalShell>
    );
};
