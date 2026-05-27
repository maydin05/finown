import { useMemo } from 'react';

export const useViewData = (sources, tracker, viewDate, type, subscriptionPayments = []) => {
    return useMemo(() => {
        const currentMonth = viewDate.getMonth();
        const currentYear = viewDate.getFullYear();

        let items = [];

        (sources || []).forEach((source) => {
            if (type === 'subscription') {
                // Determine start date
                const startSource = source.startDate || source.date;
                if (!startSource) return;
                
                const startDate = new Date(startSource);
                const endDate = source.endDate ? new Date(source.endDate) : null;

                let dueDay = source.dayOfMonth || 1;

                // Construct generated date in LOCAL time for UI display
                const generatedDate = new Date(currentYear, currentMonth, dueDay);
                generatedDate.setHours(0, 0, 0, 0);

                const startCompare = new Date(startDate);
                startCompare.setHours(0, 0, 0, 0);

                let isValid = generatedDate >= startCompare;

                if (isValid && endDate) {
                    const endCompare = new Date(endDate);
                    endCompare.setDate(endCompare.getDate() + 1);
                    endCompare.setHours(23, 59, 59, 999);

                    if (generatedDate > endCompare) isValid = false;
                }

                if (isValid) {
                    const key = `${source.id}_${currentMonth}_${currentYear}`;
                    
                    // Look for real payment record in standard month format (1-12)
                    const payment = (subscriptionPayments || []).find(
                        p => p.subscriptionId === source.id && 
                        p.periodYear === currentYear && 
                        p.periodMonth === (currentMonth + 1)
                    );

                    if (payment) {
                        items.push({
                            ...source,
                            paymentId: payment.id,
                            trackerKey: key,
                            dueDate: payment.dueDate || generatedDate.toISOString(),
                            date: payment.dueDate || generatedDate.toISOString(),
                            isPaid: payment.isPaid,
                            isReceived: payment.isPaid,
                            isRecurring: true,
                            subtitle: "Abonelik",
                            isManual: true,
                            expectedAmount: payment.expectedAmount,
                            actualAmount: payment.actualAmount,
                            paidDate: payment.paidDate,
                            note: payment.note || '',
                            isVariable: source.isVariable || false,
                        });
                    } else {
                        // Virtual record (unpaid)
                        items.push({
                            ...source,
                            paymentId: null,
                            trackerKey: key,
                            dueDate: generatedDate.toISOString(),
                            date: generatedDate.toISOString(),
                            isPaid: false,
                            isReceived: false,
                            isRecurring: true,
                            subtitle: "Abonelik",
                            isManual: true,
                            expectedAmount: source.amount,
                            actualAmount: null,
                            paidDate: null,
                            note: '',
                            isVariable: source.isVariable || false,
                        });
                    }
                }
            } else {
                // Existing income/expense logic
                if (source.type === "one-time") {
                    const iDate = new Date(source.date);
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
                    const startSource = source.startDate || source.date;
                    const startDate = new Date(startSource);
                    const endDate = source.endDate ? new Date(source.endDate) : null;

                    let dueDay = 1;
                    if (source.dayOfMonth) {
                        dueDay = source.dayOfMonth;
                    } else if (startSource) {
                        dueDay = new Date(startSource).getDate();
                    }

                    const generatedDate = new Date(currentYear, currentMonth, dueDay);
                    generatedDate.setHours(0, 0, 0, 0);

                    const startCompare = new Date(startDate);
                    startCompare.setHours(0, 0, 0, 0);

                    let isValid = generatedDate >= startCompare;

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
                            isReceived: isDone,
                            isRecurring: true,
                            subtitle: "Tekrarlanan",
                            isManual: true,
                        });
                    }
                }
            }
        });

        return items.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }, [sources, tracker, viewDate, type, subscriptionPayments]);
};
