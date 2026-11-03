import React,{useState} from 'react';
import {bankLogo} from '../../domain/bankIdentity';
import {Icon} from './Icon';
export default function BankMark({bank,fallback='landmark'}) {
  const src=bankLogo(bank?.name),[failed,setFailed]=useState(null);
  return <span className="movement-icon bank-logo" aria-hidden="true">
    {src && failed!==src ? <img src={src} alt="" width="28" height="28" decoding="async" onError={()=>setFailed(src)}/> : <Icon name={fallback} size={19}/>}
  </span>;
}
