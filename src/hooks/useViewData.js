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

                // For recurring, we generate the date for the CURRENT view month.
                // But we need to verify if the "Start Date" aligns.

                // FIXED Logic: Use dayOfMonth if available, otherwise get from startDate.
                let dueDay = 1;
                if (source.dayOfMonth) {
                    dueDay = source.dayOfMonth;
                } else if (startSource) {
                    dueDay = new Date(startSource).getDate(); // Use Local day to match expectations
                }

                // Construct generated date in LOCAL time for UI display (so it appears correctly in calendar)
                // BUT logically we treat it as the item for 'currentMonth'.
                const generatedDate = new Date(currentYear, currentMonth, dueDay);
                generatedDate.setHours(0, 0, 0, 0);

                const startCompare = new Date(startDate);
                startCompare.setHours(0, 0, 0, 0);

                let isValid = generatedDate >= startCompare;
                if (isValid && endDate) {
                    const endCompare = new Date(endDate);
                    // FIX: Database Date column truncates to UTC. For GMT+3, '2026-03-05 00:00' becomes '2026-03-04 21:00' -> Stored as '2026-03-04'.
                    // We must extend the End Date check by 1 day (and use end of day) to compensate and ensure inclusivity.
                    endCompare.setDate(endCompare.getDate() + 1);
                    endCompare.setHours(23, 59, 59, 999);

                    if (generatedDate > endCompare) isValid = false;
                }

                if (isValid) {
                    const key = `${source.id}_${currentMonth}_${currentYear}`;
                    const isDone = !!(tracker && tracker[key]);

                    items.push({
                        ...source,
                        dueDate: generatedDate.toISOString(),
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
