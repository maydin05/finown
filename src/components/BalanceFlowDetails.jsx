import React, { useState } from 'react';
import { formatDateTR, formatMoneyTR } from '../utils';
import { shortBridgeDate } from '../domain/incomeBridge';
import { Icon } from './ui/Icon';

const money = n => `₺${formatMoneyTR(Math.abs(n))}`;
const signed = n => `${n < 0 ? '−' : n > 0 ? '+' : ''}${money(n)}`;

function FlowChart({ flow, available }) {
  const values=[available,...flow.days.flatMap(d=>[d.low,d.closing])];
  const min=Math.min(0,...values),max=Math.max(1,...values),span=max-min;
  const x=i=>38+i/Math.max(1,flow.days.length)*282,y=v=>18+(max-v)/span*116;
  let path=`M ${x(0)} ${y(available)}`;
  flow.days.forEach((d,i)=>{path+=` H ${x(i+1)} V ${y(d.low)} V ${y(d.closing)}`;});
  return <div className="balance-flow-chart"><svg viewBox="0 0 332 164" role="img" aria-label={`Bilinen tutarlarla bakiye çizgisi; en yüksek ödeme açığı ${money(flow.maxGap)}${flow.uncertain ? '. Sonuç kesin değil.' : ''}`}>
    <rect x="38" y={y(0)} width="282" height={Math.max(0,134-y(0))} fill="#fff0f2" />
    <line x1="38" y1={y(0)} x2="320" y2={y(0)} stroke="#b85065" strokeDasharray="3 3" />
    <text x="3" y={y(0)+4}>0 TL</text><text x="3" y="14">{Math.round(max/1000)} bin</text>
    <path d={path} stroke="#7352ad" strokeWidth="2.3" fill="none" />
    <text x="38" y="156">{shortBridgeDate(flow.days[0].date)}</text><text x="280" y="156">{shortBridgeDate(flow.days.at(-1).date)}</text>
  </svg><p>Mor: bilinen tutarlarla bakiye · Pembe alan: sıfırın altı</p></div>;
}

