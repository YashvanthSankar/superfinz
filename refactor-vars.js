const fs = require('fs');
const path = require('path');

function walk(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      let content = fs.readFileSync(full, 'utf8');
      let original = content;
      
      content = content.replace(/\[var\(--bg\)\]/g, 'background');
      content = content.replace(/\[var\(--surface\)\]/g, 'surface');
      content = content.replace(/\[var\(--surface2\)\]/g, 'surface2');
      content = content.replace(/\[var\(--border\)\]/g, 'border');
      content = content.replace(/\[var\(--border2\)\]/g, 'border2');
      content = content.replace(/\[var\(--text\)\]/g, 'text');
      content = content.replace(/\[var\(--text2\)\]/g, 'text2');
      content = content.replace(/\[var\(--muted\)\]/g, 'muted');
      content = content.replace(/\[var\(--accent\)\]/g, 'accent');
      content = content.replace(/\[var\(--accent-bg\)\]/g, 'accent-bg');
      
      if (content !== original) {
        fs.writeFileSync(full, content, 'utf8');
      }
    }
  }
}

walk('./src');
