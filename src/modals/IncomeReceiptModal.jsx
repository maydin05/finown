import React, { useRef } from 'react';
import { useData } from '../context/store';
import { FormModal } from '../components/ui/FormModal';
import { incomeReceiptInput } from '../domain/incomeReceipts';
import { calendarDate } from '../domain/finance';
import { formatMoneyTR } from '../utils';

export default function IncomeReceiptModal({ item, onClose, onSaved }) {
  const { saveIncomeReceipt } = useData();
  const amountInput = useRef(null);
  const noteInput = useRef(null);
  const period = calendarDate(item.dueDate || item.date)?.toLocaleDateString('tr-TR',{month:'long',year:'numeric'});
  const expected = item.expectedAmount ?? item.amount;
  return <FormModal title={item.isReceived ? 'Alınan tutarı düzenle' : 'Gelir alındı'} subtitle={`${period} · ${item.title}`} tone="income" icon="arrow-up-right" onClose={onClose}
    saveLabel={item.isReceived ? 'Bu ayın tutarını kaydet' : 'Alınan tutarı kaydet'}
    onSave={async () => { await saveIncomeReceipt(incomeReceiptInput(item,amountInput.current.value,noteInput.current.value)); onSaved?.(); onClose(); }}>
    <div className="form-fields">
      <p className="form-context">Bu ay planlanan: ₺{formatMoneyTR(expected)}. Yalnız {period} için gerçek alınan tutarı kaydediyorsun.</p>
      <div><label htmlFor="income-receipt-amount">Alınan tutar (₺)</label><input id="income-receipt-amount" type="number" min="0" max="999999999999.99" step="0.01" inputMode="decimal" ref={amountInput} defaultValue={item.actualAmount ?? item.expectedAmount ?? item.amount} /></div>
      <div><label htmlFor="income-receipt-note">Kesinti / ek mesai notu (isteğe bağlı)</label><textarea id="income-receipt-note" maxLength={2000} ref={noteInput} defaultValue={item.receiptNote || ''} placeholder="Örn. kesinti veya ek mesai" /></div>
      <p className="footnote">Diğer aylar ve maaş planın değişmez. Bu işlem banka bakiyeni otomatik artırmaz; kayıt sonrası kullanılabilir bakiyeni yeniden doğrulaman gerekir.</p>
    </div>
  </FormModal>;
}
