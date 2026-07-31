const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/app/(dashboard)/competitions');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix impor"
    if (content.includes('impor"')) {
        content = content.replace(/impor"([^"]+)"/g, 'import("$1")');
        changed = true;
    }
    
    // Fix spli"
    if (content.includes('spli"')) {
        content = content.replace(/spli"([^"]+)"/g, 'split("$1")');
        changed = true;
    }
    
    // Fix .pos"
    if (content.includes('.pos"')) {
        content = content.replace(/\.pos"([^"]+)"/g, '.post("$1")');
        changed = true;
    }
    
    // Fix objec"
    if (content.includes('objec"')) {
        content = content.replace(/objec"([^"]+)"/g, 'object("$1")');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
    }
});

console.log('Fixed regex errors');
