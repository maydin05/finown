import {paymentBank} from "../domain/bankIdentity";
import BankMark from "./ui/BankMark";
import React, { useMemo, useState } from "react";
import { useData } from "../context/store";
import { useBalanceFingerprint } from "../hooks/useBalanceFingerprint";
import IncomeBridge from "./IncomeBridge";
import { shortBridgeDate } from "../domain/incomeBridge";
import { cashFlow } from "../domain/finance";
import { formatDateTR, formatMoneyTR } from "../utils";
import { Icon } from "./ui/Icon";
import { ModalShell } from "./ui/Modal";

export function CashFlowPanel({
  data,
  today = new Date(),
  onEnterStatement,
  onOpenItem,
}) {
  const localFingerprint = useBalanceFingerprint(data);
  const fingerprint = data.readOnly ? data.sharedFingerprint : localFingerprint;
  const [days, setDays] = useState(7);
  const [filter, setFilter] = useState("out");
  const [expanded, setExpanded] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const summary = useMemo(
    () => cashFlow(data, today, days),
    [data, today, days],
  );
  const cashRows = summary.rows.filter((item) => item.direction !== "card");
  const filtered = cashRows.filter(
    (item) => filter === "all" || item.direction === filter,
  );
  const visible = expanded ? filtered : filtered.slice(0, 3);
  const hasUncertainty =
    summary.missing.length > 0 ||
    summary.incomplete.length > 0 ||
    summary.ambiguous > 0 ||
    summary.unlinkedCardSubscriptions > 0;
  return (
    <section className="cashflow cashflow-with-bridge" aria-label="Yaklaşan ödeme ve gelir özeti">
      <div className="period-row">
        <div className="overview-heading">
          <h1>Özet</h1>
          <p>
            {shortBridgeDate(summary.start)} – {shortBridgeDate(summary.end)}
          </p>
        </div>
        <div className="segmented" aria-label="Özet dönemi">
          {[7, 30].map((value) => (
            <button
              key={value}
              aria-pressed={days === value}
              onClick={() => {
                setDays(value);
                setExpanded(false);
              }}
            >
              {value} gün
            </button>
          ))}
        </div>
      </div>
      <div className="summary-card">
        <div className="summary-metrics">
          <div>
            <p>
              <Icon name="arrow-up-right" size={14} />
              Beklenen gelir
            </p>
            <strong data-testid="expected-income">
              ₺{formatMoneyTR(summary.income)}
            </strong>
          </div>
          <div>
            <p>
              <Icon name="arrow-down-right" size={14} />
              Bilinen ödemeler
            </p>
            <strong data-testid="known-payments">
              ₺{formatMoneyTR(summary.expense)}
            </strong>
          </div>
        </div>
        <div className="summary-net">
          <div>
            <button className="bridge-summary-info" aria-label="Dönem farkı hakkında bilgi" onClick={() => setInfoOpen(true)}>
              Tahmini dönem farkı <Icon name="info" size={14} />
            </button>
            <p
              className={`summary-certainty ${hasUncertainty ? "uncertain" : ""}`}
              role="status"
            >
              {summary.missing.length > 0
                ? "Tahmini · Ekstre eksik"
                : hasUncertainty
                  ? "Tahmini · Bilgi eksik"
                  : "Beklenen gelire dayalı tahmin"}
            </p>
          </div>
          <p
            className={`summary-figure ${summary.difference < 0 ? "negative" : ""}`}
            data-testid="period-difference"
          >
            {summary.difference < 0 ? "−" : "+"}
            <span className="currency">₺</span>
            {formatMoneyTR(Math.abs(summary.difference))}
          </p>
        </div>
        {summary.missing.length > 0 && (
          <div className="summary-statement" role="status">
            <span>
              <Icon name="alert-circle" size={15} />
              {summary.missing.length} ekstre eksik · Sonuç kesinleşmedi
            </span>
            {!data.readOnly && <button
              aria-label="Ekstre tutarı gir"
              onClick={() => onEnterStatement?.(summary.missing[0])}
              disabled={!onEnterStatement}
            >
              Tamamla <span aria-hidden="true">→</span>
            </button>}
          </div>
        )}
      </div>
      <IncomeBridge summary={summary} snapshot={data.availableBalance} fingerprint={fingerprint} today={today} onSaveBalance={data.readOnly ? null : data.saveAvailableBalance} readOnly={data.readOnly} />
      {(summary.incomplete.length > 0 ||
        summary.ambiguous > 0 ||
        summary.unlinkedCardSubscriptions > 0) && (
        <details className="notice">
          <summary>
            Bilgisi doğrulanmalı (
            {summary.incomplete.length +
              summary.ambiguous +
              summary.unlinkedCardSubscriptions}
            )
          </summary>
          {summary.incomplete.length > 0 && (
            <p>
              {summary.incomplete.length} kaydın tarih, tür veya tutarı eksik;
              toplam dışında tutuldu.
            </p>
          )}
          {summary.ambiguous > 0 && (
            <p>
              {summary.ambiguous} eski ödeme durumu doğrulanmalı; ödenmemiş
              olarak listeleniyor.
            </p>
          )}
          {summary.unlinkedCardSubscriptions > 0 && (
            <p>
              {summary.unlinkedCardSubscriptions} aboneliğin ana kart bağlantısı
              doğrulanmalı; ayrıca toplamda sayılmıyor.
            </p>
          )}
        </details>
      )}
      <div className="section-title">
        <h2>
          {filter === "out" ? "Yaklaşan ödemeler" : filter === "in" ? "Yaklaşan gelirler" : "Yaklaşan hareketler"}
        </h2>
        <span className="movement-count">
          {filtered.length} {filter === "out" ? "ödeme" : filter === "in" ? "gelir" : "hareket"}
        </span>
      </div>
      <div className="line-tabs" aria-label="Hareket filtresi">
        {[
          ["out", "Ödemeler"],
          ["in", "Gelirler"],
          ["all", "Tümü"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => {
              setFilter(value);
              setExpanded(false);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="movement-list">
        {visible.map((item) => {
          const bank=paymentBank(item,data.products,data.banks);
          return (
          <li
            key={`${item.recordType}:${item.id}:${item.dueDate}`}
            className="movement-row"
          >
            <button
              className="movement-main"
              onClick={() =>
                item.needsCardAmount && onEnterStatement
                  ? onEnterStatement(item)
                  : onOpenItem
                    ? onOpenItem(item)
                    : setInfoOpen(true)
              }
              aria-label={`${item.title} ayrıntısı`}
            >
              {bank ? <BankMark bank={bank} fallback={item.type==="card" ? "credit-card" : "landmark"}/> : <span
                className={`movement-icon ${item.direction === "in" ? "income" : ""}`}
              >
                <Icon
                  name={
                    item.direction === "in"
                      ? "arrow-up-right"
                      : item.type === "card"
                        ? "credit-card"
                        : item.type === "loan"
                          ? "landmark"
                          : "receipt"
                  }
                  size={19}
                />
              </span>}
              <span className="movement-copy">
                <strong>{item.title}</strong>
                <span>
                  {bank && <b className="payment-bank-name">{bank.name} · </b>}{formatDateTR(item.dueDate)} ·{" "}
                  {item.direction === "in" ? "Gelir" : "Ödeme"}
                </span>
              </span>
              <span
                className={`movement-amount ${item.direction === "in" ? "income" : ""}`}
              >
                {item.needsCardAmount ? (
                  <span className="unknown-amount">Tutar girilmedi</span>
                ) : (
                  `${item.direction === "in" ? "+" : ""}₺${formatMoneyTR(item.amount)}`
                )}
              </span>
            </button>
          </li>
        );})}
      </ul>
      {filtered.length === 0 && (
        <p className="empty-state">
          Bu aralıkta bekleyen {filter === "in" ? "gelir" : "hareket"} yok.
        </p>
      )}
      {filtered.length > 3 && (
        <button className="more-button" onClick={() => setExpanded(!expanded)}>
          {expanded
            ? "Daha az göster"
            : `${filtered.length - visible.length} hareket daha`}{" "}
          <Icon name={expanded ? "chevron-up" : "chevron-down"} size={14} />
        </button>
      )}
      <p className="footnote">Dönem farkı, mevcut hesap bakiyen değildir.</p>
      {infoOpen && (
        <ModalShell
          onClose={() => setInfoOpen(false)}
          label="Dönem farkı açıklaması"
        >
          <div className="sheet-content">
            <div className="sheet-heading">
              <h2>Bu fark neyi gösteriyor?</h2>
              <button
                className="icon-button"
                aria-label="Kapat"
                onClick={() => setInfoOpen(false)}
              >
                <Icon name="x" />
              </button>
            </div>
            <p>
              Beklenen gelirlerden bilinen ve henüz ödenmemiş tutarları
              çıkarıyoruz. Bu fark mevcut bakiye veya harcanabilir para
              değildir.
            </p>
            <p>
              Alınmış gelir, ödenmiş kayıtlar ve önceki tarihlerden gecikmiş
              ödemeler bu dönem farkına dahil değil. Eksik ekstreler
              tamamlandığında toplam değişebilir.
            </p>
            {summary.cardSubscriptions > 0 && (
              <details>
                <summary>
                  Kart üzerinden takip edilen abonelikler (
                  {summary.cardSubscriptions})
                </summary>
                <p>Kart abonelikleri ekstreye ikinci kez eklenmez.</p>
                <ul>
                  {summary.rows
                    .filter((item) => item.direction === "card")
                    .map((item) => (
                      <li key={`${item.id}:${item.dueDate}`}>
                        {item.title} · ₺{formatMoneyTR(item.amount)}
                      </li>
                    ))}
                </ul>
              </details>
            )}
            <button
              className="primary-button"
              onClick={() => setInfoOpen(false)}
            >
              Anladım
            </button>
          </div>
        </ModalShell>
      )}
    </section>
  );
}

export default function CashFlowSummary({ onOpenModal, onOpenItem, ownerId }) {
  const data = useData();
  return (
    <CashFlowPanel
      data={ownerId && data.userId !== ownerId ? { ...data, availableBalance: null, saveAvailableBalance: null } : data}
      onEnterStatement={
        !data.readOnly && onOpenModal ? (item) => onOpenModal("card_amount", item) : undefined
      }
      onOpenItem={onOpenItem}
    />
  );
}
