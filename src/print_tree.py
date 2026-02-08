from collections import defaultdict
from import_graph import build_edges


edges_dict = build_edges()
edges_list = [(a, b) for a, bs in edges_dict.items() for b in bs]


children = defaultdict(list)
all_nodes = set()
imported = set()

for a, b in edges_list:
    children[a].append(b)
    all_nodes.add(a)
    all_nodes.add(b)
    imported.add(b)

roots = sorted(n for n in all_nodes if n not in imported)


def print_tree(node, prefix="", last=True):
    connector = "└─ " if last else "├─ "
    print(prefix + connector + node)

    new_prefix = prefix + ("   " if last else "│  ")
    kids = sorted(children.get(node, []))

    for i, k in enumerate(kids):
        print_tree(k, new_prefix, i == len(kids) - 1)


print("\nPROJECT TREE:")
for i, r in enumerate(roots):
    print_tree(r, "", i == len(roots) - 1)


# atomic = leaf nodes
parents = {a for a, _ in edges_list}
children_nodes = {b for _, b in edges_list}

leaves = sorted(n for n in children_nodes if n not in parents)

print("\nATOMIC (LEAF) CHUNKS:")
for n in leaves:
    print(" -", n)
