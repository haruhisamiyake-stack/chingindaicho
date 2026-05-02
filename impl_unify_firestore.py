import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    lines = f.readlines()

# Lines that define the helpers themselves must not be touched
SKIP_PATTERNS = [
    "const getColRef = (path) => collection(db, path);",
    "const getDocRef = (path) => doc(db, path);",
]

results = []
changed = 0
new_lines = []
for i, line in enumerate(lines, 1):
    stripped = line.strip()
    if any(p in stripped for p in SKIP_PATTERNS):
        new_lines.append(line)
        results.append(f"SKIP line {i}: definition line preserved")
        continue
    new_line = line
    if "collection(db," in new_line:
        new_line = new_line.replace("collection(db,", "getColRef(")
        changed += 1
        results.append(f"OK col line {i}: {line.strip()[:80]}")
    if "doc(db," in new_line:
        new_line = new_line.replace("doc(db,", "getDocRef(")
        changed += 1
        results.append(f"OK doc line {i}: {line.strip()[:80]}")
    new_lines.append(new_line)

with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
sys.stdout.buffer.write((f"\nTotal replacements: {changed}\n").encode("utf-8"))
