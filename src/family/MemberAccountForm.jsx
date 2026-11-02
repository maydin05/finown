import {useRef,useState} from 'react';
export default function MemberAccountForm({onCreate,requiresBudget=false}) {
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef(false);
 async function submit(event) {
  event.preventDefault();if(pending.current || requiresBudget)return;
  pending.current=true;setBusy(true);setError('');
  try {await onCreate({email:email.trim(),password});}
  catch(e){setError(e.message || 'İşlem tamamlanamadı.');}
  finally {setPassword('');setShow(false);pending.current=false;setBusy(false);}
 }
 return <details className="family-card"><summary>Eşim için hesap oluştur</summary>
  <form className="family-fields" onSubmit={submit}>
   {requiresBudget && <p className="family-muted">Önce yukarıdaki “Ortak bütçe oluştur” düğmesiyle bütçeni oluştur. Ardından hesabı bütçeye ekleyebilirsin.</p>}
   <p className="family-muted">Eşin bu bilgilerle giriş yapar ve ortak bütçeye doğrudan katılır. Doğrulama e-postası gönderilmez. Yalnız seçtiğin kayıtları ve ortak talep geçmişini görebilir.</p>
   <label className="family-field">Eşinin e-posta adresi<input type="email" autoComplete="off" required maxLength={254} disabled={busy} value={email} onChange={e=>setEmail(e.target.value)}/></label>
   <label className="family-field">Başlangıç şifresi<input type={show?'text':'password'} autoComplete="new-password" required minLength={10} maxLength={72} disabled={busy} value={password} onChange={e=>setPassword(e.target.value)}/></label>
   <small>En az 10 karakter. Bu şifreyi eşinle kendin paylaş.</small>
   <label className="family-check"><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/>Şifreyi göster</label>
   {error && <p className="family-error" role="alert">{error}</p>}
   <button type="submit" className="primary-button" disabled={busy || requiresBudget}>{busy?'Hesap oluşturuluyor…':'Hesabı oluştur ve bütçeye ekle'}</button>
  </form>
 </details>;
}
