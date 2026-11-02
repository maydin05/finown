import {useEffect,useState} from 'react';
const money=value=>value==null?'Tutar kaydı yok':new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(value);
const date=value=>{if(!value)return 'Tarih kaydı yok';const parsed=new Date(value+'T12:00:00');return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime())?new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric'}).format(parsed):'Geçersiz tarih';};
const kinds={income:'Gelir',payment:'Ödeme',expense:'Gider',subscription:'Abonelik',product:'Banka ürünü'};
const statuses={received:'Alındı',paid:'Ödendi',unpaid:'Ödenmedi',expected:'Bekleniyor',uncertain:'Durum belirsiz',plan:'Kaynak / plan'};
function valueOf(field){return field.value==null || field.value===''?'Kaydedilmedi':field.type==='money'?money(field.value):field.type==='date'?date(field.value):String(field.value);}
export default function FamilyHistory({repository,revision}) {
 const [result,setResult]=useState(null),[error,setError]=useState(''),[period,setPeriod]=useState(''),[kind,setKind]=useState(''),[status,setStatus]=useState(''),[search,setSearch]=useState(''),[view,setView]=useState('rows'),[page,setPage]=useState(0);
 useEffect(()=>{
  let alive=true;
  const load=()=>repository.loadHistory(period).then(data=>{if(alive){setResult({...data,revision});setError('');}}).catch(()=>{if(alive){setResult(null);setError('Detaylar yüklenemedi veya erişimin sona erdi. Bir ay seçerek yeniden deneyebilirsin.');}});
  load();const timer=setInterval(load,5000);
  return()=>{alive=false;clearInterval(timer);};
 },[repository,period,revision]);
 const change=(setter,value)=>{setter(value);setPage(0);};
 const visible=result?.revision===revision?result:null;
 const list=(visible?.[view] || []).filter(r=>(!kind || r.kind===kind) && (view==='sources' || !status || r.status===status) && (!search || `${r.title} ${r.details.map(d=>d.value ?? '').join(' ')}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))));
 const pages=Math.max(1,Math.ceil(list.length/30)),current=Math.min(page,pages-1);
 return <section className="family-readonly" aria-label="Gelir ve ödeme detayları">
  <h2>Geçmiş ve detaylar</h2><p className="family-muted">Yalnız görüntüleme. Tutarlar, tarihler ve ödeme durumları bu ekrandan değiştirilemez. Yalnız ortak bütçeye seçilmiş kayıtlar gösterilir.</p>
  <div className="family-tabs" aria-label="Detay görünümü">{[['rows','Hareketler'],['sources','Kaynaklar ve planlar']].map(([key,label])=><button key={key} aria-pressed={view===key} onClick={()=>change(setView,key)}>{label}</button>)}</div>
  <div className="family-history-filters">
   <label className="family-field">Kayıt ara<input type="search" value={search} onChange={e=>change(setSearch,e.target.value)} placeholder="Maaş, kira, kart…"/></label>
   <label className="family-field">Kayıt türü<select aria-label="Kayıt türü" value={kind} onChange={e=>change(setKind,e.target.value)}><option value="">Tüm türler</option>{Object.entries(kinds).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
   {view==='rows' && <><label className="family-field">Dönem<input type="month" value={period} onChange={e=>{change(setPeriod,e.target.value);setResult(null);}}/></label><label className="family-field">Kayıt durumu<select aria-label="Kayıt durumu" value={status} onChange={e=>change(setStatus,e.target.value)}><option value="">Tüm durumlar</option>{Object.entries(statuses).filter(([key])=>key!=='plan').map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><button className="secondary-button" onClick={()=>{change(setPeriod,'');if(period)setResult(null);}}>Tüm tarihler</button></>}
  </div>
  {view==='rows' && <p className="family-muted">{period || 'Tüm tarihler'} · Ödenmiş ve alınmış kayıtlar da dahildir. Süresiz planlar bu aya kadar listelenir; daha ileri bir dönem için ay seç. Karttan ödenen abonelikler de gösterilir; bu liste bir toplam hesabı değildir.</p>}
  {error && <p className="family-error" role="alert">{error}</p>}
  {!visible && !error && <p role="status">Detaylar yükleniyor…</p>}
  {visible && <><p role="status">{list.length} kayıt · Sayfa {current+1}/{pages}</p>
   {!list.length && <p>Bu filtrelerle kayıt bulunamadı.</p>}
   <ul className="family-readonly-list" aria-label="Paylaşılan finans kayıtları">{list.slice(current*30,(current+1)*30).map(row=><li key={row.key}><details className="family-card">
    <summary><span><strong>{row.title}</strong><small>{kinds[row.kind]} · {date(row.date)}</small><span className={`family-status ${['paid','received'].includes(row.status)?'status-approved':''}`}>{statuses[row.status]}</span>{row.excluded && <span className="family-status">Toplam dışında</span>}{row.archived && <span className="family-status">Arşivli</span>}</span><b>{money(row.amount)}</b></summary>
    {row.issue && <p className="family-muted">{row.issue}</p>}
    {row.status==='received' && row.details.some(d=>d.label==='Gerçekleşen tutar' && d.value==null) && <p className="family-muted">Alındı durumu kayıtlı; gerçek tutar ayrıca kaydedilmemiş. Görünen tutar plan tutarıdır.</p>}
    <dl>{row.details.map((field,i)=><div key={i}><dt>{field.label}</dt><dd>{valueOf(field)}</dd></div>)}</dl>
   </details></li>)}</ul>
   {pages>1 && <nav className="family-actions" aria-label="Kayıt sayfaları"><button className="secondary-button" disabled={current===0} onClick={()=>setPage(current-1)}>Önceki</button><button className="secondary-button" disabled={current===pages-1} onClick={()=>setPage(current+1)}>Sonraki</button></nav>}
  </>}
 </section>;
}
