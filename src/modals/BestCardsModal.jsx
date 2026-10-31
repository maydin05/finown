import React from "react";
import { ModalShell } from "../components/ui/Modal";
import { Icon } from "../components/ui/Icon";
import { formatDateTR, formatMoneyTR } from "../utils";

export const BestCardsModal = ({ bestCards = [], banks = [], onClose }) => {
  const top = bestCards[0];
  const nearest = bestCards.length
    ? bestCards.reduce((a, b) => (b.daysToPayment < a.daysToPayment ? b : a))
    : null;
  const bankName = (card) =>
    banks.find((bank) => Number(bank.id) === Number(card.bankId))?.name ||
    "Bilinmeyen banka";
  return (
    <ModalShell onClose={onClose} label="Avantajlı kartlar">
      <div className="sheet-content best-cards-sheet">
        <div className="sheet-heading">
          <div>
            <p className="muted text-xs">
              {new Date().toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
              })}
            </p>
            <h2>Avantajlı kartlar</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Kapat">
            <Icon name="x" />
          </button>
        </div>
        {top ? (
          <>
            <p className="muted text-sm">
              Bugün yapacağın alışveriş için ödeme tarihine en çok süre kalan
              kart.
            </p>
            <section
              className="best-card-feature"
              aria-label="En uzun vadeli kart"
            >
              <p className="best-card-caption">En uzun vade</p>
              <div className="best-card-title">
                <div>
                  <p className="muted text-xs">{bankName(top.card)}</p>
                  <h3>{top.card.name}</h3>
                  {top.card.last4Digits && (
                    <p className="muted text-xs">•••• {top.card.last4Digits}</p>
                  )}
                </div>
                <div className="best-card-days">
                  <strong>{top.daysToPayment}</strong>
                  <span>gün</span>
                </div>
              </div>
              <dl className="detail-list">
                <div>
                  <dt>Tahmini ödeme</dt>
                  <dd>{formatDateTR(top.pay)}</dd>
                </div>
                <div>
                  <dt>Kesim günü</dt>
                  <dd>Her ayın {top.card.cutoffDay}’i</dd>
                </div>
                {Number(top.card.limit) > 0 && (
                  <div>
                    <dt>Tanımlı limit</dt>
                    <dd>₺{formatMoneyTR(top.card.limit)}</dd>
                  </div>
                )}
              </dl>
            </section>
            {nearest && nearest.card.id !== top.card.id && (
              <p className="best-card-nearest">
                <Icon name="clock" size={16} />
                <span>
                  En yakın ödeme: <strong>{nearest.card.name}</strong> ·{" "}
                  {nearest.daysToPayment} gün
                </span>
              </p>
            )}
            <div className="section-heading">
              <h3>Kartları karşılaştır</h3>
              <span className="muted text-xs">{bestCards.length} kart</span>
            </div>
            <ol className="best-card-list">
              {bestCards.map((item, index) => (
                <li key={item.card.id}>
                  <span
                    className={`best-card-rank ${index === 0 ? "recommended" : ""}`}
                  >
                    {index + 1}
                  </span>
                  <div className="best-card-copy">
                    <h4>{item.card.name}</h4>
                    <p>
                      {bankName(item.card)}
                      {item.card.last4Digits
                        ? ` · •••• ${item.card.last4Digits}`
                        : ""}
                    </p>
                    <p>
                      Ödeme {formatDateTR(item.pay)}
                      {item.isNextPeriod ? " · Sonraki ekstre" : ""}
                    </p>
                    {Number(item.card.limit) > 0 && (
                      <p>Tanımlı limit ₺{formatMoneyTR(item.card.limit)}</p>
                    )}
                  </div>
                  <div className="best-card-term">
                    <strong>{item.daysToPayment}</strong>
                    <span>gün</span>
                  </div>
                </li>
              ))}
            </ol>
            <p className="footnote">
              Sıralama, kayıtlı kesim ve son ödeme günlerine göre hesaplanır.
              İşlemin ekstreye yansıma tarihi bankaya göre değişebilir. Tanımlı
              limit, kullanılabilir limit değildir.
            </p>
          </>
        ) : (
          <div className="best-card-empty">
            <Icon name="credit-card" size={28} />
            <h3>Karşılaştırılacak kart yok</h3>
            <p>
              Kesim ve son ödeme günü kayıtlı bir kart eklediğinde burada
              görebilirsin.
            </p>
          </div>
        )}
        <button className="secondary-button" onClick={onClose}>
          Tamam
        </button>
      </div>
    </ModalShell>
  );
};
