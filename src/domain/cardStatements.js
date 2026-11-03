// First statement month limits placeholders only; recorded payment history is authoritative.
export function normalizeStatementMonth(value) {
  if(value==null || value==='')return null;
  if(typeof value!=='string' || !/^(?:19\d{2}|[2-9]\d{3})-(?:0[1-9]|1[0-2])(?:-01)?$/.test(value))
    throw Object.assign(new Error('Invalid first statement month'),{userMessage:'İlk ekstre için yıl ve ayı birlikte seç; bilinmiyorsa ikisini de boş bırak.'});
  return value.slice(0,7)+'-01';
}
export function cardStatementIssue(card) {
  try {normalizeStatementMonth(card.firstStatementMonth);return null;}
  catch {return 'İlk ekstre ayı doğrulanmalı';}
}
export function statementMonthAllows(card,year,monthIndex) {
  if(card.firstStatementMonth==null || card.firstStatementMonth==='')return true;
  try {const start=normalizeStatementMonth(card.firstStatementMonth);return year*12+monthIndex >= Number(start.slice(0,4))*12+Number(start.slice(5,7))-1;}
  catch {return false;}
}
export function statementMonthLabel(value) {
  try {const month=normalizeStatementMonth(value);return month ? new Date(Number(month.slice(0,4)),Number(month.slice(5,7))-1,1).toLocaleDateString('tr-TR',{month:'long',year:'numeric'}) : 'Belirtilmedi';}
  catch {return 'Doğrulanmalı';}
}
export function cardProductInput(item) {
  if(item.cardType==='virtual' || item.parentCardId)return {...item,firstStatementMonth:null};
  if(!Object.hasOwn(item,'firstStatementMonth'))return {...item};
  return {...item,firstStatementMonth:normalizeStatementMonth(item.firstStatementMonth)};
}
