import React, { useState } from "react";
import { incomeBridge, shortBridgeDate } from "../domain/incomeBridge";
import { formatDateTR, formatMoneyTR } from "../utils";
import { ModalShell } from "./ui/Modal";
import { Icon } from "./ui/Icon";

export default function IncomeBridge({ summary }) {
  const [open, setOpen] = useState(false);
  const bridge = incomeBridge(summary);
  const money = (value) => `₺${formatMoneyTR(value)}`;
  const beforeLabel = bridge.incomeDate ? "Gelirden önce gerekli" : "Seçili aralıkta gelir görünmüyor";
  const noPriorPayment = bridge.incomeDate && bridge.before.length === 0;
  const amountLabel = noPriorPayment ? "Öncesinde ödeme yok" : `${bridge.unknown ? "En az " : ""}${money(bridge.amount)}`;
  const rows = (items) => (
    <ul className="bridge-timeline">
      {items.map((item) => (
        <li key={`${item.recordType}:${item.id}:${item.dueDate}`}>
          <span><strong>{item.title}</strong><small>{formatDateTR(item.dueDate)}{item.hasAmbiguousStatus ? " · Durumu doğrulanmalı" : ""}</small></span>
          <b>{item.needsCardAmount || item.amount == null || !Number.isFinite(Number(item.amount)) || Number(item.amount) < 0 ? "Tutar eksik" : money(item.amount)}</b>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <button
        className={`income-bridge ${noPriorPayment && !bridge.sameDay.length ? "no-prior-payment" : ""}`}
        aria-label="Gelirden önceki ödemelerin ayrıntısı"
        onClick={() => setOpen(true)}
      >
        <span className="bridge-label">{beforeLabel}</span>
        <span className="bridge-head">
          <strong className={noPriorPayment ? "bridge-empty" : ""}>{amountLabel}</strong>
          <span>{bridge.incomeDate ? `${shortBridgeDate(bridge.incomeDate)} tarihine kadar` : `${shortBridgeDate(summary.start)} – ${shortBridgeDate(summary.end)}`}</span>
          <Icon name="arrow-right" size={17} />
        </span>
        <span className="bridge-next">{bridge.incomeDate ? `Beklenen gelir: ${shortBridgeDate(bridge.incomeDate)} · ${money(bridge.incomeAmount)}` : "Bu tutar, seçili aralıktaki bilinen ödemelerdir."}</span>
        <span className="bridge-foot">
          {bridge.sameDay.length
            ? `Gelir günü ${bridge.sameDayUnknown ? "en az " : ""}${money(bridge.sameDayAmount)} ödeme · Saat sırası bilinmiyor`
            : bridge.unknown ? `${bridge.unknown} ödeme tutarı eksik · Bakiye bilinmiyor`
              : bridge.hasUnverifiedData ? "Bilgiler doğrulanmalı · Bakiye bilinmiyor"
                : `Bakiye bilinmiyor · ${bridge.before.length ? `${bridge.before.length} ödemeyi gör` : "Tarih sırasını gör"}`}
        </span>
      </button>
      {open && (
        <ModalShell onClose={() => setOpen(false)} label="Gelirden önceki ödemeler">
          <div className="sheet-content">
            <div className="sheet-heading">
              <h2>Gelirden önceki ödemeler</h2>
              <button className="icon-button" aria-label="Kapat" onClick={() => setOpen(false)}><Icon name="x" /></button>
            </div>
            <p className="detail-figure">{bridge.unknown ? "En az " : ""}{money(bridge.amount)}</p>
            <p className="bridge-detail-copy">{bridge.incomeDate
              ? `${formatDateTR(bridge.incomeDate)} tarihindeki ${money(bridge.incomeAmount)} beklenen gelirden önce vadesi gelen ödemeler.`
              : `${formatDateTR(summary.start)} – ${formatDateTR(summary.end)} aralığında beklenen gelir görünmüyor. Bu aralıktaki ödemeler gösteriliyor.`}</p>
            {bridge.before.length ? rows(bridge.before) : <p className="bridge-detail-copy">Beklenen gelirden önce vadesi gelen ödeme yok.</p>}
            {bridge.unknown > 0 && <p className="notice">{bridge.unknown} ödeme tutarı eksik. Gösterilen tutar alt sınırdır; eksik tutarlar tamamlandığında artabilir.</p>}
            {bridge.sameDay.length > 0 && (
              <>
                <p className="notice bridge-same-day">Gelir günü ayrıca {bridge.sameDayUnknown ? "en az " : ""}{money(bridge.sameDayAmount)} ödeme var. {bridge.sameDayUnknown > 0 ? `${bridge.sameDayUnknown} tutar eksik. ` : ""}Gelirin hesaba geçiş saati bilinmediğinden bu ödemeleri karşılanmış saymıyoruz.</p>
                {rows(bridge.sameDay)}
              </>
            )}
            {bridge.hasUnverifiedData && <p className="notice">Bilgisi veya ödeme durumu doğrulanması gereken kayıtlar var. Bu tutar kesinleşmiş değildir; ana ekrandaki uyarıları kontrol et.</p>}
            {summary.overdueCount > 0 && <p className="notice">Önceki tarihlerden {summary.overdueCount} bekleyen ödeme bu tutara dahil değil; ana ekranda ayrıca gösterilir.</p>}
            <p className="notice">Bu kesin nakit açığın değil. Mevcut bakiyen bilinmiyor. Gösterilen tutar, beklenen gelir gelmeden önce hazır olması gereken paradır. Beklenen gelir henüz alınmış sayılmaz.</p>
            <button className="primary-button" onClick={() => setOpen(false)}>Anladım</button>
          </div>
        </ModalShell>
      )}
    </>
  );
}
