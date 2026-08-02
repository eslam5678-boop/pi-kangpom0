const fs = require('fs');
const path = require('path');

const root = path.resolve('e:/pi-kangpom-main');
const entry = path.join(root, 'app', 'page.tsx');
const allowedExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function relpath(p) {
  try { return path.relative(root, p).split(path.sep).join('/'); } catch { return p; }
}

function walk(dir) {
  let files = [];
  for (const entryName of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entryName.name);
    if (entryName.isDirectory()) {
      files = files.concat(walk(full));
    } else if (allowedExts.has(path.extname(entryName.name))) {
      files.push(full);
    }
  }
  return files;
}

const allCodeFiles = walk(root).map(f => path.resolve(f));
const fileSet = new Set(allCodeFiles);

const tsconfigPath = path.join(root, 'tsconfig.json');
const paths = {};
if (fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  for (const [alias, targets] of Object.entries(tsconfig.compilerOptions?.paths || {})) {
    if (alias.endsWith('/*')) {
      const base = alias.slice(0, -1);
      paths[base] = (targets || []).map(t => path.resolve(root, t.endsWith('/*') ? t.slice(0, -1) : t));
    } else {
      paths[alias] = (targets || []).map(t => path.resolve(root, t));
    }
  }
}

function resolveImport(fromFile, spec) {
  if (spec.startsWith('http') || spec.startsWith('mailto:')) return null;
  if (spec.startsWith('.') || spec.startsWith('/')) {
    const candidates = [];
    if (spec.startsWith('/')) {
      const base = path.resolve(root, spec.slice(1));
      candidates.push(base);
    } else {
      const base = path.resolve(path.dirname(fromFile), spec);
      candidates.push(base);
      for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']) {
        candidates.push(base + ext);
      }
      candidates.push(path.join(base, 'index.ts'));
      candidates.push(path.join(base, 'index.tsx'));
      candidates.push(path.join(base, 'index.js'));
      candidates.push(path.join(base, 'index.jsx'));
      candidates.push(path.join(base, 'index.mjs'));
      candidates.push(path.join(base, 'index.cjs'));
    }
    for (const cand of candidates) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile() && allowedExts.has(path.extname(cand))) return path.resolve(cand);
      if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) {
        for (const idx of [path.join(cand, 'index.ts'), path.join(cand, 'index.tsx'), path.join(cand, 'index.js'), path.join(cand, 'index.jsx'), path.join(cand, 'index.mjs'), path.join(cand, 'index.cjs')]) {
          if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return path.resolve(idx);
        }
      }
    }
    return null;
  }
  for (const [alias, targets] of Object.entries(paths)) {
    if (spec.startsWith(alias)) {
      const suffix = spec.slice(alias.length).replace(/^\//, '');
      for (const target of targets) {
        const base = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, suffix) : target;
        if (fs.existsSync(base) && fs.statSync(base).isFile() && allowedExts.has(path.extname(base))) return path.resolve(base);
        for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']) {
          const test = base + ext;
          if (fs.existsSync(test) && fs.statSync(test).isFile()) return path.resolve(test);
        }
        for (const idx of [path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.js'), path.join(base, 'index.jsx'), path.join(base, 'index.mjs'), path.join(base, 'index.cjs')]) {
          if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return path.resolve(idx);
        }
      }
    }
  }
  return null;
}

const adj = new Map();
const importsMeta = new Map();
const importedBy = new Map();
const reachable = new Set();
const visited = new Set();
const queue = [path.resolve(entry)];

