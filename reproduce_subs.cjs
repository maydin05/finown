
const source = {
    "id": 1,
    "title": "Netflix",
    "amount": 60,
    "type": "recurring",
    "date": "",
    "startDate": "Tue Jan 20 2026 00:00:00 GMT+0300 (Türkiye Standart Saati)",
    "dayOfMonth": 20,
    "endDate": "Wed Jan 20 2027 00:00:00 GMT+0300 (Türkiye Standart Saati)",
    "relatedCardId": "",
    "note": "dkljgf jkljfdkjgd l",
    "paymentMethod": {
        "type": "manual",
        "value": "Google Play"
    }
};

// Simulation of useViewData logic for January 2026
const viewDate = new Date(2026, 0, 1); // Jan 2026
const currentMonth = viewDate.getMonth();
const currentYear = viewDate.getFullYear();

console.log(`View: ${currentMonth + 1}/${currentYear}`);

const startSource = source.startDate || source.date;
const startDate = new Date(startSource);
const endDate = source.endDate ? new Date(source.endDate) : null;

console.log("Start Date Parsed:", startDate.toString());
console.log("End Date Parsed:", endDate ? endDate.toString() : "null");

let dueDay = 1;
if (source.dayOfMonth) {
    dueDay = source.dayOfMonth;
} else if (startSource) {
    dueDay = new Date(startSource).getDate();
}

console.log("Due Day:", dueDay);

const generatedDate = new Date(currentYear, currentMonth, dueDay);
generatedDate.setHours(0, 0, 0, 0);

console.log("Generated Date:", generatedDate.toString());

const startCompare = new Date(startDate);
startCompare.setHours(0, 0, 0, 0);

console.log("Start Compare:", startCompare.toString());

let isValid = generatedDate >= startCompare;
console.log("Is Valid (Start)?", isValid);

if (isValid && endDate) {
    const endCompare = new Date(endDate);
    // My previous fix:
    endCompare.setDate(endCompare.getDate() + 1);
    endCompare.setHours(23, 59, 59, 999);

    console.log("End Compare (Adjusted):", endCompare.toString());

    if (generatedDate > endCompare) {
        console.log("Is Valid (End)? FALSE");
        isValid = false;
    } else {
        console.log("Is Valid (End)? TRUE");
    }
}
