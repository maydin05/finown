// Local-only synthetic records. Never imported by the production app or migration.
import { balanceBasis,hashBalanceBasis } from '../../src/domain/availableBalance.js';
import { calendarDate,dateKey,monthDate } from '../../src/domain/finance.js';
import { plusDays } from '../../src/family/environment.js';
export async function seedLocalFinance(pool,userId,today) {
 if(!(await pool.query("select 1 from family_local.guard where name='finown-family-local'")).rowCount)throw new Error('Local guard required');
 const data={banks:[{id:1,name:'Yerel Örnek Banka'}],products:[
 {id:10,bankId:1,type:'card',name:'Yerel Kart A',cutoffDay:5,paymentDueDay:25},
 {id:11,bankId:1,type:'card',name:'Yerel Kart B',cutoffDay:15,paymentDueDay:10},
 {id:12,bankId:1,type:'card',cardType:'virtual',parentCardId:11,name:'Yerel Sanal Kart'},
 ],payments:[{id:990,title:'Yerel eski taksit',type:'loan',amount:500,dueDate:'2024-01-04',isPaid:true},{id:200,title:'Yerel zorunlu ödeme',type:'loan',amount:8000,dueDate:plusDays(today,2),isPaid:false},{id:201,title:'Yerel kira',type:'loan',amount:15000,dueDate:plusDays(today,8),isPaid:false},{id:202,title:'Yerel geciken ödeme',type:'loan',amount:1000,dueDate:plusDays(today,-3),isPaid:false}],incomeSources:[{id:102,title:'Yerel geçmiş maaş',type:'recurring',amount:25000,startDate:'2024-01-01',endDate:'2024-01-31',dayOfMonth:5},{id:101,title:'Yerel örnek maaş',type:'recurring',amount:25000,date:plusDays(today,4)}],expenseSources:[],subscriptionSources:[],subscriptionPayments:[],incomeReceipts:[{id:800,incomeId:102,periodYear:2024,periodMonth:1,dueDate:'2024-01-05',expectedAmount:25000,actualAmount:23000,isReceived:true,note:'Yerel geçmiş kesinti'}],statusTracker:{}};
 const date=calendarDate(today);let id=300;
 for(let i=0;i<4;i++)for(const card of data.products.filter(p=>!p.parentCardId))data.payments.push({id:id++,title:`${card.name} · yerel ekstre`,productId:card.id,type:'card',amount:0,isPaid:false,dueDate:dateKey(monthDate(date.getFullYear(),date.getMonth()+i,card.paymentDueDay))});
 for(const table of ['banks','products','payments','incomeSources','expenseSources','subscriptionSources','subscriptionPayments','incomeReceipts']) {
  const sqlName=table.replace(/[A-Z]/g,c=>'_'+c.toLowerCase());
  for(const row of data[table])await pool.query(`insert into ${sqlName}(user_id,data) values($1,$2)`,[userId,row]);
 }
 const fingerprint=await hashBalanceBasis(balanceBasis(data));
 await pool.query('insert into available_balances(user_id,data) values($1,$2)',[userId,{amount:18000,asOfDate:today,basisFingerprint:fingerprint,capturedAt:new Date().toISOString()}]);
}