while (queue.length) {
  const f = queue.pop();
  if (visited.has(f)) continue;
  visited.add(f);
  if (!fs.existsSync(f) || !allowedExts.has(path.extname(f))) continue;
  reachable.add(f);
  const text = fs.readFileSync(f, 'utf8');
  const matches = [];
  for (const line of text.split(/\r?\n/)) {
    const stripped = line.trim();
    if (!stripped.startsWith('import ') && !stripped.startsWith('export ')) continue;
    const m = stripped.match(/['"]([^'"]+)['"]/);
    if (!m) continue;
    const spec = m[1];
    if (spec.endsWith('.css')) continue;
    const resolved = resolveImport(f, spec);
    if (resolved === null) {
      matches.push([spec, null, 'unknown', stripped]);
    } else {
      const isType = stripped.includes('import type') || stripped.includes('import { type') || stripped.includes('import type {');
      matches.push([spec, resolved, isType ? 'type' : 'runtime', stripped]);
    }
  }
  importsMeta.set(f, matches);
  for (const [spec, resolved] of matches) {
    if (!resolved || !fileSet.has(resolved)) continue;
    if (!adj.has(f)) adj.set(f, []);
    adj.get(f).push(resolved);
    if (!importedBy.has(resolved)) importedBy.set(resolved, []);
    importedBy.get(resolved).push(f);
    if (!visited.has(resolved)) queue.push(resolved);
  }
}

const cycles = [];
const stack = [];
const stackSet = new Set();
const seen = new Set();
function dfs(node) {
  stack.push(node);
  stackSet.add(node);
  for (const nxt of adj.get(node) || []) {
    if (!reachable.has(nxt)) continue;
    if (stackSet.has(nxt)) {
      const idx = stack.indexOf(nxt);
      cycles.push(stack.slice(idx).concat([nxt]));
    } else if (!seen.has(nxt)) {
      dfs(nxt);
    }
  }
  stack.pop();
  stackSet.delete(node);
  seen.add(node);
}
for (const node of Array.from(reachable).sort()) {
  if (!seen.has(node)) dfs(node);
}
const normalizedCycles = [];
const seenCycles = new Set();
for (const cyc of cycles) {
  const norm = cyc.length <= 1 ? tuple(cyc) : minRotation(cyc);
  if (!seenCycles.has(norm)) {
    seenCycles.add(norm);
    normalizedCycles.push(norm.map(x => x));
  }
}
function tuple(arr) { return JSON.stringify(arr); }
function minRotation(cyc) {
  const reps = [];
  for (let i = 0; i < cyc.length - 1; i++) {
    reps.push(JSON.stringify(cyc.slice(i).concat(cyc.slice(0, i))));
  }
  return JSON.parse(reps.sort()[0]);
}

const interfaceDefs = new Map();
const typeDefs = new Map();
const enumDefs = new Map();
const constantDefs = new Map();
const hookDefs = new Map();
const systemDefs = new Map();
for (const f of reachable) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/\binterface\s+([A-Za-z0-9_]+)\b/g)) {
    if (!interfaceDefs.has(m[1])) interfaceDefs.set(m[1], []); interfaceDefs.get(m[1]).push(f);
  }
  for (const m of text.matchAll(/\btype\s+([A-Za-z0-9_]+)\b/g)) {
    if (!typeDefs.has(m[1])) typeDefs.set(m[1], []); typeDefs.get(m[1]).push(f);
  }
  for (const m of text.matchAll(/\benum\s+([A-Za-z0-9_]+)\b/g)) {
    if (!enumDefs.has(m[1])) enumDefs.set(m[1], []); enumDefs.get(m[1]).push(f);
  }
  for (const m of text.matchAll(/\b(?:const|let|var)\s+([A-Z0-9_]+)\b/g)) {
    if (!constantDefs.has(m[1])) constantDefs.set(m[1], []); constantDefs.get(m[1]).push(f);
  }
  for (const m of text.matchAll(/\b(?:function|const)\s+(use[A-Za-z0-9_]+)\b/g)) {
    if (!hookDefs.has(m[1])) hookDefs.set(m[1], []); hookDefs.get(m[1]).push(f);
  }
  for (const m of text.matchAll(/\b(?:class|function|const|let|var)\s+([A-Za-z0-9_]+(?:System|Game)[A-Za-z0-9_]*)\b/g)) {
    if (!systemDefs.has(m[1])) systemDefs.set(m[1], []); systemDefs.get(m[1]).push(f);
  }
}

