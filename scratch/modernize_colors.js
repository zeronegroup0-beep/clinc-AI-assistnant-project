const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, callback);
        } else if (f.endsWith('.dart')) {
            callback(fullPath);
        }
    });
}

walkDir(path.join(__dirname, '..', 'lib'), filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('.withOpacity(')) {
        content = content.replace(/\.withOpacity\(([^)]+)\)/g, '.withValues(alpha: $1)');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated withValues in: ${filePath}`);
    }
});

console.log('Color modernization complete.');
