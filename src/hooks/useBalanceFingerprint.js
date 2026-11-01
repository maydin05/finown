import { useEffect, useState } from 'react';
import { balanceBasis, hashBalanceBasis } from '../domain/availableBalance';
export function useBalanceFingerprint(data) {
  const basis = balanceBasis(data);
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    hashBalanceBasis(basis).then(hash => { if (active) setResult({ basis, hash }); }).catch(() => { if (active) setResult(null); });
    return () => { active = false; };
  }, [basis]);
  return result?.basis === basis ? result.hash : null;
}