const exportsByFile = new Map();
for (const f of reachable) {
  const text = fs.readFileSync(f, 'utf8');
  const exports = [];
  for (const m of text.matchAll(/\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z0-9_]+)/g)) exports.push(['decl', m[1]]);
  for (const m of text.matchAll(/\bexport\s*\{([^}]+)\}/g)) {
    for (const part of m[1].split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      exports.push(['named', trimmed.includes(' as ') ? trimmed.split(' as ')[1].trim() : trimmed]);
    }
  }
  if (/\bexport\s+default\b/.test(text)) exports.push(['default', 'default']);
  exportsByFile.set(f, exports);
}

const unusedExports = [];
for (const [f, exports] of exportsByFile) {
  for (const [kind, name] of exports) {
    let imported = false;
    for (const src of reachable) {
      if (src === f) continue;
      for (const [spec, resolved, depKind, line] of importsMeta.get(src) || []) {
        if (resolved !== f) continue;
        const clause = line.split('from', 1)[0].replace('import ', '', 1).replace('type ', '', 1);
        if (clause.includes('{')) {
          const inner = clause.split('{')[1].split('}')[0];
          for (const part of inner.split(',')) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            const importedName = trimmed.includes(' as ') ? trimmed.split(' as ')[1].trim() : trimmed;
            if (importedName === name || (name === 'default' && importedName === 'default')) { imported = true; break; }
          }
        } else if (clause.trim() && clause.trim() !== '*') {
          if (name === 'default') imported = true;
        }
        if (imported) break;
      }
      if (imported) break;
    }
    if (!imported) unusedExports.push([f, kind, name]);
  }
}

const allImportedTargets = new Set();
for (const src of reachable) {
  for (const [spec, resolved] of importsMeta.get(src) || []) {
    if (resolved && fileSet.has(resolved)) allImportedTargets.add(resolved);
  }
}
const deadFiles = allCodeFiles.filter(f => f !== path.resolve(entry) && !allImportedTargets.has(f));

const allDirs = new Map();
for (const f of allCodeFiles) {
  const dir = path.dirname(f);
  if (!allDirs.has(dir)) allDirs.set(dir, []);
  allDirs.get(dir).push(f);
}
const deadFolders = [];
for (const [d, files] of allDirs) {
  if (files.some(f => reachable.has(f))) continue;
  const relParts = path.relative(root, d).split(path.sep).filter(Boolean);
  if (relParts[0] && ['.next', 'node_modules'].includes(relParts[0])) continue;
  deadFolders.push([d, files.map(f => relpath(f))]);
}

const brokenImports = [];
for (const f of Array.from(reachable).sort()) {
  for (const [spec, resolved, kind, line] of importsMeta.get(f) || []) {
    if (resolved === null) brokenImports.push([f, spec, line]);
  }
}

