import re, json, sys
from pathlib import Path
from collections import defaultdict

root = Path('e:/pi-kangpom-main').resolve()
entry = root / 'app' / 'page.tsx'
allowed_exts = {'.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'}

paths = {}
tsconfig = root / 'tsconfig.json'
if tsconfig.exists():
    data = json.loads(tsconfig.read_text(encoding='utf-8'))
    for alias, targets in data.get('compilerOptions', {}).get('paths', {}).items():
        if alias.endswith('/*'):
            base = alias[:-1]
            paths[base] = [str((root / t[:-2]).resolve()) if t.endswith('/*') else str((root / t).resolve()) for t in targets]
        else:
            paths[alias] = [str((root / t).resolve()) for t in targets]

all_code_files = [p.resolve() for p in root.rglob('*') if p.is_file() and p.suffix.lower() in allowed_exts]
file_set = set(all_code_files)


def resolve_import(from_file, spec):
    if spec.startswith('http') or spec.startswith('mailto:'):
        return None
    if spec.startswith('.') or spec.startswith('/'):
        candidates = []
        if spec.startswith('/'):
            base = (root / spec[1:]).resolve()
            candidates.append(base)
        else:
            base = (from_file.parent / spec).resolve()
            candidates.append(base)
            for ext in ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']:
                candidates.append(base.with_suffix(ext))
            candidates.append(base / 'index.ts')
            candidates.append(base / 'index.tsx')
            candidates.append(base / 'index.js')
            candidates.append(base / 'index.jsx')
            candidates.append(base / 'index.mjs')
            candidates.append(base / 'index.cjs')
        for cand in candidates:
            if cand.exists() and cand.is_file() and cand.suffix.lower() in allowed_exts:
                return cand.resolve()
            if cand.exists() and cand.is_dir():
                for idx in [cand / 'index.ts', cand / 'index.tsx', cand / 'index.js', cand / 'index.jsx', cand / 'index.mjs', cand / 'index.cjs']:
                    if idx.exists() and idx.is_file():
                        return idx.resolve()
        return None
    for alias, targets in paths.items():
        if spec.startswith(alias):
            suffix = spec[len(alias):]
            if suffix.startswith('/'):
                suffix = suffix[1:]
            for target in targets:
                base = Path(target)
                if base.exists() and base.is_dir():
                    cand = base / suffix
                else:
                    cand = base
                if cand.exists() and cand.is_file() and cand.suffix.lower() in allowed_exts:
                    return cand.resolve()
                for ext in ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']:
                    test = cand.with_suffix(ext)
                    if test.exists() and test.is_file():
                        return test.resolve()
                for idx in [cand / 'index.ts', cand / 'index.tsx', cand / 'index.js', cand / 'index.jsx', cand / 'index.mjs', cand / 'index.cjs']:
                    if idx.exists() and idx.is_file():
                        return idx.resolve()
    return None


def relpath(path):
    try:
        return path.relative_to(root).as_posix()
    except Exception:
        return path.as_posix()

adj = defaultdict(list)
imports_meta = {}
imported_by = defaultdict(list)
reachable = set()
queue = [entry.resolve()]
visited = set()

while queue:
    f = queue.pop()
    if f in visited:
        continue
    visited.add(f)
    if not f.exists() or f.suffix.lower() not in allowed_exts:
        continue
    reachable.add(f)
    text = f.read_text(encoding='utf-8', errors='ignore')
    matches = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped.startswith(('import ', 'export ')):
            continue
        m = re.search(r'''['"]([^'"]+)['"]''', stripped)
        if not m:
            continue
        spec = m.group(1)
        if spec.endswith('.css'):
            continue
        resolved = resolve_import(f, spec)
        if resolved is None:
            matches.append((spec, None, 'unknown', stripped))
        else:
            is_type = 'import type' in stripped or 'import { type' in stripped or 'import type {' in stripped
            matches.append((spec, resolved, 'type' if is_type else 'runtime', stripped))
    imports_meta[f] = matches
    for spec, resolved, kind, line in matches:
        if resolved is None:
            continue
        if resolved not in file_set:
            continue
        adj[f].append(resolved)
        imported_by[resolved].append(f)
        if resolved not in visited:
            queue.append(resolved)

reachable = set(visited)

# circular imports
cycles = []
stack = []
stack_set = set()
seen = set()

def dfs(node):
    stack.append(node)
    stack_set.add(node)
    for nxt in adj.get(node, []):
        if nxt not in reachable:
            continue
        if nxt in stack_set:
            idx = stack.index(nxt)
            cycles.append(stack[idx:] + [nxt])
        elif nxt not in seen:
            dfs(nxt)
    stack.pop()
    stack_set.remove(node)
    seen.add(node)

