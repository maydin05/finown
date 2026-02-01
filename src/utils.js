export const formatMoneyTR = (amount) => {
    if (amount === undefined || amount === null) return "0.00";
    return Number(amount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatDateTR = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        weekday: "short",
    });
};

export const today = () => new Date();

export const monthKey = (id, dateStr) => {
    const d = new Date(dateStr);
    return `${id}_${d.getMonth()}_${d.getFullYear()}`;
};

export const getDaysDifference = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);

    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date1 - date2) / oneDay);
};
