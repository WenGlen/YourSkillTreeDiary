const fs = require('fs');
const path = require('path');

function fix(code) {
  let out = code;
  // Fix malformed namespace imports
  out = out.replace(/(^|\n)import \* from \"react\";?/g, '$1import * as React from "react";');
  out = out.replace(/(^|\n)import \* from \"([^\"]+)\";?/g, (m, pre, mod) => {
    if (mod === 'react') return m; // handled above
    return `${pre}import * as Primitive from "${mod}";`;
  });
  // Normalize any XPrimitive usage to Primitive
  out = out.replace(/\b[A-Za-z]+Primitive\b/g, 'Primitive');
  // Remove forwardRef generics (multiline)
  out = out.replace(/React\.forwardRef<([\s\S]*?)>\s*\(/g, 'React.forwardRef(');
  return out;
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) {
      walk(p);
    } else if (p.endsWith('.jsx') || p.endsWith('.js')) {
      const code = fs.readFileSync(p, 'utf8');
      const out = fix(code);
      if (out !== code) {
        fs.writeFileSync(p, out, 'utf8');
        console.log('Fixed', p);
      }
    }
  }
}

walk(path.join(process.cwd(), 'src'));
console.log('Done.');