for node in sorted(reachable):
    if node not in seen:
        dfs(node)

normalized_cycles = []
seen_cycles = set()
for cyc in cycles:
    if len(cyc) <= 1:
        norm = tuple(cyc)
    else:
        reps = [tuple(cyc[i:] + cyc[:i]) for i in range(len(cyc) - 1)]
        norm = min(reps)
    if norm not in seen_cycles:
        seen_cycles.add(norm)
        normalized_cycles.append([str(x) for x in norm])

# duplicates
interface_defs = defaultdict(list)
type_defs = defaultdict(list)
enum_defs = defaultdict(list)
constant_defs = defaultdict(list)
hook_defs = defaultdict(list)
system_defs = defaultdict(list)

for f in reachable:
    text = f.read_text(encoding='utf-8', errors='ignore')
    for m in re.finditer(r'\binterface\s+([A-Za-z0-9_]+)\b', text):
        interface_defs[m.group(1)].append(f)
    for m in re.finditer(r'\btype\s+([A-Za-z0-9_]+)\b', text):
        type_defs[m.group(1)].append(f)
    for m in re.finditer(r'\benum\s+([A-Za-z0-9_]+)\b', text):
        enum_defs[m.group(1)].append(f)
    for m in re.finditer(r'\b(?:const|let|var)\s+([A-Z0-9_]+)\b', text):
        constant_defs[m.group(1)].append(f)
    for m in re.finditer(r'\b(?:function|const)\s+(use[A-Za-z0-9_]+)\b', text):
        hook_defs[m.group(1)].append(f)
    for m in re.finditer(r'\b(?:class|function|const|let|var)\s+([A-Za-z0-9_]+(?:System|Game)[A-Za-z0-9_]*)\b', text):
        system_defs[m.group(1)].append(f)

# export info
export_pattern = re.compile(r'\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z0-9_]+)')
export_named_pattern = re.compile(r'\bexport\s*\{([^}]+)\}')
export_default_pattern = re.compile(r'\bexport\s+default\b')

exports_by_file = {}
for f in reachable:
    text = f.read_text(encoding='utf-8', errors='ignore')
    exports = []
    for m in export_pattern.finditer(text):
        exports.append(('decl', m.group(1)))
    for m in export_named_pattern.finditer(text):
        inner = m.group(1)
        for part in inner.split(','):
            part = part.strip()
            if not part:
                continue
            if ' as ' in part:
                exports.append(('named', part.split(' as ')[1].strip()))
            else:
                exports.append(('named', part))
    if export_default_pattern.search(text):
        exports.append(('default', 'default'))
    exports_by_file[f] = exports

# unused exports
unused_exports = []
for f, exports in exports_by_file.items():
    for kind, name in exports:
        imported = False
        for src in reachable:
            if src == f:
                continue
            for spec, resolved, dep_kind, line in imports_meta.get(src, []):
                if resolved != f:
                    continue
                clause = line.split('from', 1)[0].replace('import ', '', 1).replace('type ', '', 1)
                if '{' in clause:
                    inner = clause.split('{', 1)[1].split('}', 1)[0]
                    for part in inner.split(','):
                        part = part.strip()
                        if ' as ' in part:
                            imported_name = part.split(' as ')[1].strip()
                        else:
                            imported_name = part.strip()
                        if imported_name == name or (name == 'default' and imported_name == 'default'):
                            imported = True
                            break
                elif clause.strip() and clause.strip() != '*':
                    if name == 'default':
                        imported = True
                if imported:
                    break
            if imported:
                break
        if not imported:
            unused_exports.append((f, kind, name))

# dead files/folders
all_imported_targets = set()
for src in reachable:
    for spec, resolved, kind, line in imports_meta.get(src, []):
        if resolved is not None and resolved in file_set:
            all_imported_targets.add(resolved)

dead_files = [f for f in all_code_files if f != entry.resolve() and f not in all_imported_targets]

all_dirs = defaultdict(list)
for f in all_code_files:
    all_dirs[f.parent].append(f)
dead_folders = []
for d, files in all_dirs.items():
    if any(f in reachable for f in files):
        continue
    rel_parts = d.relative_to(root).parts if d != root else ()
    if rel_parts and rel_parts[0] in {'.next', 'node_modules'}:
        continue
    dead_folders.append((d, [relpath(f) for f in files]))

