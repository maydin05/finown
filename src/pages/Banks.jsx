import { RecordRow } from "../components/items/RecordRow";
import React, { useState } from "react";
import { useData } from "../context/store";
import { Icon } from "../components/ui/Icon";
import { formatMoneyTR, getDaysDifference, formatDateTR } from "../utils";

import { debtPlans, loanRemaining } from "../domain/plans";

export default function Banks({ onOpenModal }) {
  const data = useData();
  const { banks, products, payments,readOnly } = data;
  const plans = debtPlans(data);
  const [selectedBank, setSelectedBank] = useState(null);
  const getLoanRemaining = (loan) => loanRemaining(loan, payments);

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
      <div className="calm-page compact-list-page tone-banks">
        <button className="back-link" onClick={() => setSelectedBank(null)}>
          <Icon name="chevron-left" size={17} /> Tüm bankalar
        </button>
        <div className="page-title">
          <h1>{selectedBank.name}</h1>
          {!readOnly && <div className="flex">
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
          </div>}
        </div>
        <p className="muted text-sm">
          {cards.length} kart · {loans.length} kredi
        </p>
        <div className="section-title">
          <h2>Kredi kartları</h2>
          {!readOnly && <button onClick={() => onOpenModal("product", null)}>
            Kart ekle
          </button>}
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
        {!readOnly && <button
          className="secondary-button"
          onClick={() => onOpenModal("product", null)}
        >
          Kart / kredi ekle
        </button>}
      </div>
    );
  }

  const cashDebtTL = plans.reduce(
    (sum, plan) => sum + (plan.remaining ?? 0),
    0,
  );
  const totalDebt = globalLoanDebt + cashDebtTL;
  return (
    <div className="calm-page compact-list-page tone-banks">
      <div className="page-title">
        <h1>Bankalarım</h1>
        {!readOnly && <button
          className="icon-button"
          aria-label="Banka ekle"
          onClick={() => onOpenModal("bank", null)}
        >
          <Icon name="plus" />
        </button>}
      </div>
      <section className="monthly-summary compact-month-summary" aria-label="Banka özeti">
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
          <summary>Elden borç planı ayrıntısı</summary>
          <p>TL planlarından kalan: ₺{formatMoneyTR(cashDebtTL)}</p>
          <p>Kart borcu bu toplamın kapsamında değil.</p>
          <p>
            Bu planlar Ödemeler listesinde de aynı kaynaktan izlenir; ikinci bir
            ödeme satırı oluşturulmaz.
          </p>
        </details>
      </section>
      <div className="section-title">
        <h2>Elden borçlar</h2>
        {!readOnly && <button onClick={() => onOpenModal("debt", null)}>Plan ekle</button>}
      </div>
      {plans.length === 0 && (
        <p className="empty-state">
          Bir gider planında “Elden borç olarak izle”yi seçerek burada takip
          edebilirsin.
        </p>
      )}
      {plans.map((plan) =>
        plan.error ? (
          <p className="notice" key={plan.source.id}>
            {plan.source.title}: {plan.error} Toplam eksik olabilir.
          </p>
        ) : (
          <RecordRow
            key={plan.source.id}
            title={plan.source.title}
            amount={plan.remaining}
            meta={`${plan.pending.length} / ${plan.rows.length} ödeme bekliyor · TL`}
            icon="hand-coins"
            detail={
              <>
                <dl className="detail-list">
                  <div>
                    <dt>İlk ödeme</dt>
                    <dd>{formatDateTR(plan.rows[0]?.dueDate)}</dd>
                  </div>
                  <div>
                    <dt>Son ödeme</dt>
                    <dd>{formatDateTR(plan.rows.at(-1)?.dueDate)}</dd>
                  </div>
                  <div>
                    <dt>Planlanan toplam</dt>
                    <dd>₺{formatMoneyTR(plan.total)}</dd>
                  </div>
                </dl>
                <p className="footnote">
                  Kalan borç, bu TL gider planının ödenmemiş taksitlerinden
                  hesaplanır.
                </p>
              </>
            }
            actions={[
              {
                label: "Planı düzenle",
                opensModal: true,
                onClick: () => onOpenModal("expense", plan.source),
              },
            ]}
          />
        ),
      )}
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
      {!readOnly && <button
        className="secondary-button"
        onClick={() => onOpenModal("product", null)}
      >
        Kart / kredi ekle
      </button>}
    </div>
  );
}
