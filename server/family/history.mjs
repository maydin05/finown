import {calendarDate,dateKey,sourceItems,sourceIssue,sourceStatus,legacyOwners} from '../../src/domain/finance.js';
const groups=[['incomeSources','income'],['expenseSources','expense'],['subscriptionSources','subscription']];
const safeMonth=value=>/^\d{4}-(0[1-9]|1[0-2])$/.test(value) && calendarDate(value+'-01');
const cycles={monthly:'Aylık',quarterly:'Üç ayda bir','semi-annual':'Altı ayda bir',annual:'Yıllık'};
const paymentType=value=>({loan:'Kredi taksiti',card:'Kart ekstresi',cash:'Nakit'}[value] || 'Diğer ödeme');
const types={income:'Gelir',expense:'Gider',subscription:'Abonelik',payment:'Ödeme',product:'Banka ürünü'};
const d=(label,value,type='text')=>({label,value:value ?? null,type});
// Explicit DTO: never return user IDs, raw trackers, unselected parent/card metadata or fingerprints.
export function sharedHistory(data,scope,today,period='') {
 if(period && !safeMonth(period))throw new Error('Geçerli bir ay seç.');
 const selected=new Set(scope),pick=table=>(data[table] || []).filter(r=>selected.has(`${table}:${r.id}`));
 const products=pick('products'),tracker=data.statusTracker || {},owners=legacyOwners(data),rows=[],sources=[],years=new Set();
 const currentYear=calendarDate(today).getFullYear();for(let y=currentYear-5;y<=currentYear+5;y++)years.add(String(y));
 const productName=id=>id==null ? null : products.find(p=>String(p.id)===String(id))?.name || 'Ürün paylaşılmıyor';
 for(const p of pick('payments')) {
  const date=dateKey(p.dueDate || p.date) || null;if(date)years.add(date.slice(0,4));
  const row={key:`payment:${p.id}`,kind:'payment',title:p.title || 'Ödeme',date,amount:p.amount ?? null,status:p.isPaid?'paid':'unpaid',details:[d('Ödeme tarihi',date,'date'),d('Tutar',p.amount,'money'),d('Açıklama',p.subtitle),d('Ürün',productName(p.productId)),d('Ödeme türü',paymentType(p.type))]};
  if(!period || date?.startsWith(period))rows.push(row);
 }
 for(const [table,kind] of groups)for(const source of pick(table)) {
  const key=`${table}:${source.id}`,excluded=kind==='expense' && !!tracker[`expense_excluded:${source.id}`],archived=kind==='subscription' && !!tracker[`sub_archived_${source.id}`];
  const common={kind,title:source.title || types[kind],excluded,archived};
  const details=[d('Planlanan tutar',source.amount,'money'),d('Başlangıç',source.startDate || source.date,'date'),d('Bitiş',source.endDate,'date'),d('Ayın ödeme günü',source.dayOfMonth),d('Tekrar',source.type==='one-time'?'Tek seferlik':cycles[source.billingCycle] || (source.type==='recurring' || kind==='subscription'?'Aylık':'Türü doğrulanmalı')),d('Kategori',source.category),d('Kaynak notu',source.note),d('Kart',productName(source.relatedCardId)),d('Borç kaydı',source.isDebt?'Evet':'Hayır')];
  sources.push({...common,key,date:source.startDate || source.date || null,amount:source.amount ?? null,status:'plan',issue:sourceIssue(source,kind),details});
  const receipts=(kind==='income'?data.incomeReceipts || []:kind==='subscription'?data.subscriptionPayments || []:[]).filter(r=>String(r.incomeId ?? r.subscriptionId)===String(source.id));
  const dates=[source.type==='one-time'?source.date:source.startDate || source.date,source.endDate || today,...receipts.map(r=>`${r.periodYear}-${String(r.periodMonth).padStart(2,'0')}-01`)];
  for(const k of Object.keys(tracker)) {
   const canonical=k.match(new RegExp(`^${kind}:${source.id}:(\\d{4}):(\\d{1,2})$`));
   const legacy=k.match(new RegExp(`^${source.id}_(\\d{1,2})_(\\d{4})$`));
   if(canonical)dates.push(`${canonical[1]}-${String(canonical[2]).padStart(2,'0')}-01`);
   if(legacy)dates.push(`${legacy[2]}-${String(Number(legacy[1])+1).padStart(2,'0')}-01`);
  }
  const valid=dates.map(calendarDate).filter(Boolean),months=new Set();
  for(const date of valid)years.add(String(date.getFullYear()));
  if(valid.length){const first=Math.min(...valid.map(d=>d.getFullYear())),last=Math.max(...valid.map(d=>d.getFullYear()));if(last-first<=100)for(let y=first;y<=last;y++)years.add(String(y));}
  if(period)months.add(period);
  else if(valid.length) {
   const min=Math.min(...valid.map(v=>v.getFullYear()*12+v.getMonth())),max=Math.max(...valid.map(v=>v.getFullYear()*12+v.getMonth()));
   if(max-min>1200)throw new Error('Bu kayıt için tarih aralığı çok geniş. Bir ay seçerek görüntüle.');
   for(let m=min;m<=max;m++)months.add(`${Math.floor(m/12)}-${String(m%12+1).padStart(2,'0')}`);
  }
  const historyTracker={...tracker};delete historyTracker[`expense_excluded:${source.id}`];
  for(const month of months) {
   const date=calendarDate(month+'-01');if(!date)continue;
   let item=sourceItems([source],historyTracker,date,kind,data.subscriptionPayments,owners,data.incomeReceipts)[0];
   const saved=receipts.find(r=>Number(r.periodYear)===date.getFullYear() && Number(r.periodMonth)===date.getMonth()+1);
   if(!item && saved) {item={...source,dueDate:saved.dueDate,amount:saved.isReceived?saved.actualAmount:saved.expectedAmount ?? source.amount,expectedAmount:saved.expectedAmount,actualAmount:saved.actualAmount,receiptNote:kind==='income'?saved.note:null,note:kind==='subscription'?saved.note:source.note,isReceived:saved.isReceived,isPaid:saved.isPaid,paidDate:saved.paidDate,hasAmbiguousStatus:false};}
   if(!item) {
    const tracked=sourceStatus(kind,source.id,date,tracker,owners),typed=`${kind}:${source.id}:${date.getFullYear()}:${date.getMonth()+1}`,legacy=`${source.id}_${date.getMonth()}_${date.getFullYear()}`;
    if(Object.hasOwn(tracker,typed) || (Object.hasOwn(tracker,legacy) && owners[source.id]?.includes(kind))) {
     item={dueDate:null,amount:null,isReceived:tracked.done,isPaid:tracked.done,hasAmbiguousStatus:tracked.ambiguous};
    }
   }
   if(!item)continue;
   const actual=saved?.actualAmount ?? null,expected=saved?.expectedAmount ?? source.amount;
   const done=kind==='income'?item.isReceived:item.isPaid;
   const status=item.hasAmbiguousStatus?'uncertain':done?(kind==='income'?'received':'paid'):(kind==='income'?'expected':'unpaid');
   rows.push({...common,issue:!item.dueDate?'Yalnız dönem durumu kayıtlı; asıl tarih ve tutar ayrıca saklanmamış.':null,key:`${key}:${month}`,date:item.dueDate || null,period:month,amount:kind==='subscription' && done && actual!=null?actual:item.amount ?? null,status,
    details:[d('Dönem',month),d(kind==='income'?'Gelir tarihi':'Ödeme tarihi',item.dueDate,'date'),d('Planlanan tutar',source.amount,'money'),d('Beklenen tutar',expected,'money'),d('Gerçekleşen tutar',actual,'money'),d('Ödendiği tarih',saved?.paidDate,'date'),d('Dönem notu',kind==='income'?item.receiptNote:saved?.note),...details.filter(x=>x.label!=='Planlanan tutar')]
   });
  }
 }
 for(const p of products)sources.push({key:`products:${p.id}`,kind:'product',title:p.name || 'Banka ürünü',date:p.startDate || p.firstPaymentDate || null,amount:p.remaining ?? null,status:'plan',details:[d('Ürün türü',p.type==='loan'?'Kredi':p.type==='card'?'Kredi kartı':p.type),d('Kalan borç',p.remaining,'money'),d('Toplam tutar',p.total,'money'),d('Kayıtlı limit',p.limit,'money'),d('Aylık taksit',p.installmentAmount ?? p.installment,'money'),d('Taksit sayısı',p.totalInstallments),d('İlk taksit',p.firstPaymentDate,'date'),d('Kesim günü',p.cutoffDay),d('Son ödeme günü',p.paymentDueDay),d('Ana kart',productName(p.parentCardId)),d('Son dört hane',p.last4Digits)]});
 rows.sort((a,b)=>(b.date || '').localeCompare(a.date || '') || a.key.localeCompare(b.key));
 return {period,today,rows,sources,years:[...years].sort((a,b)=>Number(b)-Number(a))};
}
