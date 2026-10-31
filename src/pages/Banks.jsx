import { RecordRow } from "../components/items/RecordRow";
import React, { useState, useEffect } from "react";
import { useData } from "../context/store";
import { Icon } from "../components/ui/Icon";
import { formatMoneyTR, getDaysDifference } from "../utils";

// Static cash debt in USD (elden borc)
const CASH_DEBT_USD = 5000;

export default function Banks({ onOpenModal }) {
  const { banks, products, payments } = useData();
  const [selectedBank, setSelectedBank] = useState(null);
  const [usdRate, setUsdRate] = useState(36.5); // Default fallback rate

  // Fetch current USD/TRY exchange rate
  useEffect(() => {
    const fetchRate = async () => {
      try {
        // Using free exchange rate API
        const res = await fetch(
          "https://api.exchangerate-api.com/v4/latest/USD",
        );
        const data = await res.json();
        if (data?.rates?.TRY) {
          setUsdRate(data.rates.TRY);
        }
      } catch {
        console.log("Could not fetch exchange rate, using default");
      }
    };
    fetchRate();
  }, []);

  // Calculate remaining loan debt based on unpaid installments
  const getLoanRemaining = (loan) => {
    // Get all installment payments for this loan
    const loanPayments = (payments || []).filter(
      (p) => p.type === "loan" && String(p.productId) === String(loan.id),
    );

    // If there are actual payment records, sum the unpaid ones
    if (loanPayments.length > 0) {
      return loanPayments
        .filter((p) => !p.isPaid)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    }

    // Fallback: calculate from product data if no payment records exist
    const paidCount = loanPayments.filter((p) => p.isPaid).length;
    const total =
      Number(loan.installmentAmount || 0) * Number(loan.totalInstallments || 0);
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

    const cards = (products || []).filter(
      (p) =>
        p.type === "card" &&
        Number(p.cutoffDay) > 0 &&
        Number(p.paymentDueDay) > 0,
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
        isNextPeriod, // Kesim gecmis mi (avantajli durum)
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
    const bankProducts = products.filter(
      (product) => String(product.bankId) === String(selectedBank.id),
    );
    const cards = bankProducts.filter((product) => product.type === "card");
    const loans = bankProducts.filter((product) => product.type === "loan");
    return (
      <div className="calm-page">
        <button className="back-link" onClick={() => setSelectedBank(null)}>
          <Icon name="chevron-left" size={17} /> Tüm bankalar
        </button>
        <div className="page-title">
          <h1>{selectedBank.name}</h1>
          <div className="flex">
            <button
              className="icon-button"
              aria-label="Bankayı düzenle"
              onClick={() => onOpenModal("bank", selectedBank)}
            >
              <Icon name="pencil" size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Bankayı sil"
              onClick={() => onOpenModal("delete_bank", selectedBank)}
            >
              <Icon name="trash-2" size={18} />
            </button>
          </div>
        </div>
        <p className="muted text-sm">
          {cards.length} kart · {loans.length} kredi
        </p>
        <div className="section-title">
          <h2>Kredi kartları</h2>
          <button onClick={() => onOpenModal("product", null)}>
            Kart ekle
          </button>
        </div>
        {cards.map((card) => {
          const parent = products.find(
            (product) => String(product.id) === String(card.parentCardId),
          );
          return (
            <RecordRow
              key={card.id}
              title={card.name}
              amount={card.limit}
              icon="credit-card"
              meta={`${card.cardType === "virtual" ? "Sanal kart" : "Fiziksel kart"} · •• ${card.last4Digits || "—"}`}
              detail={
                <dl className="detail-list">
                  <div>
                    <dt>Gösterilen tutar</dt>
                    <dd>Kart limiti</dd>
                  </div>
                  <div>
                    <dt>Hesap kesim günü</dt>
                    <dd>{card.cutoffDay || "Belirtilmedi"}</dd>
                  </div>
                  <div>
                    <dt>Son ödeme günü</dt>
                    <dd>{card.paymentDueDay || "Belirtilmedi"}</dd>
                  </div>
                  {card.cardType === "virtual" && (
                    <div>
                      <dt>Ana kart</dt>
                      <dd>{parent?.name || "Seçilmedi"}</dd>
                    </div>
                  )}
                </dl>
              }
              actions={[
                {
                  label: "Kartı düzenle",
                  onClick: () => onOpenModal("product", card),
                  opensModal: true,
                },
                {
                  label: "Kartı sil",
                  onClick: () => onOpenModal("delete_product", card),
                  opensModal: true,
                  danger: true,
                },
              ]}
            />
          );
        })}
        {cards.length === 0 && (
          <p className="empty-state">Bu bankada kart yok.</p>
        )}
        <div className="section-title">
          <h2>Krediler</h2>
        </div>
        {loans.map((loan) => (
          <RecordRow
            key={loan.id}
            title={loan.name}
            amount={getLoanRemaining(loan)}
            icon="landmark"
            meta="Kalan kredi borcu"
            detail={
              <dl className="detail-list">
                <div>
                  <dt>Taksit sayısı</dt>
                  <dd>{loan.totalInstallments}</dd>
                </div>
                <div>
                  <dt>Kayıtlı taksit tutarı</dt>
                  <dd>
                    {loan.installmentAmount == null
                      ? "Belirtilmedi"
                      : `₺${formatMoneyTR(loan.installmentAmount)}`}
                  </dd>
                </div>
              </dl>
            }
            actions={[
              {
                label: "Krediyi düzenle",
                onClick: () => onOpenModal("product", loan),
                opensModal: true,
              },
              {
                label: "Krediyi sil",
                onClick: () => onOpenModal("delete_product", loan),
                opensModal: true,
                danger: true,
              },
            ]}
          />
        ))}
        {loans.length === 0 && (
          <p className="empty-state">Bu bankada kredi yok.</p>
        )}
        <button
          className="secondary-button"
          onClick={() => onOpenModal("product", null)}
        >
          Kart / kredi ekle
        </button>
      </div>
    );
  }

  const cashDebtTL = CASH_DEBT_USD * usdRate;
  const totalDebt = globalLoanDebt + cashDebtTL;
  return (
    <div className="calm-page">
      <div className="page-title">
        <h1>Bankalarım</h1>
        <button
          className="icon-button"
          aria-label="Banka ekle"
          onClick={() => onOpenModal("bank", null)}
        >
          <Icon name="plus" />
        </button>
      </div>
      <section className="monthly-summary" aria-label="Banka özeti">
        <p>Kredi + elden borç</p>
        <strong>₺{formatMoneyTR(totalDebt)}</strong>
        <dl>
          <div>
            <dt>Tanımlı kart limitleri</dt>
            <dd>₺{formatMoneyTR(globalCardLimit)}</dd>
          </div>
          <div>
            <dt>Kredi borcu</dt>
            <dd>₺{formatMoneyTR(globalLoanDebt)}</dd>
          </div>
        </dl>
        <details className="summary-details">
          <summary>Elden borç ve kur ayrıntısı</summary>
          <p>
            ${CASH_DEBT_USD.toLocaleString("en-US")} ≈ ₺
            {formatMoneyTR(cashDebtTL)}
          </p>
          <p>1 USD = ₺{usdRate.toFixed(2)}</p>
          <p>Kart borcu bu toplamın kapsamında değil.</p>
        </details>
      </section>
      <div className="section-title">
        <h2>Hesaplar</h2>
        <button onClick={handleBestCards}>Avantajlı kartlar</button>
      </div>
      <div className="bank-list">
        {banks.map((bank) => {
          const bankProducts = products.filter(
            (product) => String(product.bankId) === String(bank.id),
          );
          return (
            <button
              key={bank.id}
              className="bank-row"
              onClick={() => setSelectedBank(bank)}
              aria-label={`${bank.name} ayrıntısı`}
            >
              <span className={`bank-mark bg-gradient-to-br ${bank.color}`}>
                <Icon name="landmark" size={20} />
              </span>
              <span>
                <strong>{bank.name}</strong>
                <small>{bankProducts.length} ürün</small>
              </span>
              <Icon name="chevron-right" size={18} />
            </button>
          );
        })}
      </div>
      {banks.length === 0 && (
        <p className="empty-state">Henüz banka eklenmemiş.</p>
      )}
      <button
        className="secondary-button"
        onClick={() => onOpenModal("product", null)}
      >
        Kart / kredi ekle
      </button>
    </div>
  );
}
