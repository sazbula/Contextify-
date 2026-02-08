import sys
from pathlib import Path
from collections import defaultdict
from import_graph import build_edges


def print_tree(node, children, prefix="", last=True):
    connector = "└─ " if last else "├─ "
    print(prefix + connector + node)

    new_prefix = prefix + ("   " if last else "│  ")
    kids = sorted(children.get(node, []))

    for i, k in enumerate(kids):
        print_tree(k, children, new_prefix, i == len(kids) - 1)


def main():
    if len(sys.argv) < 2:
        print("Usage: python src/print_tree.py <repo_path>")
        return

    repo = Path(sys.argv[1])
    edges_dict = build_edges(repo)
    edges = [(a, b) for a, bs in edges_dict.items() for b in bs]

    children = defaultdict(list)
    all_nodes = set()
    imported = set()

    for a, b in edges:
        children[a].append(b)
        all_nodes.add(a)
        all_nodes.add(b)
        imported.add(b)

    roots = sorted(n for n in all_nodes if n not in imported)

    print("\nPROJECT TREE:")
    for i, r in enumerate(roots):
        print_tree(r, children, "", i == len(roots) - 1)

    parents = {a for a, _ in edges}
    kids = {b for _, b in edges}

    leaves = sorted(n for n in kids if n not in parents)

    print("\nATOMIC (LEAF) CHUNKS:")
    for n in leaves:
        print(" -", n)


if __name__ == "__main__":
    main()