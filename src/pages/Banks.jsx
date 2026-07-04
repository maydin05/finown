import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Icon } from '../components/ui/Icon';
import { formatMoneyTR, getDaysDifference } from '../utils';

// Static cash debt in USD (elden borc)
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

    /**
     * Avantajli Kart Algoritmasi
     * 
     * Hedef: Bugun yapilan harcamayi en gec tarihte odemesini saglayacak karti bulmak.
     * 
     * Turkiye Bankacilik Kurallari:
     * - Hesap kesim tarihi = Ekstrenin olusturdugu gun
     * - Son odeme tarihi = Kesim gunu + yaklasik 10 gun (bankaya gore degisir)
     * - Bugun yapilan harcama = Mevcut kesim donemine dahil olur
     * 
     * Kurallar:
     * - Eger bugun < kesim_tarihi: Harcama bu ayin ekstresine girer
     * - Eger bugun >= kesim_tarihi: Harcama gelecek ayin ekstresine girer (en avantajli!)
     */
    const getBestCards = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayDay = today.getDate();

        const cards = (products || []).filter(p =>
            p.type === "card" &&
            Number(p.cutoffDay) > 0 &&
            Number(p.paymentDueDay) > 0
        );

        const getSafeDateForMonth = (yr, mon, dy) => {
            const lastDay = new Date(yr, mon + 1, 0).getDate();
            return new Date(yr, mon, Math.min(dy, lastDay));
        };

        const calculateCardAdvantage = (card) => {
            const cutoffDay = Number(card.cutoffDay);
            const dueDay = Number(card.paymentDueDay);

            const year = today.getFullYear();
            const month = today.getMonth();

            let cutoffDate, paymentDate;
            let isNextPeriod = false;

            if (todayDay < cutoffDay) {
                // Kesim tarihi henuz gelmedi - bu ayin ekstresine girecek
                cutoffDate = getSafeDateForMonth(year, month, cutoffDay);
                // Odeme genellikle kesimden sonraki ayin dueDay'inde
                // Ama bazi bankalar ayni ay icinde odeme aliyor, kontrol edelim
                if (dueDay > cutoffDay) {
                    // Ayni ay icinde odeme (orn: kesim 10, odeme 20)
                    paymentDate = getSafeDateForMonth(year, month, dueDay);
                } else {
                    // Sonraki ay odeme (orn: kesim 25, odeme 5)
                    paymentDate = getSafeDateForMonth(year, month + 1, dueDay);
                }
            } else {
                // Kesim tarihi gecti - gelecek ayin ekstresine girecek (AVANTAJLI!)
                isNextPeriod = true;
                cutoffDate = getSafeDateForMonth(year, month + 1, cutoffDay);
                // Odeme gelecek kesimden sonra
                if (dueDay > cutoffDay) {
                    paymentDate = getSafeDateForMonth(year, month + 1, dueDay);
                } else {
                    paymentDate = getSafeDateForMonth(year, month + 2, dueDay);
                }
            }

            cutoffDate.setHours(0, 0, 0, 0);
            paymentDate.setHours(0, 0, 0, 0);

            const daysToCutoff = getDaysDifference(cutoffDate, today);
            const daysToPayment = getDaysDifference(paymentDate, today);

            return {
                card,
                cutoff: cutoffDate,
                pay: paymentDate,
                daysToCutoff,
                daysToPayment,
                isNextPeriod // Kesim gecmis mi (avantajli durum)
            };
        };

        // Tum kartlari hesapla ve EN UZUN VADEYE gore sirala (buyuk -> kucuk)
        const ranked = cards
            .map(calculateCardAdvantage)
            .sort((a, b) => b.daysToPayment - a.daysToPayment);

        return ranked.slice(0, 5); // En iyi 5 karti dondur
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
            <div className="pb-24 pt-4 px-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Top Nav */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => setSelectedBank(null)}
                        className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        <Icon name="chevron-left" size={20} className="text-current" />
                    </button>

                    <h2 className="text-2xl font-extrabold text-gray-800 flex-1">{selectedBank.name}</h2>

                    <div className="flex gap-2">
                        <button
                            onClick={() => onOpenModal("bank", selectedBank)}
                            className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                            title="Bankayı Düzenle"
                        >
                            <Icon name="edit-2" size={18} className="text-current" />
                        </button>

                        <button
                            onClick={() => onOpenModal("delete_bank", selectedBank)}
                            className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                            title="Bankayı Sil"
                        >
                            <Icon name="trash-2" size={18} className="text-current" />
                        </button>
                    </div>
                </div>

                {/* Bank Header Card */}
                <div className={`w-full rounded-3xl bg-gradient-to-br ${selectedBank.color} mb-8 p-6 shadow-xl shadow-${selectedBank.color.split('-')[1]}-500/20 relative overflow-hidden group`}>
                    <div className="absolute -right-4 -bottom-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                        <Icon name="building-2" size={120} className="text-white" />
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full bg-white/5 mask-image-diagonal rounded-3xl pointer-events-none"></div>
                    <div className="text-white relative z-10 flex w-full items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">Toplam Ürün</p>
                            <p className="text-4xl font-black tracking-tight">{bankProducts.length}</p>
                        </div>
                    </div>
                </div>

                {/* Credit Cards Section */}
                <div className="mb-8">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-base px-1">
                        <Icon name="credit-card" size={20} className="text-blue-500" /> Kredi Kartları
                    </h3>
                    <div className="space-y-3">
                        {cards.map((card) => (
                            <div key={card.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden hover:shadow-md hover:border-blue-100 transition-all group">
                                <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold text-white rounded-bl-xl ${card.cardType === "virtual" ? "bg-purple-500" : "bg-gray-700"}`}>
                                    {card.cardType === "virtual" ? "SANAL KART" : "FİZİKİ KART"}
                                </div>
                                
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-extrabold text-gray-900 text-base">{card.name}</p>
                                            <span className="text-xs text-gray-400 font-mono tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">**** {card.last4Digits}</span>
                                        </div>
                                        
                                        <p className="text-[11px] text-gray-500 font-medium">Kesim: <span className="text-gray-800">{card.cutoffDay}</span> • Son Ödeme: <span className="text-gray-800">{card.paymentDueDay}</span></p>
                                        
                                        {card.cardType === "virtual" && (
                                            <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                                                <Icon name="link" size={12} className="text-gray-400" /> Bağlı Kart:{" "}
                                                <b className="text-gray-700">
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

                                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-4">
                                        <div className="text-left sm:text-right">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Limit</p>
                                            <p className="font-extrabold text-gray-900 text-lg">₺{formatMoneyTR(card.limit)}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 mt-0 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onOpenModal("product", card); }}
                                                className="w-8 h-8 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                                            >
                                                <Icon name="edit-2" size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onOpenModal("delete_product", card); }}
                                                className="w-8 h-8 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                                            >
                                                <Icon name="trash-2" size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {cards.length === 0 && (
                        <div className="bg-gray-50 border border-gray-100 border-dashed rounded-2xl p-6 text-center">
                            <Icon name="credit-card" size={24} className="text-gray-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-400">Kart bulunamadı.</p>
                        </div>
                    )}
                </div>

                {/* Loans Section */}
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-base px-1">
                        <Icon name="pie-chart" size={20} className="text-orange-500" /> Krediler
                    </h3>
                    <div className="space-y-3">
                        {loans.map((loan) => (
                            <div key={loan.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group hover:shadow-md hover:border-orange-100 transition-all">
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 p-1 rounded-xl shadow-sm border border-gray-100">
                                    <button className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); onOpenModal("product", loan); }}>
                                        <Icon name="edit-2" size={14} />
                                    </button>
                                    <button className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); onOpenModal("delete_product", loan); }}>
                                        <Icon name="trash-2" size={14} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <p className="font-extrabold text-gray-900 text-base">{loan.name}</p>
                                    <span className="text-[10px] font-bold tracking-wider uppercase bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">Aktif</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-medium">
                                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Taksit Sayısı</p>
                                        <p className="text-gray-800">{loan.totalInstallments}</p>
                                    </div>
                                    <div className="flex-1 bg-orange-50 rounded-lg p-3">
                                        <p className="text-[10px] text-orange-400/80 uppercase tracking-wider mb-1">Aylık Taksit</p>
                                        <p className="text-orange-700">₺{formatMoneyTR(loan.installmentAmount)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {loans.length === 0 && (
                        <div className="bg-gray-50 border border-gray-100 border-dashed rounded-2xl p-6 text-center">
                            <Icon name="pie-chart" size={24} className="text-gray-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-400">Kredi bulunamadı.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Main Banks View
    // Calculate cash debt in TL
    const cashDebtTL = CASH_DEBT_USD * usdRate;
    const totalDebt = globalLoanDebt + cashDebtTL;

    return (
        <div className="pb-24 pt-4 space-y-4 px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-gray-900 text-white p-5 rounded-b-3xl shadow-lg -mx-4 -mt-4 pt-8 relative overflow-hidden mb-6">
                <div className="relative z-10">
                    <h2 className="text-xl font-bold mb-3">Varlıklar & Borçlar</h2>

                    {/* 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Card Limit */}
                        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/5">
                            <p className="text-gray-400 text-[9px] tracking-wider mb-0.5">TOP. KART LİMİTİ</p>
                            <p className="font-bold text-base">₺{formatMoneyTR(globalCardLimit)}</p>
                        </div>

                        {/* Loan Debt */}
                        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-orange-500/30">
                            <p className="text-orange-300 text-[9px] tracking-wider mb-0.5">KREDİ BORCU</p>
                            <p className="font-bold text-base text-orange-200">₺{formatMoneyTR(globalLoanDebt)}</p>
                        </div>

                        {/* Cash Debt (USD) */}
                        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-blue-500/30">
                            <p className="text-blue-300 text-[9px] tracking-wider mb-0.5">ELDEN BORÇ (USD)</p>
                            <p className="font-bold text-base text-blue-200">${CASH_DEBT_USD.toLocaleString('en-US')}</p>
                            <p className="text-[9px] text-gray-400">≈ ₺{formatMoneyTR(cashDebtTL)}</p>
                        </div>

                        {/* Total Debt */}
                        <div className="bg-gradient-to-br from-red-600/30 to-red-800/30 p-2.5 rounded-xl backdrop-blur-sm border border-red-500/30">
                            <p className="text-red-200 text-[9px] tracking-wider mb-0.5">TOPLAM BORÇ</p>
                            <p className="font-bold text-base text-white">₺{formatMoneyTR(totalDebt)}</p>
                        </div>
                    </div>

                    {/* Exchange rate info */}
                    <p className="text-[9px] text-gray-500 text-center mt-2">1 USD = ₺{usdRate.toFixed(2)}</p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-extrabold text-gray-800 text-lg">Bankalar</h3>

                <div className="flex gap-2">
                    <button
                        onClick={handleBestCards}
                        className="text-xs font-bold text-gray-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-100/80 transition-colors shadow-sm flex items-center gap-1"
                        title="Bugün hangi kart daha avantajlı?"
                    >
                        ⭐ Avantajlı Kartlar
                    </button>

                    <button
                        onClick={() => onOpenModal("bank", null)}
                        className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors shadow-sm"
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
                            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 group hover:shadow-md hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
                        >
                            {/* Hover Edit/Delete Options */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 bg-white/90 p-1 rounded-xl shadow-sm border border-gray-100 backdrop-blur-sm">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenModal("bank", bank);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Bankayı Düzenle"
                                >
                                    <Icon name="edit-2" size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenModal("delete_bank", bank);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Bankayı Sil"
                                >
                                    <Icon name="trash-2" size={14} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bank.color} flex items-center justify-center text-white shadow-md transform group-hover:scale-105 transition-transform`}>
                                    <Icon name="building-2" size={24} className="text-white" />
                                </div>

                                <div className="flex-1 pr-8">
                                    <h3 className="font-extrabold text-gray-900 text-base">{bank.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium">{bankProducts.length} Ürün</p>
                                </div>

                                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <Icon name="chevron-right" size={18} className="text-gray-400 group-hover:text-blue-600" />
                                </div>
                            </div>

                            {(bankCardLimit > 0 || bankLoanDebt > 0) && (
                                <div className="flex gap-2 pt-3 border-t border-gray-100">
                                    {bankCardLimit > 0 && (
                                        <div className="flex-1 bg-gray-50 rounded-xl p-3">
                                            <p className="text-[10px] text-gray-500 font-bold mb-1 tracking-wider uppercase">KART LİMİTİ</p>
                                            <p className="text-sm font-extrabold text-gray-800">₺{formatMoneyTR(bankCardLimit)}</p>
                                        </div>
                                    )}
                                    {bankLoanDebt > 0 && (
                                        <div className="flex-1 bg-orange-50 rounded-xl p-3">
                                            <p className="text-[10px] text-orange-600 font-bold mb-1 tracking-wider uppercase">KREDİ BORCU</p>
                                            <p className="text-sm font-extrabold text-orange-700">₺{formatMoneyTR(bankLoanDebt)}</p>
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
