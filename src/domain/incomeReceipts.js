import { calendarDate, dateKey } from './finance.js';

export function incomeReceiptInput(item, amount, note = '', isReceived = true) {
  const actualAmount = typeof amount === 'string' && !amount.trim() ? NaN : Number(amount);
  const dueDate = dateKey(item.dueDate || item.date);
  const date = calendarDate(dueDate);
  const expectedAmount = Number(item.expectedAmount ?? item.amount);
  if (amount == null || !Number.isFinite(actualAmount) || actualAmount < 0 || actualAmount >= 1e12 || Math.abs(actualAmount*100-Math.round(actualAmount*100)) > 0.00001)
    throw Object.assign(new Error('Invalid amount'), { userMessage: 'Alınan tutarı sıfır veya pozitif, en fazla iki ondalıkla gir.' });
  if (!date || !Number.isSafeInteger(Number(item.id)) || Number(item.id) <= 0 || !Number.isFinite(expectedAmount) || expectedAmount < 0 || expectedAmount >= 1e12 || note.length > 2000)
    throw Object.assign(new Error('Invalid receipt'), { userMessage: 'Gelir kaydı veya notu doğrulanamadı.' });
  return { incomeId: Number(item.id), periodYear: date.getFullYear(), periodMonth: date.getMonth()+1, dueDate, expectedAmount, actualAmount: Math.round(actualAmount*100)/100, note, isReceived };
}
