import ast
from pathlib import Path

REPO_PATH = Path(r"test_repos\test-repo")  # later make this a CLI arg


def parse_file(py_file: Path):
    code = py_file.read_text(encoding="utf-8")
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return

    print(f"\n📄 {py_file}")
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            print("  └─ function:", node.name)
        elif isinstance(node, ast.ClassDef):
            print("  └─ class:", node.name)


if __name__ == "__main__":
    for file in REPO_PATH.rglob("*.py"):
        parse_file(file)
