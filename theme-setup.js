const fs = require('fs');
const path = require('path');

const cssMap = {
  '#fefce8': 'var(--bg)',
  '#fef9c3': 'var(--surface)',
  '#fde68a': 'var(--border)',
  '#fcd34d': 'var(--border2)',
  '#713f12': 'var(--text)',
  '#92400e': 'var(--text2)',
  '#78350f': 'var(--muted)',
  '#b45309': 'var(--accent)',
  '#fef3c7': 'var(--accent-bg)',
};

function walk(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      let content = fs.readFileSync(full, 'utf8');
      let original = content;
      
      // Replace Hex strings
      for (const [light, variable] of Object.entries(cssMap)) {
        const regex = new RegExp(light, 'gi');
        content = content.replace(regex, variable);
      }
      
      if (content !== original) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Updated', full);
      }
    }
  }
}

walk('./src');
