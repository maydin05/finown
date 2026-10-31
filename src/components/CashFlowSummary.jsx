import React, { useMemo, useState } from 'react';
import { useData } from '../context/store';
import { cashFlow } from '../domain/finance';
import { formatDateTR, formatMoneyTR } from '../utils';

export function CashFlowPanel({ data, today = new Date(), onEnterStatement }) {
    const [days, setDays] = useState(7);
    const summary = useMemo(() => cashFlow(data, today, days), [data, today, days]);
    return (
        <section className="mx-1 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm" aria-label="Yaklaşan ödeme ve gelir özeti">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-gray-900">Önümüzdeki günler</h3>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl" aria-label="Özet dönemi">
                    {[7, 30].map(value => <button key={value} aria-pressed={days === value} onClick={() => setDays(value)}
                        className={`px-3 py-2 rounded-lg text-sm font-bold ${days === value ? 'bg-gray-900 text-white' : 'text-gray-600'}`}>{value} gün</button>)}
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Bugünden itibaren · {formatDateTR(summary.start)} – {formatDateTR(summary.end)} · Ay seçiminden bağımsız</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-emerald-50 p-3 rounded-xl"><p className="text-xs text-emerald-800">Beklenen gelir</p><p className="font-bold text-emerald-900 break-words">₺{formatMoneyTR(summary.income)}</p></div>
                <div className="bg-rose-50 p-3 rounded-xl"><p className="text-xs text-rose-800">Bilinen ödemeler</p><p className="font-bold text-rose-900 break-words">₺{formatMoneyTR(summary.expense)}</p></div>
            </div>
            <div className="mt-2 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600">Beklenen gelir − bilinen ödemeler</p>
                <p className={`text-xl font-bold ${summary.difference < 0 ? 'text-rose-700' : 'text-gray-900'}`}>{summary.difference > 0 ? '+' : ''}₺{formatMoneyTR(summary.difference)}</p>
                <p className="text-xs text-gray-500 mt-1">Bu fark mevcut bakiye veya harcanabilir para değildir. Alınmış gelir ve ödenmiş kayıtlar dahil değil.</p>
            </div>
            {(summary.missing.length > 0 || summary.incomplete.length > 0 || summary.ambiguous > 0) && (
                <div role="status" className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
                    {summary.missing.length > 0 && <p>{summary.missing.length} kart ekstresinin tutarı eksik. Toplam kesinleşmedi.</p>}
                    {summary.incomplete.length > 0 && <p>{summary.incomplete.length} kaydın tarih / tür / tutar bilgisi doğrulanmalı; toplam dışında tutuldu.</p>}
                    {summary.ambiguous > 0 && <p>{summary.ambiguous} kaydın eski ödeme durumu doğrulanmalı; ödenmemiş olarak listeleniyor.</p>}
                </div>
            )}
            {summary.overdueCount > 0 && <p className="mt-3 text-xs text-rose-800">Ayrıca önceki tarihlerden {summary.overdueCount} ödenmemiş ödeme kaydı var (₺{formatMoneyTR(summary.overdueTotal)}). Bu tutar yukarıdaki dönem farkına dahil değil.</p>}
            <p className="mt-3 text-xs text-gray-500">Bağlı kartı bulunan abonelikler ekstre üzerinden takip edilir; ödeme toplamına ayrıca eklenmez{summary.cardSubscriptions ? ` (${summary.cardSubscriptions} kayıt)` : ''}.</p>
            {summary.unlinkedCardSubscriptions > 0 && <p className="mt-2 text-xs text-amber-800">{summary.unlinkedCardSubscriptions} aboneliğin bağlı kartı / ana kartı doğrulanmalı. Bu abonelikler ayrıca toplamda sayılmıyor.</p>}
            <h4 className="font-semibold text-sm mt-4">Yaklaşan vadeler</h4>
            {summary.rows.length === 0 ? <p className="text-sm text-gray-500 mt-2">Bu aralıkta kayıtlı bekleyen gelir veya ödeme yok.</p> : (
                <ul className="mt-2 divide-y divide-gray-100 max-h-80 overflow-auto">
                    {summary.rows.map(item => <li key={`${item.recordType}:${item.id}:${item.dueDate}`} className="py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="text-sm font-semibold break-words">{item.title}</p>
                            <p className="text-xs text-gray-500">{formatDateTR(item.dueDate)} · {item.direction === 'in' ? 'Beklenen gelir' : item.direction === 'card' ? 'Karttan · ayrı toplanmadı' : 'Ödeme'}</p></div>
                        <div className="text-right shrink-0">
                            {item.needsCardAmount ? <><p className="text-xs text-amber-800">Tutar girilmedi</p>{onEnterStatement && <button className="text-xs text-blue-700 underline py-1" onClick={() => onEnterStatement(item)}>Ekstre tutarı gir</button>}</>
                                : <p className={`font-semibold text-sm ${item.direction === 'in' ? 'text-emerald-700' : 'text-gray-800'}`}>₺{formatMoneyTR(item.amount)}</p>}
                        </div>
                    </li>)}
                </ul>
            )}
        </section>
    );
}

export default function CashFlowSummary({ onOpenModal }) {
    const data = useData();
    return <CashFlowPanel data={data} onEnterStatement={item => onOpenModal('card_amount', item)} />;
}