const out = [];
out.push('RUNTIME_DEPENDENCY_AUDIT');
out.push('ENTRY=' + path.resolve(entry));
out.push('');
out.push('1. COMPLETE DEPENDENCY TREE');
for (const f of Array.from(reachable).sort((a,b)=>relpath(a).localeCompare(relpath(b)))) {
  out.push('FILE=' + relpath(f));
  out.push('ABSOLUTE_PATH=' + f);
  out.push('IMPORTED_BY=' + (importedBy.get(f) || []).map(x => relpath(x)).join(', ') || 'NONE');
  const imports = [];
  for (const [spec, resolved, kind, line] of importsMeta.get(f) || []) {
    if (resolved === null) imports.push(spec + ' [UNRESOLVED]');
    else if (reachable.has(resolved)) imports.push(relpath(resolved));
    else imports.push(spec);
  }
  out.push('IMPORTS=' + (imports.join(', ') || 'NONE'));
  out.push('RUNTIME_USED=YES');
  out.push('');
}
out.push('2. FILES THAT EXIST BUT ARE NEVER IMPORTED ANYWHERE');
for (const f of deadFiles.sort((a,b)=>relpath(a).localeCompare(relpath(b)))) out.push(relpath(f));
out.push('');
out.push('3. EXPORTED SYMBOLS THAT ARE NEVER IMPORTED');
for (const [f, kind, name] of unusedExports.sort((a,b)=>relpath(a[0]).localeCompare(relpath(b[0])) || a[1].localeCompare(b[1]) || a[2].localeCompare(b[2]))) out.push(relpath(f) + ' :: ' + kind + ' :: ' + name);
out.push('');
out.push('4. DUPLICATE INTERFACES');
for (const [name, files] of Array.from(interfaceDefs.entries()).sort((a,b)=>a[0].localeCompare(b[0]))) {
  if (new Set(files).size > 1) { out.push(name); for (const f of Array.from(new Set(files)).sort((a,b)=>relpath(a).localeCompare(relpath(b)))) out.push('  ' + relpath(f)); }
}
out.push('');
out.push('5. DUPLICATE TYPES');
for (const [name, files] of Array.from(typeDefs.entries()).sort((a,b)=>a[0].localeCompare(b[0]))) {
  if (new Set(files).size > 1) { out.push(name); for (const f of Array.from(new Set(files)).sort((a,b)=>relpath(a).localeCompare(relpath(b)))) out.push('  ' + relpath(f)); }
}
out.push('');
out.push('6. DUPLICATE CONSTANTS');
for (const [name, files] of Array.from(constantDefs.entries()).sort((a,b)=>a[0].localeCompare(b[0]))) {
  if (new Set(files).size > 1) { out.push(name); for (const f of Array.from(new Set(files)).sort((a,b)=>relpath(a).localeCompare(relpath(b)))) out.push('  ' + relpath(f)); }
}
out.push('');
out.push('7. DUPLICATE HOOKS');
for (const [name, files] of Array.from(hookDefs.entries()).sort((a,b)=>a[0].localeCompare(b[0]))) {
  if (new Set(files).size > 1) { out.push(name); for (const f of Array.from(new Set(files)).sort((a,b)=>relpath(a).localeCompare(relpath(b)))) out.push('  ' + relpath(f)); }
}
out.push('');
out.push('8. DUPLICATE GAME SYSTEMS');
for (const [name, files] of Array.from(systemDefs.entries()).sort((a,b)=>a[0].localeCompare(b[0]))) {
  if (new Set(files).size > 1) { out.push(name); for (const f of Array.from(new Set(files)).sort((a,b)=>relpath(a).localeCompare(relpath(b)))) out.push('  ' + relpath(f)); }
}
out.push('');
out.push('9. CIRCULAR DEPENDENCY CHAINS');
for (const cyc of normalizedCycles) out.push(cyc.join(' -> '));
out.push('');
out.push('10. FINAL RUNTIME GRAPH');
for (const f of Array.from(reachable).sort((a,b)=>relpath(a).localeCompare(relpath(b)))) {
  const targets = [];
  for (const [spec, resolved, kind] of importsMeta.get(f) || []) {
    if (resolved && reachable.has(resolved) && kind === 'runtime') targets.push(relpath(resolved));
  }
  out.push(relpath(f) + ' -> ' + (targets.join(', ') || 'NONE'));
}
out.push('');
out.push('11. BROKEN IMPORTS / UNRESOLVED PATHS');
for (const [f, spec] of brokenImports) out.push(relpath(f) + ' -> ' + spec + ' [UNRESOLVED]');
out.push('');
out.push('12. DEAD FOLDERS');
for (const [d, files] of deadFolders.sort((a,b)=>relpath(a[0]).localeCompare(relpath(b[0])))) out.push(relpath(d) + ' :: ' + files.join(', '));
console.log(out.join('\n'));
