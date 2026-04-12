import { useMemo } from 'react';

export const useViewData = (sources, tracker, viewDate, type) => {
    return useMemo(() => {
        const currentMonth = viewDate.getMonth();
        const currentYear = viewDate.getFullYear();
        // Legacy system (GAS) likely operated in UTC or a timezone that flagged these dates as prev day.
        // But wait, if I change viewDate logic here, I change the "View Bucket".
        // viewDate comes from UI (selected month).
        // If I select "January", viewDate is Jan 1. getMonth() is 0.
        // I want to find items that match "January".

        let items = [];

        (sources || []).forEach((source) => {
            if (source.type === "one-time") {
                const iDate = new Date(source.date);
                // Use UTC to match legacy keys
                if (iDate.getUTCMonth() === currentMonth && iDate.getUTCFullYear() === currentYear) {
                    const key = `${source.id}_${currentMonth}_${currentYear}`;
                    const isDone = !!(tracker && tracker[key]);
                    items.push({
                        ...source,
                        trackerKey: key,
                        dueDate: source.date,
                        date: source.date,
                        isPaid: isDone,
                        isReceived: isDone,
                        isRecurring: false,
                        subtitle: "Tek Seferlik",
                        isManual: true,
                    });
                }
            } else if (source.type === "recurring") {
                // Determine start date. 'date' might be empty in new schema, 'startDate' is reliable.
                const startSource = source.startDate || source.date;
                const startDate = new Date(startSource);
                const endDate = source.endDate ? new Date(source.endDate) : null;

                // FIXED Logic: Use dayOfMonth if available, otherwise get from startDate.
                let dueDay = 1;
                if (source.dayOfMonth) {
                    dueDay = source.dayOfMonth;
                } else if (startSource) {
                    dueDay = new Date(startSource).getDate();
                }

                // Construct generated date in LOCAL time for UI display
                const generatedDate = new Date(currentYear, currentMonth, dueDay);
                generatedDate.setHours(0, 0, 0, 0);

                const startCompare = new Date(startDate);
                startCompare.setHours(0, 0, 0, 0);

                let isValid = generatedDate >= startCompare;

                // Billing cycle check (for subscriptions)
                if (isValid && source.billingCycle && source.billingCycle !== 'monthly') {
                    const startMonth = startDate.getMonth();
                    const startYear = startDate.getFullYear();
                    const monthsSinceStart = (currentYear - startYear) * 12 + (currentMonth - startMonth);
                    const interval = source.billingCycle === 'quarterly' ? 3
                        : source.billingCycle === 'semi-annual' ? 6
                        : source.billingCycle === 'annual' ? 12 : 1;
                    if (monthsSinceStart < 0 || monthsSinceStart % interval !== 0) {
                        isValid = false;
                    }
                }

                if (isValid && endDate) {
                    const endCompare = new Date(endDate);
                    endCompare.setDate(endCompare.getDate() + 1);
                    endCompare.setHours(23, 59, 59, 999);

                    if (generatedDate > endCompare) isValid = false;
                }

                if (isValid) {
                    const key = `${source.id}_${currentMonth}_${currentYear}`;
                    const isDone = !!(tracker && tracker[key]);

                    items.push({
                        ...source,
                        trackerKey: key,
                        dueDate: generatedDate.toISOString(),
                        _originalDate: source.date || source.startDate,
                        date: generatedDate.toISOString(),
                        isPaid: isDone,
                        // ...
                        isReceived: isDone,
                        isRecurring: true,
                        subtitle: "Tekrarlanan",
                        isManual: true,
                    });
                }
            }
        });

        return items.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }, [sources, tracker, viewDate, type]);
};
