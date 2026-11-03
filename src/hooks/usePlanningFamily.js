import { useEffect, useState } from 'react';
import { familyRequest } from '../family/serverRepository';
import { personalEnvironment } from '../family/environment';
import { familyProtection } from '../domain/spendingPlan';

// Read-only existing endpoints, with fresh membership checks on every poll.
export function usePlanningFamily(data, fingerprint, today) {
  const [loaded,setLoaded] = useState(null);
  const cardTiming = JSON.stringify((data.products || []).map(p=>[p.id,p.cutoffDay]));
  const key = `${data.userId}:${data.sharedBudgetId || ''}:${fingerprint}:${cardTiming}:${JSON.stringify(data.availableBalance)}:${today}`;
  const fixture = data.planningFamily;
  const userId = data.userId, sharedBudgetId = data.sharedBudgetId;
  useEffect(() => {
    if (fixture !== undefined || !userId || !fingerprint) return;
    let alive = true, busy = false;
    const refresh = async () => {
      if (busy) return;
      busy = true;
      try {
        const budgets = sharedBudgetId ? [{id:sharedBudgetId}] : await familyRequest('/budgets');
        const states = await Promise.all(budgets.map(b => familyRequest(`/budgets/${b.id}`)));
        if (alive) setLoaded({key,protection:familyProtection(states,today, state => personalEnvironment(data,state.scope,fingerprint,today))});
      } catch { if (alive) setLoaded({key,protection:{rows:[],buffer:0,reasons:['Ortak bütçe rezervleri doğrulanamadı.']}}); }
      finally { busy = false; }
    };
    refresh(); const timer = setInterval(refresh,5000);
    return () => {alive=false;clearInterval(timer);};
  // Data used by the request is completely identified by its financial key.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[fixture,userId,sharedBudgetId,fingerprint,today,key]);
  if (fixture !== undefined) return fixture;
  return loaded?.key === key ? loaded.protection : {rows:[],buffer:0,reasons:['Ortak bütçe rezervleri kontrol ediliyor.']};
}
