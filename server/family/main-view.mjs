import {legacyOwners} from '../../src/domain/finance.js';

// Whitelist the owner's explicitly selected records. Never send whole private rows.
const columns={
 banks:['id','name','color'],
 products:['id','bankId','type','name','cardType','last4Digits','limit','cutoffDay','paymentDueDay','parentCardId','total','remaining','installment','totalInstallments','startDate','installmentAmount','firstPaymentDate','firstStatementMonth'],
 payments:['id','productId','title','subtitle','amount','dueDate','type','isPaid','isManual'],
 incomeSources:['id','title','amount','type','category','date','startDate','dayOfMonth','endDate','note'],
 expenseSources:['id','title','amount','type','category','date','startDate','dayOfMonth','endDate','note','isDebt'],
 subscriptionSources:['id','title','amount','type','date','startDate','dayOfMonth','endDate','paymentMethodType','paymentMethodValue','relatedCardId','note','isVariable','billingCycle'],
 incomeReceipts:['id','incomeId','periodYear','periodMonth','dueDate','expectedAmount','actualAmount','isReceived','note'],
 subscriptionPayments:['id','subscriptionId','periodYear','periodMonth','expectedAmount','actualAmount','dueDate','paidDate','isPaid','note'],
};
const clean=(table,row)=>Object.fromEntries(columns[table].filter(k=>Object.hasOwn(row,k)).map(k=>[k,row[k]]));
export function sharedMainView(data,scope) {
 const selected=new Set(scope),out={readOnly:true,statusTracker:{}};
 for(const table of ['products','payments','incomeSources','expenseSources','subscriptionSources'])out[table]=(data[table] || []).filter(r=>selected.has(`${table}:${r.id}`)).map(r=>clean(table,r));
 const hasProduct=id=>out.products.some(p=>String(p.id)===String(id));
 for(const product of out.products)if(!hasProduct(product.parentCardId))product.parentCardId=null;
 for(const payment of out.payments)if(!hasProduct(payment.productId))payment.productId=null;
 for(const source of out.subscriptionSources)if(!hasProduct(source.relatedCardId))source.relatedCardId=source.relatedCardId ? 'unshared-card' : null;
 const bankIds=new Set(out.products.map(p=>String(p.bankId)));
 // Bank labels are dependencies of selected products/subscriptions, never an extra bank list.
 for(const source of out.subscriptionSources)if(source.paymentMethodType==='bank')bankIds.add(String(source.paymentMethodValue));
 out.banks=(data.banks || []).filter(b=>bankIds.has(String(b.id))).map(b=>clean('banks',b));
 for(const [table,sourceTable,idKey] of [['incomeReceipts','incomeSources','incomeId'],['subscriptionPayments','subscriptionSources','subscriptionId']])out[table]=(data[table] || []).filter(r=>out[sourceTable].some(s=>String(s.id)===String(r[idKey]))).map(r=>clean(table,r));
 const owners=legacyOwners(data),tracker=data.statusTracker || {};
 for(const [type,table] of [['income','incomeSources'],['expense','expenseSources'],['subscription','subscriptionSources']])for(const source of out[table]) {
  for(const [key,value] of Object.entries(tracker)) {
   if(key.startsWith(`${type}:${source.id}:`) || (type==='expense' && key===`expense_excluded:${source.id}`) || (type==='subscription' && key===`sub_archived_${source.id}`))out.statusTracker[key]=value;
   const match=key.match(/^(\d+)_(\d{1,2})_(\d{4})$/);
   if(!match || match[1]!==String(source.id) || Number(match[2])>11)continue;
   const canonical=`${type}:${source.id}:${match[3]}:${Number(match[2])+1}`;
   if(Object.hasOwn(tracker,canonical))continue;
   // Ambiguity is evaluated BEFORE filtering out private sources with colliding IDs.
   if(owners[source.id]?.length===1)out.statusTracker[canonical]=!!value;
   else out.statusTracker[`ambiguous:${canonical}`]=true;
  }
 }
 out.availableBalance=null;
 return out;
}
