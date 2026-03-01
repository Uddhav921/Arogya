const fs = require('fs');
const path = require('path');

const directoryPath = 'e:/VAKR/health_v2/frontend/src';

const replacements = [
    { pattern: /text-emerald-[0-9]+/g, replacement: 'text-foreground' },
    { pattern: /bg-emerald-[0-9]+\/10/g, replacement: 'bg-muted' },
    { pattern: /bg-emerald-[0-9]+\/20/g, replacement: 'bg-muted' },
    { pattern: /bg-emerald-[0-9]+\/5/g, replacement: 'bg-muted/50' },
    { pattern: /bg-emerald-[0-9]+/g, replacement: 'bg-foreground' },
    { pattern: /border-emerald-[0-9]+\/20/g, replacement: 'border-border' },
    { pattern: /border-emerald-[0-9]+\/30/g, replacement: 'border-border' },
    { pattern: /border-emerald-[0-9]+/g, replacement: 'border-foreground' },
    { pattern: /border-t-emerald-[0-9]+/g, replacement: 'border-t-foreground' },
    { pattern: /from-emerald-[0-9]+\/[0-9]+/g, replacement: 'from-foreground/10' },
    { pattern: /prose-emerald/g, replacement: 'prose-zinc' },
    { pattern: /rgba\(16,185,129,([^\)]+)\)/g, replacement: 'rgba(255,255,255,$1)' } // Preserving alpha
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(directoryPath);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let hasChanges = false;
    replacements.forEach(({ pattern, replacement }) => {
        if (content.match(pattern)) {
            content = content.replace(pattern, replacement);
            hasChanges = true;
        }
    });
    if (hasChanges) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
});
console.log('Update script completed successfully.');
