import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Icon } from '../components/ui/Icon';
import { formatMoneyTR, getDaysDifference } from '../utils';

// Static cash debt in USD (elden borç)
const CASH_DEBT_USD = 5000;

export default function Banks({ onOpenModal }) {
    const { banks, products, payments } = useData();
    const [selectedBank, setSelectedBank] = useState(null);
    const [usdRate, setUsdRate] = useState(36.50); // Default fallback rate

    // Fetch current USD/TRY exchange rate
    useEffect(() => {
        const fetchRate = async () => {
            try {
                // Using free exchange rate API
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const data = await res.json();
                if (data?.rates?.TRY) {
                    setUsdRate(data.rates.TRY);
                }
            } catch (error) {
                console.log('Could not fetch exchange rate, using default');
            }
        };
        fetchRate();
    }, []);

    // Calculate remaining loan debt based on unpaid installments
    const getLoanRemaining = (loan) => {
        // Get all installment payments for this loan
        const loanPayments = (payments || []).filter(
            (p) => p.type === "loan" && String(p.productId) === String(loan.id)
        );

        // If there are actual payment records, sum the unpaid ones
        if (loanPayments.length > 0) {
            return loanPayments
                .filter(p => !p.isPaid)
                .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        }

        // Fallback: calculate from product data if no payment records exist
        const paidCount = loanPayments.filter(p => p.isPaid).length;
        const total = Number(loan.installmentAmount || 0) * Number(loan.totalInstallments || 0);
        const remaining = total - paidCount * Number(loan.installmentAmount || 0);
        return Math.max(0, remaining);
    };

    const getBestCards = () => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);

        const cards = (products || []).filter(p => p.type === "card" && Number(p.cutoffDay) > 0 && Number(p.paymentDueDay) > 0);

        const calc = (card) => {
            const cutoffDay = Number(card.cutoffDay);
            const dueDay = Number(card.paymentDueDay);

            // next cutoff
            const y = t.getFullYear();
            const m = t.getMonth();

            let cutoff = new Date(y, m, cutoffDay);
            cutoff.setHours(0, 0, 0, 0);
            if (cutoff < t) {
                cutoff = new Date(y, m + 1, cutoffDay);
                cutoff.setHours(0, 0, 0, 0);
            }

            // payment = cutoff’tan sonraki ayın dueDay’i
            const pay = new Date(cutoff.getFullYear(), cutoff.getMonth() + 1, dueDay);
            pay.setHours(0, 0, 0, 0);

            const daysToCutoff = getDaysDifference(cutoff, t);   // cutoff - today
            const daysToPayment = getDaysDifference(pay, t);     // payment - today

            return { card, cutoff, pay, daysToCutoff, daysToPayment };
        };

        const ranked = cards.map(calc)
            .sort((a, b) => {
                if (a.daysToCutoff !== b.daysToCutoff) return a.daysToCutoff - b.daysToCutoff; // küçük iyi
                return b.daysToPayment - a.daysToPayment; // büyük iyi
            });

        return ranked.slice(0, 3);
    };

    const handleBestCards = () => {
        const best = getBestCards();
        onOpenModal("best_cards", best); // bestCards will be passed as payload
    };

    // Calculate Global Totals
    let globalCardLimit = 0;
    let globalLoanDebt = 0;

    (products || []).forEach((p) => {
        if (p.type === "card") globalCardLimit += Number(p.limit || 0);
        if (p.type === "loan") globalLoanDebt += getLoanRemaining(p);
    });

    if (selectedBank) {
        const bankProducts = products.filter((p) => String(p.bankId) === String(selectedBank.id));
        const cards = bankProducts.filter((p) => p.type === "card");
        const loans = bankProducts.filter((p) => p.type === "loan");

        return (
            <div className="pb-24 pt-4">
                <div className="flex items-center gap-2 mb-6 px-1">
                    <button
                        onClick={() => setSelectedBank(null)}
                        className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                        <Icon name="chevron-left" size={20} className="text-gray-600" />
                    </button>

                    <h2 className="text-xl font-bold text-gray-800 flex-1">{selectedBank.name}</h2>

                    <button
                        onClick={() => onOpenModal("bank", selectedBank)}
                        className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                        title="Bankayı Düzenle"
                    >
                        <Icon name="edit-2" size={18} className="text-current" />
                    </button>

                    <button
                        onClick={() => onOpenModal("delete_bank", selectedBank)}
                        className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-red-600"
                        title="Bankayı Sil"
                    >
                        <Icon name="trash-2" size={18} className="text-current" />
                    </button>
                </div>

                <div className={`w-full h-24 rounded-2xl bg-gradient-to-r ${selectedBank.color} mb-6 flex items-center px-6 shadow-lg relative overflow-hidden`}>
                    <div className="text-white/20 w-24 h-24 absolute -right-2 -bottom-4">
                        <Icon name="building-2" size={96} className="text-white/20" />
                    </div>
                    <div className="text-white z-10">
                        <p className="text-white/80 text-xs">Toplam Ürün</p>
                        <p className="text-2xl font-bold">{bankProducts.length}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-3 text-sm px-1">
                        <Icon name="credit-card" size={16} className="text-gray-700" /> Kredi Kartları
                    </h3>
                    {cards.map((card) => (
                        <div key={card.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-2 relative overflow-hidden">
                            <div className={`absolute top-0 right-0 px-2 py-0.5 text-[9px] font-bold text-white rounded-bl-lg ${card.cardType === "virtual" ? "bg-purple-500" : "bg-gray-600"}`}>
                                {card.cardType === "virtual" ? "SANAL" : "FİZİKİ"}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-800 text-sm">{card.name}</p>
                                        <span className="text-xs text-gray-400 font-mono">**** {card.last4Digits}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onOpenModal("product", card); }} // Edit product
                                            className="ml-2 p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <Icon name="edit-2" size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onOpenModal("delete_product", card); }} // Edit product
                                            className="ml-1 p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Icon name="trash-2" size={12} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Kesim: {card.cutoffDay} / Son Ödeme: {card.paymentDueDay}</p>
                                    {card.cardType === "virtual" && (
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Bağlı Kart:{" "}
                                            <b>
                                                {(() => {
                                                    const parent = (products || []).find(
                                                        (p) => p.type === "card" && String(p.id) === String(card.parentCardId)
                                                    );
                                                    return parent ? `${parent.name} (**** ${parent.last4Digits})` : "Seçilmedi";
                                                })()}
                                            </b>
                                        </p>
                                    )}
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-[10px] text-gray-500">Limit</p>
                                    <p className="font-bold text-gray-800 text-sm mb-1">₺{formatMoneyTR(card.limit)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {cards.length === 0 && <p className="text-xs text-gray-400 italic px-2">Kart bulunamadı.</p>}
                </div>

                <div>
                    <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-3 text-sm px-1">
                        <Icon name="pie-chart" size={16} className="text-gray-700" /> Krediler
                    </h3>
                    {loans.map((loan) => (
                        <div key={loan.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-2 relative group">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 p-1 rounded border border-gray-100">
                                <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" onClick={(e) => { e.stopPropagation(); onOpenModal("product", loan); }}>
                                    <Icon name="edit-2" size={12} />
                                </button>
                                <button className="p-1 text-red-600 hover:bg-red-50 rounded" onClick={(e) => { e.stopPropagation(); onOpenModal("delete_product", loan); }}>
                                    <Icon name="trash-2" size={12} />
                                </button>
                            </div>
                            <div className="flex justify-between mb-1">
                                <p className="font-bold text-gray-800 text-sm">{loan.name}</p>
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Aktif</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500">
                                <span>{loan.totalInstallments} Taksit</span>
                                <span>₺{formatMoneyTR(loan.installmentAmount)}/ay</span>
                            </div>
                        </div>
                    ))}
                    {loans.length === 0 && <p className="text-xs text-gray-400 italic px-2">Kredi bulunamadı.</p>}
                </div>
            </div>
        );
    }

    // Main Banks View
    // Calculate cash debt in TL
    const cashDebtTL = CASH_DEBT_USD * usdRate;
    const totalDebt = globalLoanDebt + cashDebtTL;

    return (
        <div className="pb-24 pt-4 space-y-4">
            <div className="bg-gray-900 text-white p-6 rounded-b-3xl shadow-lg -mx-4 -mt-4 pt-8 relative overflow-hidden mb-6">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-4">Varlıklar & Borçlar</h2>

                    {/* 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Card Limit */}
                        <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/5">
                            <p className="text-gray-300 text-[10px] uppercase tracking-wider mb-1">Top. Kart Limiti</p>
                            <p className="font-bold text-lg">₺{formatMoneyTR(globalCardLimit)}</p>
                        </div>

                        {/* Loan Debt */}
                        <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-orange-500/30">
                            <p className="text-orange-300 text-[10px] uppercase tracking-wider mb-1">Kredi Borcu</p>
                            <p className="font-bold text-lg text-orange-200">₺{formatMoneyTR(globalLoanDebt)}</p>
                        </div>

                        {/* Cash Debt (USD) */}
                        <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-blue-500/30">
                            <p className="text-blue-300 text-[10px] uppercase tracking-wider mb-1">Elden Borç (USD)</p>
                            <p className="font-bold text-lg text-blue-200">${CASH_DEBT_USD.toLocaleString('en-US')}</p>
                            <p className="text-[10px] text-gray-400">≈ ₺{formatMoneyTR(cashDebtTL)}</p>
                        </div>

                        {/* Total Debt */}
                        <div className="bg-gradient-to-br from-red-600/30 to-red-800/30 p-3 rounded-xl backdrop-blur-sm border border-red-500/30">
                            <p className="text-red-200 text-[10px] uppercase tracking-wider mb-1">Toplam Borç</p>
                            <p className="font-bold text-lg text-white">₺{formatMoneyTR(totalDebt)}</p>
                        </div>
                    </div>

                    {/* Exchange rate info */}
                    <p className="text-[9px] text-gray-500 text-center mt-2">1 USD = ₺{usdRate.toFixed(2)}</p>
                </div>
            </div>

            <div className="px-1 flex items-center justify-between gap-2">
                <h3 className="font-bold text-gray-800 mb-2">Bankalar</h3>

                <div className="flex gap-2">
                    <button
                        onClick={handleBestCards}
                        className="text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-100"
                        title="Bugün hangi kart daha avantajlı?"
                    >
                        ⭐ Avantajlı Kartlar
                    </button>

                    <button
                        onClick={() => onOpenModal("bank", null)}
                        className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100"
                    >
                        + Banka
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {banks.map((bank) => {
                    const bankProducts = products.filter((p) => String(p.bankId) === String(bank.id));
                    const bankCardLimit = bankProducts.filter((p) => p.type === "card").reduce((acc, curr) => acc + Number(curr.limit || 0), 0);
                    const bankLoanDebt = bankProducts
                        .filter((p) => p.type === "loan")
                        .reduce((acc, curr) => acc + getLoanRemaining(curr), 0);

                    return (
                        <div
                            key={bank.id}
                            onClick={() => setSelectedBank(bank)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 group hover:border-blue-200 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bank.color} flex items-center justify-center text-white shadow-sm`}>
                                    <Icon name="building-2" size={20} className="text-white" />
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800">{bank.name}</h3>
                                    <p className="text-xs text-gray-400">{bankProducts.length} Ürün</p>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenModal("bank", bank);
                                    }}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600"
                                    title="Bankayı Düzenle"
                                >
                                    <Icon name="edit-2" size={16} className="text-current" />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenModal("delete_bank", bank);
                                    }}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-red-600"
                                    title="Bankayı Sil"
                                >
                                    <Icon name="trash-2" size={16} className="text-current" />
                                </button>

                                <Icon name="chevron-right" size={18} className="text-gray-300 group-hover:text-blue-500" />
                            </div>

                            {(bankCardLimit > 0 || bankLoanDebt > 0) && (
                                <div className="flex gap-2 pt-3 border-t border-gray-50">
                                    {bankCardLimit > 0 && (
                                        <div className="flex-1 bg-gray-50 rounded-lg p-2">
                                            <p className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Kart Limiti</p>
                                            <p className="text-sm font-bold text-gray-700">₺{formatMoneyTR(bankCardLimit)}</p>
                                        </div>
                                    )}
                                    {bankLoanDebt > 0 && (
                                        <div className="flex-1 bg-orange-50 rounded-lg p-2">
                                            <p className="text-[9px] text-orange-600 uppercase font-bold mb-0.5">Kredi Borcu</p>
                                            <p className="text-sm font-bold text-orange-700">₺{formatMoneyTR(bankLoanDebt)}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                {banks.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        Henüz banka eklenmemiş.
                    </div>
                )}
            </div>

            <button
                onClick={() => onOpenModal("product", null)}
                className="w-full mt-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
                Kart / Kredi Ekle
            </button>
        </div>
    );
}