broken_imports = []
for f in sorted(reachable):
    for spec, resolved, kind, line in imports_meta.get(f, []):
        if resolved is None:
            broken_imports.append((f, spec, line))

out_lines = []
out_lines.append('RUNTIME_DEPENDENCY_AUDIT')
out_lines.append('ENTRY=' + str(entry.resolve()))
out_lines.append('')
out_lines.append('1. COMPLETE DEPENDENCY TREE')
for f in sorted(reachable, key=lambda p: relpath(p)):
    out_lines.append('FILE=' + relpath(f))
    out_lines.append('ABSOLUTE_PATH=' + str(f))
    out_lines.append('IMPORTED_BY=' + ', '.join(relpath(x) for x in imported_by.get(f, [])) if imported_by.get(f) else 'NONE')
    imports_list = []
    for spec, resolved, kind, line in imports_meta.get(f, []):
        if resolved is None:
            imports_list.append(spec + ' [UNRESOLVED]')
        elif resolved in reachable:
            imports_list.append(relpath(resolved))
        else:
            imports_list.append(spec)
    out_lines.append('IMPORTS=' + ', '.join(imports_list) if imports_list else 'NONE')
    out_lines.append('RUNTIME_USED=YES')
    out_lines.append('')

out_lines.append('2. FILES THAT EXIST BUT ARE NEVER IMPORTED ANYWHERE')
for f in sorted(dead_files, key=lambda p: relpath(p)):
    out_lines.append(relpath(f))
out_lines.append('')

out_lines.append('3. EXPORTED SYMBOLS THAT ARE NEVER IMPORTED')
for f, kind, name in sorted(unused_exports, key=lambda x: (relpath(x[0]), x[1], x[2])):
    out_lines.append(relpath(f) + ' :: ' + kind + ' :: ' + name)
out_lines.append('')

out_lines.append('4. DUPLICATE INTERFACES')
for name, files in sorted(interface_defs.items()):
    if len(set(files)) > 1:
        out_lines.append(name)
        for f in sorted(set(files), key=lambda p: relpath(p)):
            out_lines.append('  ' + relpath(f))
out_lines.append('')

out_lines.append('5. DUPLICATE TYPES')
for name, files in sorted(type_defs.items()):
    if len(set(files)) > 1:
        out_lines.append(name)
        for f in sorted(set(files), key=lambda p: relpath(p)):
            out_lines.append('  ' + relpath(f))
out_lines.append('')

out_lines.append('6. DUPLICATE CONSTANTS')
for name, files in sorted(constant_defs.items()):
    if len(set(files)) > 1:
        out_lines.append(name)
        for f in sorted(set(files), key=lambda p: relpath(p)):
            out_lines.append('  ' + relpath(f))
out_lines.append('')

out_lines.append('7. DUPLICATE HOOKS')
for name, files in sorted(hook_defs.items()):
    if len(set(files)) > 1:
        out_lines.append(name)
        for f in sorted(set(files), key=lambda p: relpath(p)):
            out_lines.append('  ' + relpath(f))
out_lines.append('')

out_lines.append('8. DUPLICATE GAME SYSTEMS')
for name, files in sorted(system_defs.items()):
    if len(set(files)) > 1:
        out_lines.append(name)
        for f in sorted(set(files), key=lambda p: relpath(p)):
            out_lines.append('  ' + relpath(f))
out_lines.append('')

out_lines.append('9. CIRCULAR DEPENDENCY CHAINS')
for cyc in normalized_cycles:
    out_lines.append(' -> '.join(cyc))
out_lines.append('')

out_lines.append('10. FINAL RUNTIME GRAPH')
for f in sorted(reachable, key=lambda p: relpath(p)):
    targets = []
    for spec, resolved, kind, line in imports_meta.get(f, []):
        if resolved is not None and resolved in reachable and kind == 'runtime':
            targets.append(relpath(resolved))
    out_lines.append(relpath(f) + ' -> ' + ', '.join(targets) if targets else relpath(f) + ' -> NONE')
out_lines.append('')

out_lines.append('11. BROKEN IMPORTS / UNRESOLVED PATHS')
for f, spec, line in broken_imports:
    out_lines.append(relpath(f) + ' -> ' + spec + ' [UNRESOLVED]')
out_lines.append('')

out_lines.append('12. DEAD FOLDERS')
for d, files in sorted(dead_folders, key=lambda x: relpath(x[0])):
    out_lines.append(relpath(d) + ' :: ' + ', '.join(files))

out_path = root / 'runtime_audit_report.txt'
out_path.write_text('\n'.join(out_lines), encoding='utf-8')
print(out_path)
PY
python inspect_audit.py