export default function BalanceFlowDetails({ summary, flow, funding, prefix, includeOverdue, onClose }) {
  const [selectedDate,setSelectedDate]=useState(null);
  const selected=flow.days.find(d=>d.date===selectedDate);
  return <div className="sheet-content">
    <div className="sheet-heading"><h2>Gün gün bakiye akışı</h2><button className="icon-button" aria-label="Kapat" onClick={onClose}><Icon name="x" /></button></div>
    <p className="bridge-detail-copy">{formatDateTR(summary.start)} – {formatDateTR(summary.end)}</p>
    {!funding.fresh ? <p className="notice">{funding.reason==='records' ? 'Finans kayıtları bakiyeden sonra değişti.' : 'Güncel kullanılabilir bakiye bilinmiyor; boş bakiye sıfır varsayılmadı.'} Güncel bakiyeyi doğrulamadan kesin açık göstermiyoruz.</p> : <>
      <div className="flow-stats"><div><small>En yüksek ödeme açığı</small><strong className="flow-negative">{prefix}{money(flow.maxGap)}</strong></div><div><small>Dönem sonu tahmini bakiye</small><strong>{flow.uncertain ? 'Kesinleşmedi' : signed(flow.ending)}</strong></div></div>
      {flow.firstGap && <p className="notice">{shortBridgeDate(flow.firstGap.date)}: {prefix}{money(flow.firstGap.amount)} {flow.firstGap.conditional ? 'gün içinde gerekebilir; ödemeler gelirden önce çekilirse.' : `bilinen ödemelerle ilk açık.${flow.recoveryDate ? ` ${shortBridgeDate(flow.recoveryDate)} beklenen geliriyle kapanabilir.` : ' Seçili dönemde kapanmıyor.'}`}</p>}
      {flow.days.length>0 && <FlowChart flow={flow} available={funding.amount} />}
    </>}
    {flow.unknownPayments>0 && <p className="notice">{flow.unknownPayments} ödeme tutarı eksik. Açık artabilir veya daha erken oluşabilir; dönem sonu bakiye kesin değil.</p>}
    {flow.unverified && <p className="notice">Bilgisi veya ödeme durumu doğrulanması gereken kayıtlar var; beklenen gelirlerin ve açığın kesinleşmesi için bunları kontrol et.</p>}
    {summary.overdueCount>0 && <p className="bridge-detail-copy">{includeOverdue ? `${flow.overdue.length} kayıtlı geciken ödeme (${money(flow.overdueAmount)} bilinen tutar) bugün ödenecek varsayıldı; asıl vadeleri aşağıda korunuyor.` : `${summary.overdueCount} geciken ödeme bu akışa dahil değil.`} Üst dönem farkı gecikenleri içermez.</p>}
    <div className="flow-day-calculation" aria-live="polite">{selected ? <><strong>{formatDateTR(selected.date)} hesabı</strong>{funding.fresh ? <><p>Başlangıç: {signed(selected.opening)}</p><p>Ödeme: −{money(selected.outgoing)} · Beklenen gelir: +{money(selected.incoming)}</p><p>Gün sonu: {signed(selected.closing)}</p>{selected.conditional && <p>Ödemeler önce çekilirse {money(-selected.low)} gerekir; gelirin hesaba geçiş saati bilinmiyor.</p>}</> : <p>Ödeme: {money(selected.outgoing)} · Beklenen gelir: {money(selected.incoming)}. Güncel bakiye olmadan kalan tutar hesaplanmadı.</p>}{selected.unknown && <p>Bu günün eksik tutarı var; hesap kesin değil.</p>}</> : 'Bir güne dokun; gelir, ödeme ve kalan tutarı gör.'}</div>
    <ul className="flow-days">{flow.days.filter(d=>d.events.length>0).map(d=><li key={d.date}>
      <button className="flow-day" aria-pressed={selectedDate===d.date} onClick={()=>setSelectedDate(d.date)}>
        <span className="flow-date">{shortBridgeDate(d.date)}</span><span className="flow-events">{d.events.map((row,i)=><span key={`${row.recordType}:${row.id}:${i}`}><b>{row.title}</b><small>{row.isOverdue ? `Geciken · Asıl vade: ${formatDateTR(row.dueDate)} · Bugün ödenirse` : row.direction==='in' ? 'Beklenen gelir' : 'Ödeme'} · {row.needsCardAmount || row.amount==null || !Number.isFinite(Number(row.amount)) || Number(row.amount)<0 ? 'Tutar eksik' : money(Number(row.amount))}</small></span>)}</span><strong className={d.closing<0 ? 'flow-negative' : ''}>{funding.fresh ? signed(d.closing) : '—'}</strong>
      </button>
    </li>)}</ul>
    {flow.entries.length===0 && <p className="bridge-detail-copy">Seçili aralıkta planlı hareket yok.</p>}
    <details className="flow-help"><summary>Bu hesap nasıl çalışıyor?</summary><p>Güncel bakiyeden ödemeler düşülür, beklenen gelirler yalnız kendi gününde eklenir. Alınmış gelirler ve ödenmiş kayıtlar tekrar sayılmaz. Karttan ödenen abonelikler ayrıca nakit çıkışı sayılmaz.</p><p>Aynı gün gelir ve ödeme varsa saat sırası bilinmediğinden önce ödeme çıkışı varsayılır. Gün içindeki ihtiyaç ile gün sonu bakiye farklı olabilir.</p><p>Gecikenler seçilirse yalnız kayıtlı bekleyen ödemeler bugün ödenecek varsayılır. Geçmiş aylara yeni gider üretilmez; vade ve durumlar değişmez. Beklenen gelirin gecikmesi ve eksik tutarlar sonucu değiştirebilir.</p></details>
    <button className="primary-button" onClick={onClose}>Anladım</button>
  </div>;
}
