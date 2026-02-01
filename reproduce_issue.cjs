
const fs = require('fs');

// Mock Data from user's provided JSON
const data = JSON.parse(fs.readFileSync('/Users/mehmetaydin/Downloads/finown_export.json', 'utf8'));

const source = data.expenseSources.find(s => s.id === 305);
console.log("Source:", source);

// Simulation of useViewData logic
const viewDate = new Date(2026, 2, 1); // March 2026
const currentMonth = viewDate.getMonth();
const currentYear = viewDate.getFullYear();

console.log(`View: ${currentMonth + 1}/${currentYear}`);

const startDate = new Date(source.startDate || source.date);
const endDate = source.endDate ? new Date(source.endDate) : null;

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
    console.log("Is Valid (Generated <= End)?", isValid);
    console.log("Generated > EndCompare?", generatedDate > endCompare);
} else {
    console.log("No End Date");
}
