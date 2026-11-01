import React, { useState } from 'react';
import { shortBridgeDate } from '../domain/incomeBridge';
import { balanceFunding } from '../domain/availableBalance';
import { balanceFlow } from '../domain/balanceFlow';
import { formatMoneyTR } from '../utils';
import { ModalShell } from './ui/Modal';
import { Icon } from './ui/Icon';
import AvailableBalanceModal from '../modals/AvailableBalanceModal';
import BalanceFlowDetails from './BalanceFlowDetails';

export default function IncomeBridge({ summary, snapshot, fingerprint, today, onSaveBalance }) {
  const [open,setOpen]=useState(false),[editing,setEditing]=useState(false),[includeOverdue,setIncludeOverdue]=useState(false);
  const funding=balanceFunding({amount:0,sameDayAmount:0,unknown:0,hasUnverifiedData:false},snapshot,fingerprint,today);
  const flow=balanceFlow(summary,funding.amount,includeOverdue);
  const money=n=>`₺${formatMoneyTR(n)}`;
  const prefix=flow.unverified ? 'Tahmini ' : flow.unknownPayments ? 'En az ' : '';
  const period=flow.days.length;
  let label,copy;
  if(!funding.fresh){
    label={missing:'Önce bakiyeni gir',date:'Bakiye güncel değil',records:'Bakiyeni yeniden doğrula',checking:'Bakiye doğrulanıyor',invalid:'Bakiye doğrulanmalı'}[funding.reason];
    const payments=flow.days.reduce((s,d)=>s+d.outgoing,0);
    copy=funding.reason==='records'?'Finans kayıtları değişti; kayıtlı bakiyeyi doğrula.':`${prefix}${money(payments)} ödeme için güncel bakiye gerekli.`;
  }else if(flow.firstGap){
    label=`${shortBridgeDate(flow.firstGap.date)} · ${prefix}${money(flow.firstGap.amount)}${flow.firstGap.conditional ? ' gerekebilir' : ' açık'}`;
    copy=flow.firstGap.conditional?'Ödemeler gelirden önce çekilirse gerekebilir · Akışı gör →':flow.recoveryDate?`${shortBridgeDate(flow.recoveryDate)} geliriyle kapanabilir · Akışı gör →`:'Seçili dönemde açık kapanmıyor · Akışı gör →';
  }else{label=flow.uncertain?'Açık henüz netleşmedi':`${period} günde açık görünmüyor`;copy='Bilinen tutarlara göre · Gün gün incele →';}
  return <>
    <section className={`funding-card ${!funding.fresh || flow.uncertain || flow.firstGap?.conditional ? 'uncertain' : !flow.firstGap ? 'covered' : ''}`} aria-label="Bakiye ve ödeme açığı">
      <div className="funding-header"><span>{period} günlük bakiye akışı</span><button className="balance-edit" aria-label="Kullanılabilir bakiyeyi düzenle" disabled={!onSaveBalance} onClick={()=>setEditing(true)}>{snapshot?.amount!=null ? `Bakiye ${money(snapshot.amount)} · ${shortBridgeDate(snapshot.asOfDate)}` : 'Bakiye ekle'} <Icon name="pencil" size={12}/></button></div>
      <button className="income-bridge" aria-label="Bakiye ve ödeme açığının ayrıntısı" onClick={()=>setOpen(true)}><span className="bridge-head"><strong className={!funding.fresh || !flow.firstGap ? 'bridge-empty' : ''}>{label}</strong><Icon name="arrow-right" size={17}/></span><span className="bridge-next">{copy}</span></button>
    </section>
    {summary.overdueCount>0 && <label className="flow-overdue-toggle"><span><b>{summary.overdueCount} geciken ödeme · {money(summary.overdueTotal)} bilinen</b><small>{includeOverdue?'Bugün ödenecek varsayıldı · Üst dönem özeti değişmez':'Bakiye akışına dahil et · Asıl vadeler korunur'}</small></span><input type="checkbox" aria-label="Geciken ödemeleri açığa kat" checked={includeOverdue} onChange={e=>setIncludeOverdue(e.target.checked)}/></label>}
    {editing && <AvailableBalanceModal snapshot={snapshot} fingerprint={fingerprint} today={today} onSave={onSaveBalance} onClose={()=>setEditing(false)}/>}
    {open && <ModalShell label="Bakiye ve ödeme açığı" onClose={()=>setOpen(false)}><BalanceFlowDetails summary={summary} flow={flow} funding={funding} prefix={prefix} includeOverdue={includeOverdue} onClose={()=>setOpen(false)}/></ModalShell>}
  </>;
}
