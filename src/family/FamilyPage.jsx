// Development-only wrapper. Production uses FamilyServer + FamilyWorkspace directly.
import React,{useCallback,useMemo,useState} from 'react';
import {useData} from '../context/store';
import {useBalanceFingerprint} from '../hooks/useBalanceFingerprint';
import {localToday,newFamily} from './model';
import {demoEnvironment,personalEnvironment,seededDemo} from './environment';
import {localFamilyRepository} from './repository';
import {FamilyWorkspace} from './FamilyWorkspace';
import FamilyServer from './FamilyServer';
const emptyData={};
export default function FamilyPage({auth}) {
 const data=useData() || emptyData;
 const fingerprint=useBalanceFingerprint(data);
 const [mode,setMode]=useState('demo');
 const today=localToday(),demo=useMemo(()=>demoEnvironment(today),[today]);
 const id=mode==='demo'?'demo-workspace':`private:${data.userId || 'local-user'}`;
 const repo=useMemo(()=>mode==='server'?null:localFamilyRepository(id,()=>mode==='demo'?seededDemo(id,demo):newFamily(id)),[id,mode,demo]);
 const environmentForState=useCallback(state=>mode==='demo'?demo:personalEnvironment(data,state?.scope || [],fingerprint,today),[mode,demo,data,fingerprint,today]);
 if(mode==='server')return <FamilyServer auth={auth} onBack={()=>setMode('demo')}/>;
 return <FamilyWorkspace key={id} id={id} data={data} mode={mode} onMode={setMode} injectedRepository={repo} environmentForState={environmentForState}/>;
}
