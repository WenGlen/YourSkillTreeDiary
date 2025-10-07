const fs = require('fs');
const path = require('path');

function stripTypes(code) {
  let out = code;
  out = out.replace(/^import\s+type\s+\{[^}]*\}\s+from[^;]*;\s*$/gm, '');
  out = out.replace(/import\s+\{([^}]*)\}\s+from/g, (m, inner) => {
    const cleaned = inner.replace(/\btype\s+/g, '');
    return `import {${cleaned}} from`;
  });
  out = out.replace(/React\.forwardRef<[^>]+>\s*\(/g, 'React.forwardRef(');
  out = out.replace(/\((\s*)\{([^)]*)\}(\s*):\s*[^,\)]*(,\s*ref\s*\))/g, '($1{$2}$3$4');
  out = out.replace(/,\s*ref\s*:\s*[^)]+\)/g, ', ref)');
  out = out.replace(/\s+as\s+[A-Za-z0-9_\.\[\]"'<>]+/g, '');
  // Remove parameter type annotations in arrow functions: (props: Type) =>, ({...}: Type) =>
  out = out.replace(/\(([^)]*)\)\s*:\s*[^)=]+=>/g, '($1) =>');
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
      const out = stripTypes(code);
      if (out !== code) {
        fs.writeFileSync(p, out, 'utf8');
        console.log('Updated', p);
      }
    }
  }
}

walk(path.join(process.cwd(), 'src'));
console.log('Done.');

