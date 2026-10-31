import { useMemo } from 'react';
import { useData } from '../context/store';
import { sourceItems } from '../domain/finance';

export const useViewData = (sources, tracker, viewDate, type, subscriptionPayments = []) => {
    const { trackerOwners } = useData();
    return useMemo(() => sourceItems(sources, tracker, viewDate, type, subscriptionPayments, trackerOwners),
        [sources, tracker, viewDate, type, subscriptionPayments, trackerOwners]);
};
