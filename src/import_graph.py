import ast
from pathlib import Path
from collections import defaultdict

REPO = Path(r"test_repos\test-repo")


def resolve_base(current_mod, module, level):
    base = module or ""
    if level and level > 0:
        pkg = current_mod.split(".")[:-1]
        pkg = pkg[: max(0, len(pkg) - (level - 1))]
        prefix = ".".join(pkg)
        base = f"{prefix}.{base}".strip(".") if base else prefix
    return base


def get_imports(py_file, current_mod):
    code = py_file.read_text(encoding="utf-8")
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return []

    imports = []

    for n in ast.walk(tree):
        if isinstance(n, ast.Import):
            for a in n.names:
                imports.append(a.name)

        elif isinstance(n, ast.ImportFrom):
            base = resolve_base(current_mod, n.module, n.level or 0)
            if not base:
                continue

            imports.append(base)
            for a in n.names:
                if a.name != "*":
                    imports.append(f"{base}.{a.name}")

    return imports


def build_edges():
    py_files = list(REPO.rglob("*.py"))

    module_map = {}
    for f in py_files:
        rel = f.relative_to(REPO).with_suffix("")
        module_map[".".join(rel.parts)] = f

    edges = defaultdict(set)

    for f in py_files:
        rel = ".".join(f.relative_to(REPO).with_suffix("").parts)
        for imp in get_imports(f, rel):
            for mod in module_map:
                if imp == mod or mod.endswith(imp):
                    edges[rel].add(mod)

    return edges


if __name__ == "__main__":
    edges = build_edges()
    print("IMPORT GRAPH:")
    for src, dsts in edges.items():
        for dst in sorted(dsts):
            print(f"{src} -> {dst}")
