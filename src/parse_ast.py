import ast
import sys
from pathlib import Path


def parse_file(py_file: Path):
    try:
        code = py_file.read_text(encoding="utf-8")
        tree = ast.parse(code)
    except (SyntaxError, UnicodeDecodeError):
        return

    print(f"\n📄 {py_file}")
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            print("  └─ function:", node.name)
        elif isinstance(node, ast.ClassDef):
            print("  └─ class:", node.name)


def main():
    if len(sys.argv) < 2:
        print("Usage: python src/parse_ast.py <repo_path>")
        return

    repo = Path(sys.argv[1])
    for file in repo.rglob("*.py"):
        parse_file(file)


if __name__ == "__main__":
    main()