
const source = {
    "id": 305,
    "title": "Mylife Arıtma Ödemesi",
    "amount": 3000,
    "type": "recurring",
    "category": "other",
    "date": "",
    "startDate": "Thu Feb 05 2026 00:00:00 GMT+0300 (Türkiye Standart Saati)",
    "dayOfMonth": 5,
    "endDate": "Thu Mar 05 2026 00:00:00 GMT+0300 (Türkiye Standart Saati)",
    "note": "..."
};

// Simulation of useViewData logic
const viewDate = new Date(2026, 2, 1); // March 2026
const currentMonth = viewDate.getMonth();
const currentYear = viewDate.getFullYear();

console.log(`View: ${currentMonth + 1}/${currentYear}`);

const startDate = new Date(source.startDate || source.date);
const endDate = source.endDate ? new Date(source.endDate) : null;

console.log("Start Date Parsed:", startDate.toString());
console.log("End Date Parsed:", endDate ? endDate.toString() : "null");

// Logic from useViewData
const startSource = source.startDate || source.date;
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

if (endDate) {
    const endCompare = new Date(endDate);
    endCompare.setHours(0, 0, 0, 0);
    console.log("End Compare:", endCompare.toString());

    // Comparison
    const isValid = generatedDate <= endCompare;
    const isStrictlyGreater = generatedDate > endCompare;
    console.log("Is Valid (Generated <= End)?", isValid);
    console.log("Generated > EndCompare?", isStrictlyGreater);

    if (isStrictlyGreater) {
        console.log("RESULT: Item EXCLUDED because GeneratedDate > EndCompare");
    } else {
        console.log("RESULT: Item INCLUDED");
    }
} else {
    console.log("No End Date - INCLUDED");
}
