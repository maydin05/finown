import React, { useState } from 'react';
import { FormModal } from '../components/ui/FormModal';
import { dateKey } from '../domain/finance';
import { validateBalance } from '../domain/availableBalance';

export default function AvailableBalanceModal({ snapshot, fingerprint, today, onSave, onClose }) {
  const [amount, setAmount] = useState(snapshot?.amount != null ? String(snapshot.amount) : '');
  const [asOfDate, setAsOfDate] = useState(dateKey(today));
  const [clear, setClear] = useState(false);
  return (
    <FormModal title="Kullanılabilir bakiye" subtitle="Elle girilen toplam para" tone="income" icon="wallet" onClose={onClose}
      saveLabel={clear ? 'Bakiyeyi kullanma' : 'Bakiyeyi kaydet'} disabled={!clear && !fingerprint}
      onSave={async () => {
        const validated = clear ? { amount: null, asOfDate: null } : validateBalance(amount, asOfDate, today);
        if (!clear && !fingerprint) throw Object.assign(new Error('Data is changing'), { userMessage: 'Veriler doğrulanıyor. Biraz sonra tekrar dene.' });
        await onSave({ ...validated, basisFingerprint: clear ? null : fingerprint });
        onClose();
      }}>
      <div className="form-fields">
        <p className="form-context">Şu an hesaplarında ve elinde harcayabileceğin toplam para. Kart limitini ve henüz alınmamış geliri ekleme.</p>
        <div><label htmlFor="available-balance-amount">Kullanılabilir para (₺)</label>
          <input id="available-balance-amount" type="number" min="0" max="999999999999.99" step="0.01" inputMode="decimal" value={amount} disabled={clear} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
        </div>
        <div><label htmlFor="available-balance-date">Bakiyenin geçerli olduğu gün</label>
          <input id="available-balance-date" type="date" max={dateKey(today)} value={asOfDate} disabled={clear} onChange={e => setAsOfDate(e.target.value)} />
        </div>
        <p className="form-context">Bakiyenin son işlemlerini içerdiğini kontrol et. Güncellediğin gün ve sonraki kayıt değişiklikleri dikkate alınır; banka bakiyen otomatik alınmaz.</p>
        {snapshot?.amount != null && <label className="balance-disable"><input type="checkbox" checked={clear} onChange={e => setClear(e.target.checked)} /> Kaydedilmiş bakiyeyi kullanma</label>}
        <p className="footnote">Bu işlem yalnız ayrı bakiye kaydını günceller. Ödeme kayıtları, tarihleri ve durumları değişmez. Kayıt başarısız olursa önceki bakiye korunur.</p>
      </div>
    </FormModal>
  );
}
