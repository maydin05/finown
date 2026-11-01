import { useMemo } from 'react';
import { useData } from '../context/store';
import { sourceItems } from '../domain/finance';

export const useViewData = (sources, tracker, viewDate, type, subscriptionPayments = []) => {
    const { trackerOwners, incomeReceipts } = useData();
    return useMemo(() => sourceItems(sources, tracker, viewDate, type, subscriptionPayments, trackerOwners, incomeReceipts),
        [sources, tracker, viewDate, type, subscriptionPayments, trackerOwners, incomeReceipts]);
};
