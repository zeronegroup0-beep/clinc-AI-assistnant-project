const fs = require('fs');
const content = fs.readFileSync('services/receptionistAgent.js', 'utf8');

const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
    if (line.includes('المتاح') && line.includes('الساعة')) {
        console.log(`Line ${idx + 1}: ${line}`);
    }
    if (line.includes('تماماً')) {
        console.log(`Line ${idx + 1}: ${line}`);
    }
    if (line.includes('معلش')) {
        console.log(`Line ${idx + 1}: ${line}`);
    }
});
