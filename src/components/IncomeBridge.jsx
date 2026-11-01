import React, { useState } from "react";
import { incomeBridge, shortBridgeDate } from "../domain/incomeBridge";
import { balanceFunding } from "../domain/availableBalance";
import { formatDateTR, formatMoneyTR } from "../utils";
import { ModalShell } from "./ui/Modal";
import { Icon } from "./ui/Icon";
import AvailableBalanceModal from "../modals/AvailableBalanceModal";

export default function IncomeBridge({ summary, snapshot, fingerprint, today, onSaveBalance }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const bridge = incomeBridge(summary);
  const funding = balanceFunding(bridge, snapshot, fingerprint, today);
  const money = value => `₺${formatMoneyTR(value)}`;
  const amountPrefix = bridge.unknown ? 'En az ' : bridge.hasUnverifiedData ? 'Tahmini ' : '';
  let amountLabel, explanation;
  if (!funding.fresh) {
    amountLabel = { missing: 'Önce bakiyeni gir', date: 'Bakiye güncel değil', records: 'Bakiyeni yeniden doğrula', checking: 'Bakiye doğrulanıyor', invalid: 'Bakiye doğrulanmalı' }[funding.reason];
    explanation = funding.reason === 'records' ? 'Finans kayıtları değişti; kayıtlı bakiyeyi doğrula.' : `${amountPrefix}${money(bridge.amount)} ödeme için güncel bakiye gerekli.`;
  } else if (funding.uncertain && funding.gap === 0) {
    amountLabel = 'Açık henüz netleşmedi';
    explanation = `Bilinen ödemeler sonrası ${money(funding.remaining)} var; bilgiler eksik.`;
  } else if (funding.gap > 0) {
    amountLabel = `${amountPrefix}${money(funding.gap)}`;
    explanation = `${money(bridge.amount)} ödeme − ${money(funding.amount)} kullanılabilir`;
  } else {
    amountLabel = 'Açık yok';
    explanation = bridge.before.length ? `Bu ödemelerden sonra ${money(funding.remaining)} kalır.` : 'Gelirden önce planlı ödeme yok.';
  }
  const sameDayRisk = bridge.sameDay.length && (bridge.sameDayUnknown || funding.sameDayGap > 0);
  const footnote = funding.fresh && bridge.sameDay.length
    ? funding.sameDayGap > 0
      ? `Önce ödeme çekilirse ${bridge.unknown || bridge.sameDayUnknown ? 'en az ' : ''}${money(funding.sameDayGap)} açık oluşabilir.`
      : `Gelir günü ${bridge.sameDayUnknown ? 'en az ' : ''}${money(bridge.sameDayAmount)} ödeme daha var; saat sırası bilinmiyor.`
    : funding.fresh && bridge.unknown ? `${bridge.unknown} ödeme tutarı eksik; açık artabilir.` : '';
  const rows = items => <ul className="bridge-timeline">{items.map(item => (
    <li key={`${item.recordType}:${item.id}:${item.dueDate}`}>
      <span><strong>{item.title}</strong><small>{formatDateTR(item.dueDate)}{item.hasAmbiguousStatus ? ' · Durumu doğrulanmalı' : ''}</small></span>
      <b>{item.needsCardAmount || item.amount == null || !Number.isFinite(Number(item.amount)) || Number(item.amount) < 0 ? 'Tutar eksik' : money(item.amount)}</b>
    </li>
  ))}</ul>;
  return (
    <>
      <section className={`funding-card ${funding.fresh && funding.gap === 0 && !funding.uncertain && !sameDayRisk ? 'covered' : !funding.fresh || funding.uncertain || (funding.gap === 0 && sameDayRisk) ? 'uncertain' : ''}`} aria-label="Bakiye ve ödeme açığı">
        <div className="funding-header">
          <span>{bridge.incomeDate ? 'Gelirden önce açık' : 'Seçili dönemde ödeme açığı'}</span>
          <button className="balance-edit" aria-label="Kullanılabilir bakiyeyi düzenle" disabled={!onSaveBalance} onClick={() => setEditing(true)}>
            {snapshot?.amount != null ? `Bakiye ${money(snapshot.amount)} · ${shortBridgeDate(snapshot.asOfDate)}` : 'Bakiye ekle'} <Icon name="pencil" size={12} />
          </button>
        </div>
        <button className="income-bridge" aria-label="Bakiye ve ödeme açığının ayrıntısı" onClick={() => setOpen(true)}>
          <span className="bridge-head"><strong className={!funding.fresh || (funding.uncertain && funding.gap === 0) ? 'bridge-empty' : ''}>{amountLabel}</strong>
            <span>{bridge.incomeDate ? `${shortBridgeDate(bridge.incomeDate)} tarihine kadar` : `${shortBridgeDate(summary.start)} – ${shortBridgeDate(summary.end)}`}</span><Icon name="arrow-right" size={17} /></span>
          <span className="bridge-next">{explanation}</span>
          {footnote && <span className="bridge-foot">{footnote}</span>}
        </button>
      </section>
      {editing && <AvailableBalanceModal snapshot={snapshot} fingerprint={fingerprint} today={today} onSave={onSaveBalance} onClose={() => setEditing(false)} />}
      {open && <ModalShell onClose={() => setOpen(false)} label="Bakiye ve ödeme açığı">
        <div className="sheet-content">
          <div className="sheet-heading"><h2>Bakiye ve ödeme açığı</h2><button className="icon-button" aria-label="Kapat" onClick={() => setOpen(false)}><Icon name="x" /></button></div>
          <p className="bridge-detail-copy">{bridge.incomeDate ? `${formatDateTR(bridge.incomeDate)} tarihindeki ${money(bridge.incomeAmount)} beklenen gelirden önceki ödemeler.` : `${formatDateTR(summary.start)} – ${formatDateTR(summary.end)} aralığında beklenen gelir görünmüyor.`}</p>
          <dl className="balance-calculation"><div><dt>Bilinen ödemeler</dt><dd>{amountPrefix}{money(bridge.amount)}</dd></div><div><dt>Kullanılabilir bakiye</dt><dd>{snapshot?.amount != null ? money(snapshot.amount) : 'Girilmedi'}</dd></div><div><dt>Ödeme açığı</dt><dd>{!funding.fresh ? 'Hesaplanmadı' : funding.uncertain && funding.gap === 0 ? 'Henüz netleşmedi' : `${amountPrefix}${money(funding.gap)}`}</dd></div></dl>
          {snapshot?.amount != null && <p className="bridge-detail-copy">Bakiye tarihi: {formatDateTR(snapshot.asOfDate)} · {funding.fresh ? 'Girdiğin bakiye esas alındı.' : 'Güncelliği doğrulanmalı.'}</p>}
          {!funding.fresh && <p className="notice">{funding.reason === 'records' ? 'Finans kayıtları bakiyeden sonra değişti.' : 'Güncel kullanılabilir bakiye bilinmiyor; boş bakiye sıfır varsayılmadı.'} Güncel bakiyeyi doğrulamadan kesin açık göstermiyoruz.</p>}
          {funding.fresh && !funding.uncertain && funding.gap === 0 && <p className="notice">Yalnız burada listelenen ödemeler için açık yok. {money(funding.remaining)} kalır; sonraki bütün ödemelerin karşılanacağı anlamına gelmez.</p>}
          <h3 className="balance-subheading">{bridge.incomeDate ? 'Gelirden önceki ödemeler' : 'Seçili aralıktaki ödemeler'}</h3>
          {bridge.before.length ? rows(bridge.before) : <p className="bridge-detail-copy">Bu aralıkta ödeme yok.</p>}
          {bridge.unknown > 0 && <p className="notice">{bridge.unknown} ödeme tutarı eksik. {funding.fresh && funding.gap > 0 ? 'Gösterilen açık alt sınırdır; eksik tutarlar tamamlandığında artabilir.' : 'Bilinen tutarlar karşılanabilse bile gerçek açık henüz belirlenemez.'}</p>}
          {bridge.sameDay.length > 0 && <><p className="notice bridge-same-day">Gelir günü ayrıca {bridge.sameDayUnknown ? 'en az ' : ''}{money(bridge.sameDayAmount)} ödeme var. Gelirin hesaba geçiş saati bilinmediğinden karşılanmış saymıyoruz. {funding.fresh ? `Ödemeler önce çekilirse toplam açık ${bridge.unknown || bridge.sameDayUnknown ? 'en az ' : ''}${money(funding.sameDayGap)} olabilir.` : 'Güncel bakiye olmadan bu durum da kesinleşmez.'}</p>{rows(bridge.sameDay)}</>}
          {bridge.hasUnverifiedData && <p className="notice">Bilgisi veya ödeme durumu doğrulanması gereken kayıtlar var; tutar kesinleşmiş değildir.</p>}
          {summary.overdueCount > 0 && <p className="notice">Önceki tarihlerden {summary.overdueCount} bekleyen ödeme bu tutara dahil değil; ana ekranda ayrıca gösterilir.</p>}
          <p className="footnote">Hesap, elle girdiğin güncel bakiyeye ve bilinen ödeme planına dayanır. Kart limiti ve beklenen gelir bakiyeye eklenmez; alınmış gelir ikinci kez sayılmaz. Otomatik banka bağlantısı yok.</p>
          <button className="primary-button" onClick={() => setOpen(false)}>Anladım</button>
        </div>
      </ModalShell>}
    </>
  );
}
